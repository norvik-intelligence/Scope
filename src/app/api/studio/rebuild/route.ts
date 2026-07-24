import { createJob } from "@/studio/jobs";
import { runJob } from "@/studio/pipeline/orchestrator";
import { RebuildOptions } from "@/studio/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const url = str(body.url, 400);
  if (url.length < 3) {
    return Response.json({ error: "Bitte eine Website-URL angeben." }, { status: 422 });
  }

  const options: RebuildOptions = {
    url,
    slug: str(body.slug, 60) || undefined,
    privateRepo: body.privateRepo !== false,
    skipPublish: body.skipPublish === true,
    skipDeploy: body.skipDeploy === true,
  };

  const job = createJob(options);

  // Fire-and-forget: the pipeline runs in the background and streams progress
  // over /api/studio/jobs/[id]/stream. Requires the app to run as a long-lived
  // local Node process (npm run studio), not a serverless function.
  void runJob(job.id).catch(() => {
    // Errors are recorded on the job itself by the orchestrator.
  });

  return Response.json({ jobId: job.id });
}
