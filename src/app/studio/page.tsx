"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  Job,
  JobArtifact,
  JobEvent,
  JobLog,
  STAGE_LABELS,
  STAGE_ORDER,
  StageState,
  StageStatus,
} from "@/studio/types";

type JobSummary = {
  id: string;
  createdAt: number;
  status: string;
  url: string;
  brand: string | null;
  deploymentUrl: string | null;
  repoUrl: string | null;
};

const STATUS_DOT: Record<StageStatus, string> = {
  pending: "bg-neutral-600",
  running: "bg-amber-400 animate-pulse",
  done: "bg-emerald-400",
  skipped: "bg-neutral-500",
  error: "bg-red-500",
};

const LEVEL_COLOR: Record<JobLog["level"], string> = {
  info: "text-neutral-300",
  agent: "text-sky-300",
  warn: "text-amber-300",
  error: "text-red-300",
};

export default function StudioPage() {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [privateRepo, setPrivateRepo] = useState(true);
  const [skipPublish, setSkipPublish] = useState(false);
  const [skipDeploy, setSkipDeploy] = useState(false);

  const [job, setJob] = useState<Job | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<JobSummary[]>([]);

  const sourceRef = useRef<EventSource | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  const refreshProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/studio/jobs");
      const data = await res.json();
      setProjects(data.jobs ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    // Initial load; setState only runs asynchronously after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshProjects();
    return () => sourceRef.current?.close();
  }, [refreshProjects]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [job?.logs.length]);

  const connect = useCallback(
    (jobId: string) => {
      sourceRef.current?.close();
      const es = new EventSource(`/api/studio/jobs/${jobId}/stream`);
      sourceRef.current = es;
      es.onmessage = (ev) => {
        const event = JSON.parse(ev.data) as JobEvent;
        setJob((prev) => reduce(prev, event));
        if (event.type === "done") {
          es.close();
          refreshProjects();
        }
      };
      es.onerror = () => es.close();
    },
    [refreshProjects],
  );

  const start = useCallback(async () => {
    setError(null);
    setStarting(true);
    setJob(null);
    try {
      const res = await fetch("/api/studio/rebuild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, slug, privateRepo, skipPublish, skipDeploy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Start fehlgeschlagen.");
      connect(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  }, [url, slug, privateRepo, skipPublish, skipDeploy, connect]);

  const openProject = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/studio/jobs/${id}`);
      const data = await res.json();
      if (data.job) {
        setJob(data.job as Job);
        if (data.job.status === "running") connect(id);
      }
    },
    [connect],
  );

  const sourceShot = job?.artifacts.find((a) => a.stage === "capture" && a.kind === "screenshot");
  const live = job?.result.deploymentUrl || job?.result.previewUrl;
  const running = job?.status === "running";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500" />
              Scope Studio
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              URL rein · Premium-Website raus · nach GitHub &amp; Vercel.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <label className="text-xs font-medium text-neutral-400">Website-URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="beispiel.de"
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
            <label className="mt-3 block text-xs font-medium text-neutral-400">
              Repo-Name (optional)
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto aus URL"
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />

            <div className="mt-3 space-y-2 text-sm">
              <Toggle label="Privates Repo" checked={privateRepo} onChange={setPrivateRepo} />
              <Toggle label="GitHub-Push überspringen" checked={skipPublish} onChange={setSkipPublish} />
              <Toggle label="Vercel-Deploy überspringen" checked={skipDeploy} onChange={setSkipDeploy} />
            </div>

            <button
              onClick={start}
              disabled={starting || running || url.trim().length < 3}
              className="mt-4 w-full rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {running ? "Läuft …" : starting ? "Starte …" : "Rebuild & Ship"}
            </button>
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="mb-2 text-xs font-medium text-neutral-400">Projekte</div>
            <div className="flex max-h-72 flex-col gap-1 overflow-auto">
              {projects.length === 0 && (
                <p className="text-xs text-neutral-500">Noch keine Läufe.</p>
              )}
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openProject(p.id)}
                  className="rounded-lg px-2 py-1.5 text-left text-xs hover:bg-neutral-800"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${jobDot(p.status)}`} />
                    <span className="truncate">{p.brand || hostOf(p.url)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex flex-col gap-6">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
            <h2 className="text-sm font-medium text-neutral-400">Pipeline</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {STAGE_ORDER.map((id) => {
                const st = job?.stages.find((s) => s.id === id);
                return <StageCard key={id} id={id} state={st} />;
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <h2 className="mb-3 text-sm font-medium text-neutral-400">Vorher / Nachher</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <figure className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
                  <figcaption className="border-b border-neutral-800 px-3 py-1.5 text-xs text-neutral-500">
                    Quelle
                  </figcaption>
                  {sourceShot && job ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/studio/artifacts/${job.id}/${sourceShot.path}`}
                      alt="Quelle"
                      className="max-h-72 w-full object-cover object-top"
                    />
                  ) : (
                    <Empty>wartet auf Capture</Empty>
                  )}
                </figure>
                <figure className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
                  <figcaption className="border-b border-neutral-800 px-3 py-1.5 text-xs text-neutral-500">
                    Neu (live)
                  </figcaption>
                  {live ? (
                    <iframe src={live} title="Vorschau" className="h-72 w-full bg-white" />
                  ) : (
                    <Empty>wartet auf Deployment</Empty>
                  )}
                </figure>
              </div>

              {job?.result && (live || job.result.repoUrl) && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {live && (
                    <a
                      href={live}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30"
                    >
                      Live öffnen ↗
                    </a>
                  )}
                  {job.result.repoUrl && (
                    <a
                      href={job.result.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200"
                    >
                      GitHub ↗
                    </a>
                  )}
                  {job.result.clientMessage && (
                    <button
                      onClick={() => navigator.clipboard?.writeText(job.result.clientMessage!)}
                      className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200"
                    >
                      Kunden-Nachricht kopieren
                    </button>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
              <h2 className="mb-3 text-sm font-medium text-neutral-400">Live-Log</h2>
              <div
                ref={logRef}
                className="h-80 overflow-auto rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs leading-relaxed"
              >
                {!job && <p className="text-neutral-600">Noch nichts gestartet.</p>}
                {job?.logs.map((l, i) => (
                  <div key={i} className={LEVEL_COLOR[l.level]}>
                    <span className="text-neutral-600">[{l.stage}]</span> {l.message}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function StageCard({ id, state }: { id: (typeof STAGE_ORDER)[number]; state?: StageState }) {
  const status = state?.status ?? "pending";
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
        <span className="text-xs font-medium text-neutral-200">{STAGE_LABELS[id]}</span>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-500">{status}</p>
      {state?.error && <p className="mt-1 text-[10px] text-red-400">{state.error}</p>}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-neutral-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`h-5 w-9 rounded-full transition ${checked ? "bg-sky-500" : "bg-neutral-700"}`}
      >
        <span
          className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white transition ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-72 items-center justify-center text-xs text-neutral-600">{children}</div>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(/^https?:\/\//.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function jobDot(status: string): string {
  if (status === "done") return "bg-emerald-400";
  if (status === "running") return "bg-amber-400";
  if (status === "error") return "bg-red-500";
  return "bg-neutral-600";
}

// Apply an incoming SSE event to the current job snapshot.
function reduce(prev: Job | null, event: JobEvent): Job | null {
  if (event.type === "snapshot") return event.job;
  if (!prev) return prev;
  const next: Job = { ...prev };
  switch (event.type) {
    case "stage":
      next.stages = prev.stages.map((s) => (s.id === event.stage.id ? event.stage : s));
      break;
    case "log":
      next.logs = [...prev.logs, event.log as JobLog];
      break;
    case "artifact":
      next.artifacts = [...prev.artifacts, event.artifact as JobArtifact];
      break;
    case "result":
      next.result = event.result;
      next.status = event.status;
      break;
    case "done":
      next.status = event.status;
      break;
  }
  return next;
}
