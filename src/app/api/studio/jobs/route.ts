import { listJobs } from "@/studio/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Return a compact list for the projects sidebar.
  const jobs = listJobs().map((job) => ({
    id: job.id,
    createdAt: job.createdAt,
    status: job.status,
    url: job.options.url,
    brand: job.brief?.brand ?? null,
    deploymentUrl: job.result.deploymentUrl ?? null,
    repoUrl: job.result.repoUrl ?? null,
  }));
  return Response.json({ jobs });
}
