// In-memory job registry with write-through persistence to .studio/db.json.
// Single-user, local tool — no external database needed. Stored on globalThis so
// state survives Next.js dev hot-reloads.

import { EventEmitter } from "node:events";
import fs from "node:fs";
import crypto from "node:crypto";

import { dbFile, studioRoot } from "./config";
import {
  Job,
  JobArtifact,
  JobEvent,
  JobLog,
  JobResult,
  JobStatus,
  RebuildOptions,
  STAGE_ORDER,
  StageId,
  StageState,
  StageStatus,
} from "./types";

type Store = {
  jobs: Map<string, Job>;
  emitters: Map<string, EventEmitter>;
  loaded: boolean;
};

const globalRef = globalThis as unknown as { __scopeStudioStore?: Store };

function store(): Store {
  if (!globalRef.__scopeStudioStore) {
    globalRef.__scopeStudioStore = {
      jobs: new Map(),
      emitters: new Map(),
      loaded: false,
    };
  }
  const s = globalRef.__scopeStudioStore;
  if (!s.loaded) {
    s.loaded = true;
    loadFromDisk(s);
  }
  return s;
}

function loadFromDisk(s: Store) {
  try {
    const raw = fs.readFileSync(dbFile(), "utf8");
    const parsed = JSON.parse(raw) as Job[];
    for (const job of parsed) s.jobs.set(job.id, job);
  } catch {
    // No db yet — start empty.
  }
}

function persist(s: Store) {
  try {
    fs.mkdirSync(studioRoot(), { recursive: true });
    const jobs = [...s.jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
    fs.writeFileSync(dbFile(), JSON.stringify(jobs, null, 2));
  } catch {
    // Persistence is best-effort; the tool still works from memory.
  }
}

function emitter(jobId: string): EventEmitter {
  const s = store();
  let e = s.emitters.get(jobId);
  if (!e) {
    e = new EventEmitter();
    e.setMaxListeners(50);
    s.emitters.set(jobId, e);
  }
  return e;
}

function emit(jobId: string, event: JobEvent) {
  emitter(jobId).emit("event", event);
}

export function subscribe(jobId: string, listener: (event: JobEvent) => void): () => void {
  const e = emitter(jobId);
  e.on("event", listener);
  return () => e.off("event", listener);
}

export function createJob(options: RebuildOptions): Job {
  const s = store();
  const id = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
  const now = Date.now();
  const stages: StageState[] = STAGE_ORDER.map((stageId) => ({
    id: stageId,
    status: "pending" as StageStatus,
  }));
  const job: Job = {
    id,
    createdAt: now,
    updatedAt: now,
    status: "queued",
    options,
    stages,
    logs: [],
    artifacts: [],
    result: {},
  };
  s.jobs.set(id, job);
  persist(s);
  return job;
}

export function getJob(id: string): Job | undefined {
  return store().jobs.get(id);
}

export function listJobs(): Job[] {
  return [...store().jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
}

function touch(job: Job) {
  job.updatedAt = Date.now();
  persist(store());
}

export function setJobStatus(id: string, status: JobStatus) {
  const job = getJob(id);
  if (!job) return;
  job.status = status;
  touch(job);
  emit(id, { type: "done", status });
}

export function setStage(id: string, stageId: StageId, status: StageStatus, error?: string) {
  const job = getJob(id);
  if (!job) return;
  const stage = job.stages.find((s) => s.id === stageId);
  if (!stage) return;
  stage.status = status;
  if (status === "running") stage.startedAt = Date.now();
  if (status === "done" || status === "error" || status === "skipped") {
    stage.finishedAt = Date.now();
  }
  if (error) stage.error = error;
  touch(job);
  emit(id, { type: "stage", stage });
}

export function log(id: string, entry: Omit<JobLog, "ts">) {
  const job = getJob(id);
  if (!job) return;
  const full: JobLog = { ts: Date.now(), ...entry };
  job.logs.push(full);
  if (job.logs.length > 2000) job.logs.splice(0, job.logs.length - 2000);
  touch(job);
  emit(id, { type: "log", log: full });
}

export function addArtifact(id: string, artifact: JobArtifact) {
  const job = getJob(id);
  if (!job) return;
  job.artifacts.push(artifact);
  touch(job);
  emit(id, { type: "artifact", artifact });
}

export function setResult(id: string, patch: Partial<JobResult>) {
  const job = getJob(id);
  if (!job) return;
  job.result = { ...job.result, ...patch };
  touch(job);
  emit(id, { type: "result", result: job.result, status: job.status });
}

export function setBrief(id: string, brief: Job["brief"]) {
  const job = getJob(id);
  if (!job) return;
  job.brief = brief;
  touch(job);
}

export function setCapture(id: string, capture: Job["capture"]) {
  const job = getJob(id);
  if (!job) return;
  job.capture = capture;
  touch(job);
}

export function setJobError(id: string, message: string) {
  const job = getJob(id);
  if (!job) return;
  job.error = message;
  job.status = "error";
  touch(job);
  emit(id, { type: "done", status: "error" });
}
