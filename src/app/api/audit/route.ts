type AuditRequest = {
  company?: unknown;
  website?: unknown;
  industry?: unknown;
  goal?: unknown;
};

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function hash(input: string) {
  return [...input].reduce((total, character) => {
    return (total * 31 + character.charCodeAt(0)) % 9973;
  }, 17);
}

function normalizeWebsite(value: string) {
  if (!value) return "";
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export async function POST(request: Request) {
  let body: AuditRequest;

  try {
    body = (await request.json()) as AuditRequest;
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const company = text(body.company, 90);
  const website = normalizeWebsite(text(body.website, 180));
  const industry = text(body.industry, 90);
  const goal = text(body.goal, 120) || "Mehr qualifizierte Anfragen";

  if (company.length < 2 || industry.length < 2) {
    return Response.json(
      { error: "Unternehmen und Branche werden benötigt." },
      { status: 422 },
    );
  }

  const seed = hash(`${company}-${website}-${industry}-${goal}`);
  const base = 59 + (seed % 14);
  const categoryBlueprints = [
    {
      name: "Positionierung",
      offset: 7,
      insight: "Die Leistung ist nachvollziehbar, der konkrete Unterschied zum Wettbewerb kann jedoch schneller sichtbar werden.",
    },
    {
      name: "Marke & Vertrauen",
      offset: 4,
      insight: "Glaubwürdige Grundlagen sind vorhanden. Systematische Beweise und eine konsistente visuelle Sprache fehlen noch.",
    },
    {
      name: "Website & Conversion",
      offset: -5,
      insight: "Die digitale Strecke sollte stärker auf einen einzigen nächsten Schritt und qualifizierte Anfragen ausgerichtet werden.",
    },
    {
      name: "Sichtbarkeit & SEO",
      offset: -2,
      insight: "Relevante Suchintentionen werden noch nicht vollständig durch klare Leistungs- und Standortseiten abgedeckt.",
    },
    {
      name: "Angebot & Vertrieb",
      offset: 9,
      insight: "Das Leistungsangebot ist tragfähig. Pakete, Ergebnisversprechen und Preislogik können den Abschluss vereinfachen.",
    },
    {
      name: "Prozesse & Skalierung",
      offset: 1,
      insight: "Wiederkehrende Schritte bieten Potenzial für Automatisierung und einen schnelleren Übergang vom Lead zum Auftrag.",
    },
  ];

  const categories = categoryBlueprints.map((category, index) => {
    const variance = ((seed >> (index % 5)) % 7) - 3;
    const score = Math.min(88, Math.max(48, base + category.offset + variance));
    const delta = Math.max(7, Math.min(23, 92 - score - (index % 4)));
    return { ...category, score, delta };
  });

  const score = Math.round(
    categories.reduce((total, category) => total + category.score, 0) /
      categories.length,
  );
  const potential = Math.round(
    categories.reduce((total, category) => total + category.delta, 0) /
      categories.length,
  );

  const priorities = [
    {
      id: "positioning",
      title: "Kernbotschaft auf ein klares Versprechen zuspitzen",
      copy: `Formulieren Sie für ${company} einen Einstieg, der Zielkunde, Ergebnis und glaubwürdigen Unterschied in wenigen Sekunden verbindet.`,
      impact: "Hoch" as const,
      effort: "1–2 Wochen",
      service: "Positionierung & Copy-System",
      price: 2900,
    },
    {
      id: "website",
      title: "Website als geführte Entscheidungsstrecke neu ordnen",
      copy: `Bauen Sie eine moderne Seitenstruktur, die Besucher von ihrem Problem über Beweise direkt zur passenden Anfrage führt.`,
      impact: "Hoch" as const,
      effort: "4–6 Wochen",
      service: "Conversion Website",
      price: 6800,
    },
    {
      id: "visibility",
      title: "Nachfrage über Suchintentionen systematisch abholen",
      copy: `Erstellen Sie priorisierte Leistungsseiten für kaufnahe Suchanfragen in ${industry} und verbinden Sie sie mit lokaler Sichtbarkeit.`,
      impact: "Mittel" as const,
      effort: "3–5 Wochen",
      service: "SEO Growth Sprint",
      price: 3500,
    },
    {
      id: "automation",
      title: "Lead-to-Order-Prozess messbar beschleunigen",
      copy: `Qualifizieren Sie Anfragen automatisch, erstellen Sie passende Folgeaktionen und machen Sie jeden Status bis zum Auftrag sichtbar.`,
      impact: "Hoch" as const,
      effort: "2–4 Wochen",
      service: "Sales Automation",
      price: 4200,
    },
  ];

  return Response.json({
    company,
    website,
    industry,
    score,
    potential,
    percentile: Math.min(82, 49 + (seed % 29)),
    summary: `${company} verfügt in ${industry} über eine belastbare Ausgangsbasis. Der größte kurzfristige Hebel für das Ziel „${goal}“ liegt in einer präziseren Positionierung, einer klar geführten Website und einem messbaren Übergang von Interesse zu Anfrage.`,
    categories,
    priorities,
  });
}
