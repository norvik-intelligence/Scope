// Stage 4 — Verify: install deps and build the generated site. On failure, run
// one bounded repair pass with the Claude Agent SDK, then rebuild once.

import { spawn } from "node:child_process";

import { query } from "@anthropic-ai/claude-agent-sdk";

import { jobWorkspace } from "../config";

type Runner = (message: string, level?: "info" | "agent" | "warn") => void;

function run(
  cmd: string,
  args: string[],
  cwd: string,
  onLog: Runner,
): Promise<{ code: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: process.env, shell: false });
    let output = "";
    const push = (buf: Buffer) => {
      const text = buf.toString();
      output += text;
      for (const line of text.split("\n")) {
        const t = line.trimEnd();
        if (t) onLog(t);
      }
    };
    child.stdout.on("data", push);
    child.stderr.on("data", push);
    child.on("close", (code) => resolve({ code: code ?? 1, output }));
    child.on("error", (err) => resolve({ code: 1, output: String(err) }));
  });
}

export async function verify(jobId: string, onLog: Runner): Promise<void> {
  const workspace = jobWorkspace(jobId);

  onLog("Installiere Abhängigkeiten (npm install) …");
  const install = await run("npm", ["install", "--no-audit", "--no-fund"], workspace, onLog);
  if (install.code !== 0) {
    throw new Error("npm install im generierten Projekt fehlgeschlagen.");
  }

  onLog("Baue das generierte Projekt (npm run build) …");
  let build = await run("npm", ["run", "build"], workspace, onLog);
  if (build.code === 0) {
    onLog("Build erfolgreich.");
    return;
  }

  onLog("Build fehlgeschlagen — starte eine Reparatur-Runde mit dem Agent.", "warn");
  await repair(workspace, tailOutput(build.output), onLog);

  onLog("Baue erneut nach Reparatur …");
  build = await run("npm", ["run", "build"], workspace, onLog);
  if (build.code !== 0) {
    throw new Error(
      "Build weiterhin fehlgeschlagen nach Reparatur-Runde. Siehe Logs für Details.",
    );
  }
  onLog("Build nach Reparatur erfolgreich.");
}

async function repair(workspace: string, buildErrors: string, onLog: Runner): Promise<void> {
  const model = process.env.STUDIO_MODEL?.trim();
  const prompt = `Der Build (\`npm run build\`) dieses Next.js-Projekts schlägt fehl. Behebe die
Ursachen, ohne das Design zu verwässern. Führe danach selbst \`npm run build\` aus und arbeite,
bis er grün ist. Build-Ausgabe (gekürzt):

\`\`\`
${buildErrors}
\`\`\``;

  try {
    const response = query({
      prompt,
      options: {
        cwd: workspace,
        settingSources: ["project"],
        permissionMode: "bypassPermissions",
        ...(model ? { model } : {}),
      },
    });
    for await (const message of response) {
      const m = message as Record<string, unknown>;
      if (m.type === "assistant") {
        const msg = m.message as { content?: unknown } | undefined;
        const content = msg?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            const b = block as Record<string, unknown>;
            if (b.type === "text" && typeof b.text === "string" && b.text.trim()) {
              onLog(b.text.trim(), "agent");
            }
          }
        }
      }
    }
  } catch (err) {
    onLog(`Reparatur-Runde konnte nicht abgeschlossen werden: ${String(err)}`, "warn");
  }
}

function tailOutput(output: string, lines = 120): string {
  return output.split("\n").slice(-lines).join("\n");
}
