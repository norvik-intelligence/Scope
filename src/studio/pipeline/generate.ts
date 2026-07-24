// Stage 3 — Generate: scaffold a fresh Next.js + Tailwind project, mirror the
// installed design skills into it, then drive the Claude Agent SDK to build a
// premium, industry-styled reinterpretation of the source site.
//
// Auth: the Agent SDK uses your local Claude Code login (Claude subscription).
// No ANTHROPIC_API_KEY is required.

import fs from "node:fs";
import path from "node:path";

import { query } from "@anthropic-ai/claude-agent-sdk";

import {
  designSkillsDir,
  jobArtifactsDir,
  jobWorkspace,
  siteTemplateDir,
} from "../config";
import { CaptureResult, DesignBrief } from "../types";

export async function generate(
  jobId: string,
  brief: DesignBrief,
  capture: CaptureResult,
  onLog: (message: string, level?: "info" | "agent" | "warn") => void,
): Promise<void> {
  const workspace = jobWorkspace(jobId);
  scaffold(jobId, workspace, brief, capture, onLog);

  const prompt = buildPrompt(brief, capture);
  onLog("Starte Design-Agent (Claude) mit den installierten Design-Skills …");

  const model = process.env.STUDIO_MODEL?.trim();
  let sawResult = false;

  try {
    const response = query({
      prompt,
      options: {
        cwd: workspace,
        // Load the workspace's .claude/skills (design skills) + .mcp.json.
        settingSources: ["project"],
        permissionMode: "bypassPermissions",
        ...(model ? { model } : {}),
        systemPrompt: {
          type: "preset",
          preset: "claude_code",
          append:
            "You are a senior design engineer building a production landing page. " +
            "Aggressively apply the installed design skills (design-taste-frontend, " +
            "impeccable, emil-design-eng, high-end-visual-design). Never ship generic " +
            "AI-slop UI. Keep the project building cleanly with `npm run build`.",
        },
      },
    });

    for await (const message of iterate(response)) {
      const m = message as Record<string, unknown>;
      if (m.type === "assistant") {
        for (const text of extractAssistantText(m)) {
          if (text.trim()) onLog(text.trim(), "agent");
        }
      } else if (m.type === "result") {
        sawResult = true;
        const isError = m.is_error === true || m.subtype === "error_max_turns";
        onLog(
          isError
            ? `Agent beendet (mit Hinweis): ${String(m.subtype ?? "unbekannt")}`
            : "Design-Agent fertig.",
          isError ? "warn" : "info",
        );
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/login|auth|unauthor|credential/i.test(msg)) {
      throw new Error(
        "Claude-Code-Login nicht gefunden. Bitte einmalig `claude` ausführen und mit " +
          "deinem Claude-Abo einloggen, dann erneut starten. (Detail: " +
          msg +
          ")",
      );
    }
    throw new Error(`Design-Agent fehlgeschlagen: ${msg}`);
  }

  if (!sawResult) {
    onLog("Agent-Stream endete ohne result-Nachricht — prüfe den Build.", "warn");
  }
  // Sanity: page must exist.
  const page = path.join(workspace, "src", "app", "page.tsx");
  if (!fs.existsSync(page)) {
    throw new Error("Der Agent hat keine src/app/page.tsx erzeugt.");
  }
}

/** Copy the template, mirror skills, and drop the brief + assets in for the agent. */
function scaffold(
  jobId: string,
  workspace: string,
  brief: DesignBrief,
  capture: CaptureResult,
  onLog: (message: string) => void,
) {
  fs.rmSync(workspace, { recursive: true, force: true });
  fs.mkdirSync(workspace, { recursive: true });

  const template = siteTemplateDir();
  if (!fs.existsSync(template)) {
    throw new Error(`Site-Template fehlt: ${template}`);
  }
  fs.cpSync(template, workspace, { recursive: true });
  // package-lock is intentionally absent in the template; npm install resolves it.
  onLog("Next.js + Tailwind Starter kopiert");

  // Mirror the design skills so the Agent SDK loads them via settingSources: project.
  const skills = designSkillsDir();
  if (fs.existsSync(skills)) {
    const dest = path.join(workspace, ".claude", "skills");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(skills, dest, { recursive: true });
    onLog("Design-Skills in den Workspace gespiegelt");
  } else {
    onLog("Warnung: .claude/skills nicht gefunden — Agent läuft ohne Design-Skills");
  }

  // Drop the brief + source screenshots where the agent can read them.
  const brandDir = path.join(workspace, "brand");
  fs.mkdirSync(brandDir, { recursive: true });
  fs.writeFileSync(path.join(brandDir, "brief.json"), JSON.stringify(brief, null, 2));
  const artifacts = jobArtifactsDir(jobId);
  for (const rel of capture.screenshots) {
    const src = path.join(path.dirname(artifacts), rel);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(brandDir, path.basename(src)));
    }
  }
}

function buildPrompt(brief: DesignBrief, capture: CaptureResult): string {
  const content = capture.textBlocks.slice(0, 20).map((t) => `- ${t}`).join("\n");
  const headings = capture.headings.slice(0, 20).map((t) => `- ${t}`).join("\n");
  return `Baue eine erstklassige, produktionsreife Landingpage als Premium-Neuinterpretation
der Website "${brief.brand}" (Quelle: ${capture.finalUrl}). Dies ist KEIN 1:1-Klon — übernimm
Inhalt und Marke, gestalte aber Layout, Typografie, Spacing, Farbe und Motion auf Agentur-Niveau neu.

PFLICHT: Nutze aktiv die installierten Skills — beginne mit \`design-taste-frontend\` und
\`impeccable\`, ziehe \`emil-design-eng\` und \`high-end-visual-design\` heran. Vermeide generische
AI-Slop-Optik (kein Inter/Purple-Gradient-Klischee, keine Karten-in-Karten).

Brief (siehe auch brand/brief.json und die Screenshots in brand/):
- Marke: ${brief.brand}
- Branche: ${brief.industry}
- Zielgruppe: ${brief.audience}
- Tonalität: ${brief.tone}
- Sprache der Texte: ${brief.language}
- Wertversprechen: ${brief.valueProposition}
- Palette (Startpunkt, gerne verfeinern): ${brief.palette.join(", ")}
- Sektionen: ${brief.sections.join(" · ")}

Echte Überschriften der Quelle:
${headings || "(keine)"}

Echte Textbausteine der Quelle:
${content || "(keine)"}

Technisch:
- Das Projekt ist bereits Next.js (App Router) + Tailwind v4 (siehe package.json, src/app/).
- Baue alles in src/app/page.tsx plus Komponenten unter src/components/. Passe src/app/globals.css
  und src/app/layout.tsx (Metadata, Fonts) an.
- Verwende echte Inhalte aus dem Brief — KEIN Lorem Ipsum.
- Responsiv, zugänglich (Kontrast, semantische Landmarks), dezente, hochwertige Micro-Motion.
- Halte das Projekt jederzeit baubar: es MUSS \`npm run build\` bestehen. Führe den Build am Ende
  selbst aus und behebe Fehler, bis er grün ist.

Liefere am Ende eine fertige, buildbare Seite.`;
}

// The SDK returns an AsyncGenerator; wrap defensively.
async function* iterate(response: AsyncIterable<unknown>): AsyncGenerator<unknown> {
  for await (const m of response) yield m;
}

function extractAssistantText(m: Record<string, unknown>): string[] {
  const out: string[] = [];
  const message = m.message as { content?: unknown } | undefined;
  const content = message?.content;
  if (typeof content === "string") {
    out.push(content);
  } else if (Array.isArray(content)) {
    for (const block of content) {
      const b = block as Record<string, unknown>;
      if (b.type === "text" && typeof b.text === "string") out.push(b.text);
      else if (b.type === "tool_use" && typeof b.name === "string") {
        out.push(`↪ Tool: ${b.name}`);
      }
    }
  }
  return out;
}
