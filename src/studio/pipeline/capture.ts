// Stage 1 — Capture: load the source URL in a real browser and extract the
// content, brand signals (colors, fonts, logo) and screenshots we need to brief
// the generator. Uses the preinstalled Chromium (PLAYWRIGHT_BROWSERS_PATH).

import fs from "node:fs";
import path from "node:path";

import { chromium } from "playwright";

import { jobArtifactsDir } from "../config";
import { CaptureResult } from "../types";

// Resolve a Chromium executable. On a normal machine, return undefined so
// Playwright uses its own managed browser (installed via `npx playwright install
// chromium`). In managed environments a prebuilt Chromium may be pinned via
// PLAYWRIGHT_CHROMIUM_PATH or found at /opt/pw-browsers/chromium.
function chromiumPath(): string | undefined {
  const explicit = process.env.PLAYWRIGHT_CHROMIUM_PATH?.trim();
  if (explicit && fs.existsSync(explicit)) return explicit;
  const managed = "/opt/pw-browsers/chromium";
  if (fs.existsSync(managed)) return managed;
  return undefined;
}

// Use an outbound proxy when the environment defines one, but never for local or
// private addresses — routing localhost through a proxy captures the proxy's own
// error page instead of the site. NO_PROXY entries are honored as well.
function proxyOption(): { proxy?: { server: string; bypass: string } } {
  const server = (process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "").trim();
  if (!server) return {};
  const extra = (process.env.NO_PROXY || process.env.no_proxy || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const bypass = [
    "localhost",
    "127.0.0.1",
    "::1",
    "*.local",
    "10.*",
    "192.168.*",
    "172.16.*",
    ...extra,
  ].join(",");
  return { proxy: { server, bypass } };
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Bitte eine Website-URL angeben.");
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  // Throws on obviously invalid input.
  const u = new URL(withScheme);
  return u.toString();
}

type ExtractedDom = {
  title: string;
  description: string;
  headings: string[];
  textBlocks: string[];
  colors: string[];
  fonts: string[];
  logoUrl: string | null;
};

export async function capture(
  jobId: string,
  url: string,
  onLog: (message: string) => void,
): Promise<CaptureResult> {
  const target = normalizeUrl(url);
  const outDir = jobArtifactsDir(jobId);
  fs.mkdirSync(outDir, { recursive: true });

  onLog(`Starte Browser und lade ${target}`);
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromiumPath(),
    ...proxyOption(),
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/125.0 Safari/537.36 ScopeStudio/1.0",
    });
    const page = await context.newPage();
    await page.goto(target, { waitUntil: "networkidle", timeout: 45_000 }).catch(async () => {
      onLog("networkidle Timeout — versuche domcontentloaded");
      await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30_000 });
    });
    await page.waitForTimeout(1500);

    const finalUrl = page.url();
    onLog("Seite geladen, extrahiere Inhalte und Markensignale");

    const data = (await page.evaluate(extractInBrowser)) as ExtractedDom;

    const screenshots: string[] = [];
    const fullPath = path.join(outDir, "source-full.png");
    await page.screenshot({ path: fullPath, fullPage: true }).catch(() => {});
    if (fs.existsSync(fullPath)) screenshots.push("artifacts/source-full.png");

    const foldPath = path.join(outDir, "source-fold.png");
    await page.screenshot({ path: foldPath, fullPage: false }).catch(() => {});
    if (fs.existsSync(foldPath)) screenshots.push("artifacts/source-fold.png");

    const result: CaptureResult = {
      url: target,
      finalUrl,
      title: data.title,
      description: data.description,
      headings: data.headings,
      textBlocks: data.textBlocks,
      colors: data.colors,
      fonts: data.fonts,
      logoUrl: data.logoUrl,
      screenshots,
    };

    fs.writeFileSync(path.join(outDir, "capture.json"), JSON.stringify(result, null, 2));
    onLog(
      `Erfasst: ${data.headings.length} Überschriften, ${data.colors.length} Farben, ` +
        `${screenshots.length} Screenshots`,
    );
    return result;
  } finally {
    await browser.close().catch(() => {});
  }
}

// Runs inside the page. Keep it dependency-free and defensive.
function extractInBrowser(): ExtractedDom {
  const clean = (s: string) => s.replace(/\s+/g, " ").trim();

  const title = clean(document.title || "");
  const description =
    document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content")
      ?.trim() ||
    document
      .querySelector('meta[property="og:description"]')
      ?.getAttribute("content")
      ?.trim() ||
    "";

  const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
    .map((el) => clean(el.textContent || ""))
    .filter((t) => t.length > 1)
    .slice(0, 40);

  const textBlocks = Array.from(document.querySelectorAll("p, li"))
    .map((el) => clean(el.textContent || ""))
    .filter((t) => t.length > 40)
    .slice(0, 60);

  // Color frequency across visible elements.
  const colorCounts = new Map<string, number>();
  const bump = (raw: string | null) => {
    if (!raw) return;
    const hex = toHex(raw);
    if (!hex) return;
    if (hex === "#ffffff" || hex === "#000000") return; // too generic to be a brand color
    colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
  };
  const els = Array.from(document.querySelectorAll("*")).slice(0, 2500);
  for (const el of els) {
    const cs = getComputedStyle(el as Element);
    bump(cs.backgroundColor);
    bump(cs.color);
    bump(cs.borderTopColor);
  }
  const colors = [...colorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([hex]) => hex);

  const fontSet = new Set<string>();
  for (const el of [document.body, ...Array.from(document.querySelectorAll("h1, h2, p"))]) {
    if (!el) continue;
    const fam = getComputedStyle(el as Element).fontFamily;
    if (fam) fontSet.add(fam.split(",")[0].replace(/["']/g, "").trim());
  }
  const fonts = [...fontSet].filter(Boolean).slice(0, 6);

  const logoUrl =
    document.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
    document
      .querySelector('img[alt*="logo" i], img[src*="logo" i], header img')
      ?.getAttribute("src") ||
    null;

  return { title, description, headings, textBlocks, colors, fonts, logoUrl };

  function toHex(input: string): string | null {
    const m = input.match(/rgba?\(([^)]+)\)/i);
    if (!m) return input.startsWith("#") ? input.toLowerCase() : null;
    const parts = m[1].split(",").map((p) => parseFloat(p.trim()));
    const [r, g, b, a = 1] = parts;
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    if (a === 0) return null;
    const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
    return `#${h(r)}${h(g)}${h(b)}`;
  }
}
