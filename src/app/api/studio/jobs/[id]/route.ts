import { getJob } from "@/studio/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext<"/api/studio/jobs/[id]">) {
  const { id } = await ctx.params;
  const job = getJob(id);
  if (!job) return Response.json({ error: "Job nicht gefunden." }, { status: 404 });
  return Response.json({ job });
}
