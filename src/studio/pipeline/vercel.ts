// Stage 6 — Deploy: trigger a production deployment on Vercel from the new GitHub
// repo, poll until it is READY, and return the live URL.
//
// Requires: a Vercel token and the Vercel↔GitHub app installed on the account so
// Vercel can access the repo. On failure we surface a clear, actionable message.

import { Vercel } from "@vercel/sdk";

type DeployResult = { deploymentUrl: string; inspectorUrl?: string };

export async function deploy(
  token: string,
  teamId: string | null,
  owner: string,
  repo: string,
  onLog: (message: string, level?: "info" | "warn") => void,
): Promise<DeployResult> {
  const vercel = new Vercel({ bearerToken: token });
  const scope = teamId ? { teamId } : {};

  onLog(`Erstelle Vercel-Deployment aus ${owner}/${repo} …`);

  let created: Record<string, unknown>;
  try {
    created = (await vercel.deployments.createDeployment({
      ...scope,
      requestBody: {
        name: repo,
        target: "production",
        gitSource: { type: "github", org: owner, repo, ref: "main" },
        projectSettings: { framework: "nextjs" },
      },
    })) as unknown as Record<string, unknown>;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      "Vercel-Deployment konnte nicht gestartet werden. Stelle sicher, dass die Vercel-GitHub-App " +
        "Zugriff auf das Repo hat (einmalig unter vercel.com verbinden) und der VERCEL_TOKEN gültig ist. " +
        `(Detail: ${msg})`,
    );
  }

  const id = String(created.id ?? "");
  const inspectorUrl = created.inspectorUrl ? String(created.inspectorUrl) : undefined;
  let url = created.url ? String(created.url) : "";
  onLog(`Deployment gestartet (${id || "?"}). Warte auf Fertigstellung …`);

  const deadline = Date.now() + 5 * 60_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    let detail: Record<string, unknown>;
    try {
      detail = (await vercel.deployments.getDeployment({
        idOrUrl: id || url,
        ...scope,
      })) as unknown as Record<string, unknown>;
    } catch {
      continue;
    }
    const state = String(detail.readyState ?? detail.status ?? "").toUpperCase();
    if (detail.url) url = String(detail.url);
    if (state) onLog(`Vercel-Status: ${state}`);
    if (state === "READY") {
      const alias = firstAlias(detail);
      const live = alias || url;
      return { deploymentUrl: `https://${live}`, inspectorUrl };
    }
    if (state === "ERROR" || state === "CANCELED") {
      throw new Error(`Vercel-Deployment endete mit Status ${state}. Inspector: ${inspectorUrl ?? "?"}`);
    }
  }

  onLog("Zeitlimit erreicht — Deployment läuft evtl. noch. URL wird trotzdem zurückgegeben.", "warn");
  return { deploymentUrl: url ? `https://${url}` : "", inspectorUrl };
}

function firstAlias(detail: Record<string, unknown>): string | null {
  const alias = detail.alias;
  if (Array.isArray(alias) && alias.length && typeof alias[0] === "string") return alias[0];
  return null;
}
