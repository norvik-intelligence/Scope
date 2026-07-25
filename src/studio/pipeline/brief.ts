// Stage 2 — Brief: turn raw capture data into a structured design brief that
// steers the generator. Deterministic heuristics (no extra AI call); the
// generating agent refines it further with the design skills.

import fs from "node:fs";
import path from "node:path";

import { jobArtifactsDir } from "../config";
import { CaptureResult, DesignBrief } from "../types";

const INDUSTRY_HINTS: { industry: string; terms: string[] }[] = [
  { industry: "SaaS / B2B-Software", terms: ["saas", "platform", "dashboard", "api", "workflow", "integrat", "software"] },
  { industry: "E-Commerce / Handel", terms: ["shop", "cart", "warenkorb", "checkout", "produkt", "kaufen", "store", "versand"] },
  { industry: "Gastronomie", terms: ["restaurant", "menu", "speisekarte", "reservier", "café", "kitchen", "bar"] },
  { industry: "Handwerk / Bau", terms: ["handwerk", "bau", "sanitär", "elektro", "montage", "renovier", "dach", "maler"] },
  { industry: "Gesundheit / Praxis", terms: ["praxis", "arzt", "zahn", "therapie", "patient", "clinic", "gesund", "physio"] },
  { industry: "Immobilien", terms: ["immobil", "makler", "wohnung", "estate", "property", "miete", "kaufen haus"] },
  { industry: "Beratung / Agentur", terms: ["beratung", "consult", "agentur", "agency", "strateg", "marketing"] },
  { industry: "Finanzen / Versicherung", terms: ["finanz", "versicher", "invest", "kredit", "bank", "steuer", "finance"] },
  { industry: "Fitness / Wellness", terms: ["fitness", "gym", "yoga", "training", "wellness", "spa", "coach"] },
  { industry: "Bildung / Kurse", terms: ["kurs", "akademie", "school", "learn", "seminar", "coaching", "workshop"] },
];

const DEFAULT_SECTIONS = [
  "Hero mit klarer Wertversprechen-Headline und primärem CTA",
  "Vertrauensleiste (Logos / Kennzahlen / Bewertungen)",
  "Leistungen bzw. Produktnutzen in einem klaren Raster",
  "Wie-es-funktioniert / Ablauf in Schritten",
  "Sozialer Beweis (Testimonials oder Case-Highlights)",
  "Preise oder Pakete (falls sinnvoll)",
  "FAQ",
  "Abschluss-CTA mit Kontakt / Terminbuchung",
  "Footer mit Navigation und Rechtlichem",
];

function detectLanguage(text: string): string {
  const deMarkers = [" und ", " der ", " die ", " für ", " mit ", "ä", "ö", "ü", "ß"];
  const hits = deMarkers.filter((m) => text.toLowerCase().includes(m)).length;
  return hits >= 2 ? "Deutsch" : "Englisch";
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Match on word starts, not bare substrings: a plain `includes("bar")` matches
// German words like "sichtbar"/"umsetzbar" and misclassifies the whole site.
function countTerm(lower: string, term: string): number {
  const pattern = new RegExp(`(^|[^a-zäöüß])${escapeRegex(term)}`, "g");
  return (lower.match(pattern) || []).length;
}

function detectIndustry(haystack: string): string {
  const lower = haystack.toLowerCase();
  let best = { industry: "Allgemeine Business-Website", score: 0 };
  for (const hint of INDUSTRY_HINTS) {
    const score = hint.terms.reduce((n, t) => n + Math.min(countTerm(lower, t), 3), 0);
    // Require more than one signal so a single incidental word can't decide it.
    if (score > best.score && score >= 2) best = { industry: hint.industry, score };
  }
  return best.industry;
}

function brandFromTitle(title: string, url: string): string {
  const fromTitle = title.split(/[|\-–—·:]/)[0]?.trim();
  if (fromTitle && fromTitle.length >= 2 && fromTitle.length <= 40) return fromTitle;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const name = host.split(".")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return "Ihre Marke";
  }
}

export function buildBrief(jobId: string, capture: CaptureResult): DesignBrief {
  const haystack = [
    capture.title,
    capture.description,
    ...capture.headings,
    ...capture.textBlocks,
  ].join(" ");

  const language = detectLanguage(haystack);
  const industry = detectIndustry(haystack);
  const brand = brandFromTitle(capture.title, capture.finalUrl);

  const valueProposition =
    capture.description ||
    capture.headings[0] ||
    `Premium-Webauftritt für ${brand}`;

  const palette = capture.colors.slice(0, 5);
  const tone =
    industry.includes("SaaS") || industry.includes("Finanz")
      ? "vertrauenswürdig, präzise, modern"
      : industry.includes("Gastronomie") || industry.includes("Wellness")
        ? "einladend, sinnlich, hochwertig"
        : industry.includes("Handwerk") || industry.includes("Bau")
          ? "solide, bodenständig, verlässlich"
          : "selbstbewusst, klar, premium";

  const brief: DesignBrief = {
    brand,
    industry,
    audience:
      language === "Deutsch"
        ? "Entscheider und Kunden im deutschsprachigen Markt"
        : "Decision makers and customers",
    tone,
    valueProposition,
    palette: palette.length ? palette : ["#0B0B0F", "#F5F3EF", "#C9A24B"],
    fonts: capture.fonts,
    sections: DEFAULT_SECTIONS,
    language,
    notes:
      "Premium-Neuinterpretation, KEIN 1:1-Klon. Inhalt und Marke übernehmen, " +
      "aber Layout, Typografie, Spacing und Motion auf Agentur-Niveau neu gestalten.",
  };

  fs.writeFileSync(
    path.join(jobArtifactsDir(jobId), "brief.json"),
    JSON.stringify(brief, null, 2),
  );
  return brief;
}
