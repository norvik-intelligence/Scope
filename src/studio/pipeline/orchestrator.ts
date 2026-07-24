// Orchestrator — runs the six pipeline stages for a job, updating the job store
// (which streams progress to the control panel via SSE). Invoked fire-and-forget.

import { readSecrets } from "../config";
import {
  addArtifact,
  getJob,
  log,
  setBrief,
  setCapture,
  setJobError,
  setJobStatus,
  setResult,
  setStage,
} from "../jobs";
import { StageId } from "../types";
import { buildBrief } from "./brief";
import { capture, normalizeUrl } from "./capture";
import { deploy } from "./vercel";
import { generate } from "./generate";
import { publish } from "./github";
import { verify } from "./verify";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "premium-site"
  );
}

export async function runJob(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) return;
  const { options } = job;
  const secrets = readSecrets();

  setJobStatus(jobId, "running");
  const logInfo = (stage: StageId | "system", message: string, level: "info" | "agent" | "warn" | "error" = "info") =>
    log(jobId, { stage, level, message });

  try {
    let url: string;
    try {
      url = normalizeUrl(options.url);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Ungültige URL.");
    }
    const slug = slugify(options.slug || url);

    // Stage 1 — Capture
    setStage(jobId, "capture", "running");
    const captured = await capture(jobId, url, (m) => logInfo("capture", m));
    setCapture(jobId, captured);
    for (const shot of captured.screenshots) {
      addArtifact(jobId, { stage: "capture", kind: "screenshot", path: shot, label: "Quelle" });
    }
    setStage(jobId, "capture", "done");

    // Stage 2 — Brief
    setStage(jobId, "brief", "running");
    const brief = buildBrief(jobId, captured);
    setBrief(jobId, brief);
    logInfo("brief", `Branche erkannt: ${brief.industry} · Marke: ${brief.brand}`);
    setStage(jobId, "brief", "done");

    // Stage 3 — Generate
    setStage(jobId, "generate", "running");
    await generate(jobId, brief, captured, (m, lvl) => logInfo("generate", m, lvl));
    setStage(jobId, "generate", "done");

    // Stage 4 — Verify / Build
    setStage(jobId, "verify", "running");
    await verify(jobId, (m, lvl) => logInfo("verify", m, lvl));
    setStage(jobId, "verify", "done");

    // Stage 5 — Publish to GitHub
    let published: { repoUrl: string; repoFullName: string; owner: string; repo: string } | null =
      null;
    if (options.skipPublish) {
      logInfo("publish", "Übersprungen (skipPublish).");
      setStage(jobId, "publish", "skipped");
    } else if (!secrets.githubToken) {
      logInfo("publish", "GITHUB_TOKEN fehlt — GitHub-Push übersprungen.", "warn");
      setStage(jobId, "publish", "skipped");
    } else {
      setStage(jobId, "publish", "running");
      published = await publish(
        jobId,
        secrets.githubToken,
        slug,
        options.privateRepo,
        (m) => logInfo("publish", m),
      );
      setResult(jobId, { repoUrl: published.repoUrl, repoFullName: published.repoFullName });
      setStage(jobId, "publish", "done");
    }

    // Stage 6 — Deploy to Vercel
    if (options.skipDeploy) {
      logInfo("deploy", "Übersprungen (skipDeploy).");
      setStage(jobId, "deploy", "skipped");
    } else if (!published) {
      logInfo("deploy", "Kein GitHub-Repo — Vercel-Deploy übersprungen.", "warn");
      setStage(jobId, "deploy", "skipped");
    } else if (!secrets.vercelToken) {
      logInfo("deploy", "VERCEL_TOKEN fehlt — Vercel-Deploy übersprungen.", "warn");
      setStage(jobId, "deploy", "skipped");
    } else {
      setStage(jobId, "deploy", "running");
      const d = await deploy(
        secrets.vercelToken,
        secrets.vercelTeamId,
        published.owner,
        published.repo,
        (m, lvl) => logInfo("deploy", m, lvl),
      );
      setResult(jobId, { deploymentUrl: d.deploymentUrl, previewUrl: d.deploymentUrl });
      setStage(jobId, "deploy", "done");
    }

    setResult(jobId, { clientMessage: buildClientMessage(jobId) });
    setJobStatus(jobId, "done");
    logInfo("system", "Fertig.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const current = getJob(jobId);
    const running = current?.stages.find((s) => s.status === "running");
    if (running) setStage(jobId, running.id, "error", message);
    logInfo("system", message, "error");
    setJobError(jobId, message);
  }
}

function buildClientMessage(jobId: string): string {
  const job = getJob(jobId);
  if (!job) return "";
  const brand = job.brief?.brand ?? "Ihr Unternehmen";
  const live = job.result.deploymentUrl || job.result.previewUrl;
  const lines = [
    `Hallo,`,
    ``,
    `hier ist der erste Entwurf des neuen Webauftritts für ${brand} — komplett neu`,
    `gestaltet auf aktuellem Premium-Design-Niveau.`,
  ];
  if (live) lines.push(``, `Live ansehen: ${live}`);
  if (job.result.repoUrl) lines.push(`Code: ${job.result.repoUrl}`);
  lines.push(``, `Sagen Sie mir gern Ihr Feedback, dann feinjustiere ich Inhalte und Details.`);
  return lines.join("\n");
}
