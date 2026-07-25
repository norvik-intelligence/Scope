// Shared types for Scope Studio — the inhouse "URL → premium site → GitHub → Vercel" tool.

export type StageId =
  | "capture"
  | "brief"
  | "generate"
  | "verify"
  | "publish"
  | "deploy";

export const STAGE_ORDER: StageId[] = [
  "capture",
  "brief",
  "generate",
  "verify",
  "publish",
  "deploy",
];

export const STAGE_LABELS: Record<StageId, string> = {
  capture: "Website erfassen",
  brief: "Design-Brief ableiten",
  generate: "Premium-Website bauen",
  verify: "Build prüfen",
  publish: "Nach GitHub pushen",
  deploy: "Auf Vercel deployen",
};

export type StageStatus = "pending" | "running" | "done" | "skipped" | "error";
export type JobStatus = "queued" | "running" | "done" | "error";

export type RebuildOptions = {
  /** Source website URL to reinterpret. */
  url: string;
  /** Desired repo/project slug; auto-derived from the URL when empty. */
  slug?: string;
  /** Create the GitHub repo as private (default true). */
  privateRepo: boolean;
  /** Skip the GitHub push stage (local-only run). */
  skipPublish: boolean;
  /** Skip the Vercel deploy stage. */
  skipDeploy: boolean;
};

export type CaptureResult = {
  url: string;
  finalUrl: string;
  title: string;
  description: string;
  headings: string[];
  /** Longest readable text blocks, trimmed. */
  textBlocks: string[];
  /** Detected brand colors as hex, most frequent first. */
  colors: string[];
  /** Detected font-family stacks. */
  fonts: string[];
  logoUrl: string | null;
  /** Relative artifact paths (screenshots) within the job dir. */
  screenshots: string[];
};

export type DesignBrief = {
  brand: string;
  industry: string;
  audience: string;
  tone: string;
  valueProposition: string;
  palette: string[];
  fonts: string[];
  sections: string[];
  language: string;
  notes: string;
};

export type StageState = {
  id: StageId;
  status: StageStatus;
  startedAt?: number;
  finishedAt?: number;
  error?: string;
};

export type JobLog = {
  ts: number;
  stage: StageId | "system";
  level: "info" | "agent" | "warn" | "error";
  message: string;
};

export type JobArtifact = {
  stage: StageId;
  kind: "screenshot" | "file";
  /** Path relative to the job directory, served via /api/studio/artifacts. */
  path: string;
  label?: string;
};

export type JobResult = {
  repoUrl?: string;
  repoFullName?: string;
  deploymentUrl?: string;
  previewUrl?: string;
  clientMessage?: string;
};

export type Job = {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: JobStatus;
  options: RebuildOptions;
  stages: StageState[];
  logs: JobLog[];
  artifacts: JobArtifact[];
  brief?: DesignBrief;
  capture?: CaptureResult;
  result: JobResult;
  error?: string;
};

/** Server-Sent-Events payload pushed to the control panel. */
export type JobEvent =
  | { type: "snapshot"; job: Job }
  | { type: "stage"; stage: StageState }
  | { type: "log"; log: JobLog }
  | { type: "artifact"; artifact: JobArtifact }
  | { type: "result"; result: JobResult; status: JobStatus }
  | { type: "done"; status: JobStatus };
