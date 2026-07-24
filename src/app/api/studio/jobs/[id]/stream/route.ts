import { getJob, subscribe } from "@/studio/jobs";
import { JobEvent } from "@/studio/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: RouteContext<"/api/studio/jobs/[id]/stream">) {
  const { id } = await ctx.params;
  const job = getJob(id);
  if (!job) return new Response("Job nicht gefunden.", { status: 404 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (event: JobEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Initial snapshot so a late subscriber sees full current state.
      send({ type: "snapshot", job: getJob(id)! });

      const unsubscribe = subscribe(id, (event) => {
        send(event);
        if (event.type === "done") {
          setTimeout(() => close(), 50);
        }
      });

      // If the job already finished before subscription, close promptly.
      const current = getJob(id);
      if (current && (current.status === "done" || current.status === "error")) {
        setTimeout(() => close(), 50);
      }

      // Keep-alive comments to prevent idle proxies from closing the stream.
      const keepAlive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
        } catch {
          closed = true;
        }
      }, 15000);

      function close() {
        if (closed) return;
        closed = true;
        clearInterval(keepAlive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      }

      request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
