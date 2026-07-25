import fs from "node:fs";
import path from "node:path";

import { jobDir } from "@/studio/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json",
};

export async function GET(_req: Request, ctx: RouteContext<"/api/studio/artifacts/[...path]">) {
  const { path: segments } = await ctx.params;
  if (!segments || segments.length < 2) {
    return new Response("Not found", { status: 404 });
  }
  const [jobId, ...rest] = segments;
  const base = jobDir(jobId);
  const target = path.resolve(base, ...rest);

  // Prevent path traversal outside the job directory.
  if (target !== base && !target.startsWith(base + path.sep)) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const data = fs.readFileSync(target);
  const type = TYPES[path.extname(target).toLowerCase()] ?? "application/octet-stream";
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": type, "Cache-Control": "no-store" },
  });
}
