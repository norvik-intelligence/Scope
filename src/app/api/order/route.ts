type OrderRequest = {
  mode?: unknown;
  company?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  services?: unknown;
  total?: unknown;
};

function clean(value: unknown, maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  let body: OrderRequest;

  try {
    body = (await request.json()) as OrderRequest;
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const mode = clean(body.mode, 20);
  const company = clean(body.company, 90);
  const name = clean(body.name, 90);
  const email = clean(body.email, 180).toLowerCase();
  const services = Array.isArray(body.services)
    ? body.services.filter((item) => typeof item === "string").slice(0, 10)
    : [];
  const total = typeof body.total === "number" && Number.isFinite(body.total)
    ? Math.max(0, Math.round(body.total))
    : 0;

  if (!company || !name || !isEmail(email)) {
    return Response.json(
      { error: "Bitte prüfen Sie Name und E-Mail-Adresse." },
      { status: 422 },
    );
  }

  if (mode === "order" && (!services.length || total <= 0)) {
    return Response.json(
      { error: "Bitte wählen Sie mindestens eine Maßnahme." },
      { status: 422 },
    );
  }

  const date = new Date();
  const reference = `${mode === "order" ? "SO" : "ST"}-${date
    .toISOString()
    .slice(2, 10)
    .replaceAll("-", "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  return Response.json({
    orderId: reference,
    status: "received",
    message:
      mode === "order"
        ? `Die Projektanfrage für ${company} wurde vorbereitet. Nach Anschluss des E-Mail- und Zahlungsproviders wird die verbindliche Freigabe automatisch an ${email} versendet.`
        : `Der Terminwunsch für ${company} wurde erfasst. Nach Anschluss des Kalenderproviders erhält ${email} automatisch die verfügbaren Termine.`,
  });
}
