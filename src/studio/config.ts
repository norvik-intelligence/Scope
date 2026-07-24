// Environment / filesystem configuration for Scope Studio.
//
// Secrets are read from the process environment (loaded from .env.local by Next.js).
// The AI engine authenticates via your local Claude Code login (Claude subscription) —
// there is deliberately no ANTHROPIC_API_KEY requirement here.

import path from "node:path";
import os from "node:os";

export type Secrets = {
  githubToken: string | null;
  vercelToken: string | null;
  vercelTeamId: string | null;
};

export function readSecrets(): Secrets {
  return {
    githubToken: process.env.GITHUB_TOKEN?.trim() || null,
    vercelToken: process.env.VERCEL_TOKEN?.trim() || null,
    vercelTeamId: process.env.VERCEL_TEAM_ID?.trim() || null,
  };
}

/** Root directory that holds the local job database and per-job workspaces. */
export function studioRoot(): string {
  return path.join(process.cwd(), ".studio");
}

export function dbFile(): string {
  return path.join(studioRoot(), "db.json");
}

export function jobsRoot(): string {
  return path.join(studioRoot(), "jobs");
}

export function jobDir(jobId: string): string {
  return path.join(jobsRoot(), jobId);
}

/** Workspace where the generated Next.js project is scaffolded and built. */
export function jobWorkspace(jobId: string): string {
  return path.join(jobDir(jobId), "site");
}

/** Where capture artifacts (screenshots, brief.json) are written. */
export function jobArtifactsDir(jobId: string): string {
  return path.join(jobDir(jobId), "artifacts");
}

/** Path to the design skills already installed in this repo, mirrored into each site. */
export function designSkillsDir(): string {
  return path.join(process.cwd(), ".claude", "skills");
}

/** Path to the generated-site starter template. */
export function siteTemplateDir(): string {
  return path.join(process.cwd(), "studio", "templates", "next-tailwind");
}

/** Detect whether a Claude Code login exists so we can warn early. */
export function claudeConfigDir(): string {
  return process.env.CLAUDE_CONFIG_DIR?.trim() || path.join(os.homedir(), ".claude");
}
