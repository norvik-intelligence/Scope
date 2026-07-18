"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Download,
  FileText,
  Globe2,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

type Category = {
  name: string;
  score: number;
  delta: number;
  insight: string;
};

type Priority = {
  id: string;
  title: string;
  copy: string;
  impact: "Hoch" | "Mittel";
  effort: string;
  service: string;
  price: number;
};

type AuditResult = {
  company: string;
  website: string;
  industry: string;
  score: number;
  potential: number;
  percentile: number;
  summary: string;
  categories: Category[];
  priorities: Priority[];
};

type OrderResponse = {
  orderId: string;
  status: string;
  message: string;
};

const industries = [
  "Handwerk & Bau",
  "Beratung & Dienstleistungen",
  "Gesundheit & Pflege",
  "Industrie & Produktion",
  "Gastronomie & Handel",
  "Logistik & Mobilität",
  "Software & Technologie",
  "Andere Branche",
];

const analysisSteps = [
  { icon: Globe2, label: "Digitalen Auftritt erfassen" },
  { icon: Search, label: "Positionierung und Sichtbarkeit prüfen" },
  { icon: BarChart3, label: "Wachstumshebel bewerten" },
  { icon: Sparkles, label: "Maßnahmenplan erstellen" },
];

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

export function AuditFlow() {
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [goal, setGoal] = useState("Mehr qualifizierte Anfragen");
  const [status, setStatus] = useState<"input" | "analyzing" | "result">("input");
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Übersicht");
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<"none" | "order" | "appointment" | "success">("none");
  const [orderResult, setOrderResult] = useState<OrderResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedPriorities = useMemo(() => {
    if (!result) return [];
    return result.priorities.filter((priority) => selectedServices.has(priority.id));
  }, [result, selectedServices]);

  const total = selectedPriorities.reduce((sum, item) => sum + item.price, 0);

  async function runAudit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!company.trim() || !industry) {
      setError("Bitte ergänzen Sie Unternehmen und Branche.");
      return;
    }

    setStatus("analyzing");
    setProgress(8);
    setActiveStep(0);

    const started = Date.now();
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 3, 92));
      setActiveStep((current) => Math.min(current + 1, analysisSteps.length - 1));
    }, 650);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, website, industry, goal }),
      });

      if (!response.ok) throw new Error("Analyse konnte nicht erstellt werden.");

      const data = (await response.json()) as AuditResult;
      const remaining = Math.max(0, 2800 - (Date.now() - started));
      await wait(remaining);
      window.clearInterval(timer);
      setProgress(100);
      setActiveStep(analysisSteps.length - 1);
      await wait(350);
      setResult(data);
      setSelectedServices(new Set(data.priorities.slice(0, 2).map((item) => item.id)));
      setStatus("result");
    } catch (auditError) {
      window.clearInterval(timer);
      setStatus("input");
      setError(
        auditError instanceof Error
          ? auditError.message
          : "Bitte versuchen Sie es erneut.",
      );
    }
  }

  function togglePriority(id: string) {
    setSelectedServices((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function downloadReport() {
    if (!result) return;

    const rows = result.categories
      .map(
        (category) => `
          <tr>
            <td>${escapeHtml(category.name)}</td>
            <td><strong>${category.score}/100</strong></td>
            <td>+${category.delta} Punkte</td>
            <td>${escapeHtml(category.insight)}</td>
          </tr>`,
      )
      .join("");

    const actions = result.priorities
      .map(
        (item, index) => `
          <div class="action">
            <span>0${index + 1}</span>
            <div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.copy)}</p></div>
            <strong>${escapeHtml(item.impact)}er Impact</strong>
          </div>`,
      )
      .join("");

    const html = `<!doctype html>
      <html lang="de"><head><meta charset="utf-8"><title>Scope Report – ${escapeHtml(result.company)}</title>
      <style>
        *{box-sizing:border-box}body{margin:0;background:#f2f1ed;color:#101114;font-family:Arial,sans-serif}.page{width:900px;min-height:1200px;margin:30px auto;background:white;padding:64px}.top{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding-bottom:24px}.logo{font-size:25px;font-weight:800}.meta{font-size:12px;color:#666;text-align:right}.hero{padding:70px 0 55px}.hero h1{font-size:54px;line-height:1;margin:0 0 20px;letter-spacing:-3px}.hero p{font-size:18px;line-height:1.6;color:#555;max-width:650px}.score{display:flex;gap:32px;align-items:center;background:#111;color:white;padding:32px;margin-bottom:45px}.score b{font-size:60px}.score span{display:block;color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px}.score p{margin:7px 0 0;color:white}h2{font-size:28px;margin-top:50px}table{width:100%;border-collapse:collapse;font-size:13px}td{padding:16px 10px;border-bottom:1px solid #e5e5e5;vertical-align:top}.action{display:grid;grid-template-columns:42px 1fr auto;gap:20px;padding:24px 0;border-bottom:1px solid #ddd}.action span{font-weight:bold;color:#2563eb}.action h3{margin:0 0 7px}.action p{margin:0;color:#666;line-height:1.5}.action>strong{font-size:12px}.footer{margin-top:70px;padding-top:20px;border-top:1px solid #ddd;font-size:11px;color:#777}@media print{body{background:white}.page{margin:0}}
      </style></head><body><main class="page">
      <div class="top"><div class="logo">Scope.</div><div class="meta">BUSINESS AUDIT<br>${new Date().toLocaleDateString("de-DE")}</div></div>
      <section class="hero"><h1>${escapeHtml(result.company)}.<br>Klarer wachsen.</h1><p>${escapeHtml(result.summary)}</p></section>
      <section class="score"><b>${result.score}</b><div><span>Scope Score / 100</span><p>Bis zu ${result.potential} zusätzliche Potenzialpunkte wurden identifiziert.</p></div></section>
      <h2>Scorecard</h2><table><tbody>${rows}</tbody></table>
      <h2>Die wichtigsten nächsten Schritte</h2>${actions}
      <div class="footer">Vertraulich · Erstellt mit Scope Business Intelligence · scope.de</div>
      </main></body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scope-report-${result.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>, mode: "order" | "appointment") {
    event.preventDefault();
    if (!result) return;
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          company: result.company,
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          services: selectedPriorities.map((item) => item.service),
          total,
        }),
      });
      if (!response.ok) throw new Error("Anfrage konnte nicht gesendet werden.");
      setOrderResult((await response.json()) as OrderResponse);
      setModal("success");
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : "Bitte erneut versuchen.");
      setModal("none");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "analyzing") {
    return (
      <div className="audit-frame analyzing-frame" aria-live="polite">
        <div className="analyzing-visual">
          <div className="scan-orbit">
            <div className="scan-core"><span>{progress}</span><small>%</small></div>
            <i className="orbit-one" />
            <i className="orbit-two" />
          </div>
          <div className="analysis-status">
            <span className="audit-label">Scope Engine</span>
            <h3>Wir analysieren {company}.</h3>
            <p>Aus Ihren Angaben entsteht gerade ein individueller Business Report.</p>
            <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
            <div className="analysis-steps">
              {analysisSteps.map((step, index) => {
                const Icon = step.icon;
                const complete = index < activeStep || progress === 100;
                const active = index === activeStep && progress < 100;
                return (
                  <div className={complete ? "complete" : active ? "active" : ""} key={step.label}>
                    <span>{complete ? <Check size={15} /> : active ? <LoaderCircle className="spin" size={15} /> : <Icon size={15} />}</span>
                    {step.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "result" && result) {
    return (
      <>
        <div className="audit-frame result-frame">
          <div className="result-topbar">
            <div className="result-brand">
              <span className="result-logo"><Target size={17} /></span>
              <div><strong>{result.company}</strong><small>Scope Business Audit</small></div>
            </div>
            <div className="result-actions">
              <button type="button" className="ghost-action" onClick={downloadReport}>
                <Download size={15} /> Report
              </button>
              <button type="button" className="dark-action" onClick={() => setModal("appointment")}>
                <CalendarDays size={15} /> Ergebnis besprechen
              </button>
            </div>
          </div>

          <div className="result-body">
            <aside className="result-sidebar">
              <span className="sidebar-label">Analyse</span>
              {["Übersicht", "Scorecard", "Maßnahmen", "Zielbild"].map((tab) => (
                <button
                  type="button"
                  className={activeTab === tab ? "active" : ""}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "Übersicht" && <BarChart3 size={16} />}
                  {tab === "Scorecard" && <Target size={16} />}
                  {tab === "Maßnahmen" && <Zap size={16} />}
                  {tab === "Zielbild" && <Layers3 size={16} />}
                  {tab}<ChevronRight size={14} />
                </button>
              ))}
              <span className="sidebar-label second">Weiter</span>
              <button type="button" onClick={() => setModal("order")}>
                <Rocket size={16} /> Umsetzung <ChevronRight size={14} />
              </button>
              <div className="confidential-note">
                <LockKeyhole size={14} />
                <span><strong>Vertraulich</strong>Nur für {result.company}</span>
              </div>
            </aside>

            <section className="result-content">
              {activeTab === "Übersicht" && (
                <>
                  <div className="content-heading">
                    <div>
                      <span className="audit-label">Management Summary</span>
                      <h3>Gute Basis. Klares Potenzial.</h3>
                      <p>{result.summary}</p>
                    </div>
                    <span className="updated"><CheckCircle2 size={14} /> Analyse vollständig</span>
                  </div>
                  <div className="score-overview">
                    <div className="main-score-card">
                      <div className="score-dial" style={{ "--score": `${result.score * 3.6}deg` } as React.CSSProperties}>
                        <div><strong>{result.score}</strong><span>von 100</span></div>
                      </div>
                      <div className="score-description">
                        <span>Scope Score</span>
                        <h4>Über dem Branchenschnitt</h4>
                        <p>Besser als {result.percentile}% der vergleichbaren Unternehmen in Ihrer Branche.</p>
                      </div>
                    </div>
                    <div className="potential-card">
                      <span className="potential-icon"><TrendingUp size={19} /></span>
                      <div><span>Erkanntes Potenzial</span><strong>+{result.potential}</strong><small>Score-Punkte erreichbar</small></div>
                    </div>
                    <div className="potential-card soft">
                      <span className="potential-icon"><Sparkles size={19} /></span>
                      <div><span>Priorisierte Chancen</span><strong>{result.priorities.length}</strong><small>konkrete nächste Schritte</small></div>
                    </div>
                  </div>
                  <div className="mini-score-grid">
                    {result.categories.slice(0, 4).map((category) => (
                      <article key={category.name}>
                        <div><span>{category.name}</span><strong>{category.score}</strong></div>
                        <i><b style={{ width: `${category.score}%` }} /></i>
                        <small>+{category.delta} Potenzial</small>
                      </article>
                    ))}
                  </div>
                  <div className="priority-preview">
                    <div className="block-heading"><div><span>Top-Prioritäten</span><p>Die größten Hebel für die nächsten 90 Tage.</p></div><button type="button" onClick={() => setActiveTab("Maßnahmen")}>Alle ansehen <ArrowRight size={14} /></button></div>
                    {result.priorities.slice(0, 2).map((priority, index) => (
                      <article key={priority.id}>
                        <span className="priority-index">0{index + 1}</span>
                        <div><h4>{priority.title}</h4><p>{priority.copy}</p></div>
                        <span className="impact-badge">{priority.impact}er Impact</span>
                      </article>
                    ))}
                  </div>
                </>
              )}

              {activeTab === "Scorecard" && (
                <div className="tab-panel">
                  <span className="audit-label">Detailanalyse</span>
                  <h3>Ihre Scorecard im Überblick.</h3>
                  <p>Jeder Bereich wird aus mehreren Signalen bewertet. Der Potenzialwert zeigt, was realistisch erreichbar ist.</p>
                  <div className="category-list">
                    {result.categories.map((category) => (
                      <article key={category.name}>
                        <div className="category-score"><strong>{category.score}</strong><span>/100</span></div>
                        <div className="category-copy"><h4>{category.name}</h4><p>{category.insight}</p><i><b style={{ width: `${category.score}%` }} /></i></div>
                        <span className="delta">+{category.delta}</span>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "Maßnahmen" && (
                <div className="tab-panel">
                  <span className="audit-label">90-Tage-Plan</span>
                  <h3>Von Erkenntnis zu Wirkung.</h3>
                  <p>Wählen Sie die Maßnahmen, die Scope für Sie kalkulieren soll.</p>
                  <div className="measure-list">
                    {result.priorities.map((priority, index) => {
                      const selected = selectedServices.has(priority.id);
                      return (
                        <button type="button" className={selected ? "selected" : ""} key={priority.id} onClick={() => togglePriority(priority.id)}>
                          <span className="measure-check">{selected && <Check size={14} />}</span>
                          <span className="measure-number">0{index + 1}</span>
                          <span className="measure-copy"><strong>{priority.title}</strong><small>{priority.copy}</small></span>
                          <span className="measure-meta"><small>{priority.effort}</small><strong>{euro.format(priority.price)}</strong></span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="estimate-bar">
                    <div><span>Ausgewählter Projektumfang</span><strong>{selectedPriorities.length} Maßnahmen · {euro.format(total)}</strong></div>
                    <button type="button" onClick={() => setModal("order")} disabled={!selectedPriorities.length}>Projekt kalkulieren <ArrowRight size={15} /></button>
                  </div>
                </div>
              )}

              {activeTab === "Zielbild" && (
                <div className="tab-panel target-panel">
                  <span className="audit-label">Visuelle Richtung</span>
                  <h3>So klar könnte Ihr Auftritt wirken.</h3>
                  <p>Ein erstes, editierbares Design-Zielbild auf Basis Ihrer Branche und Prioritäten.</p>
                  <div className="website-concept">
                    <div className="concept-browser"><i /><i /><i /><span>{result.website || "www.ihr-unternehmen.de"}</span></div>
                    <div className="concept-nav"><strong>{result.company}</strong><span>Leistungen&nbsp;&nbsp; Unternehmen&nbsp;&nbsp; Kontakt</span><button>Projekt anfragen</button></div>
                    <div className="concept-hero">
                      <span>{result.industry}</span>
                      <h4>Die klare Wahl<br />für Ihr nächstes Projekt.</h4>
                      <p>Eine präzise Botschaft, ein glaubwürdiger Beweis und ein eindeutiger nächster Schritt.</p>
                      <button>Leistung entdecken <ArrowRight size={13} /></button>
                    </div>
                    <div className="concept-metrics"><span><strong>15+</strong>Jahre Erfahrung</span><span><strong>98%</strong>Weiterempfehlung</span><span><strong>24h</strong>Reaktionszeit</span></div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
        <button type="button" className="restart-button" onClick={() => { setStatus("input"); setResult(null); setProgress(0); }}>
          <ArrowLeft size={15} /> Anderes Unternehmen prüfen
        </button>

        {modal !== "none" && (
          <div className="modal-backdrop" role="presentation" onMouseDown={() => !submitting && setModal("none")}>
            <div className="scope-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
              <button className="modal-close" type="button" aria-label="Dialog schließen" onClick={() => setModal("none")}><X size={18} /></button>
              {modal === "success" ? (
                <div className="success-state">
                  <span><CheckCircle2 size={28} /></span>
                  <div className="audit-label">Anfrage bestätigt</div>
                  <h3 id="modal-title">Der nächste Schritt ist reserviert.</h3>
                  <p>{orderResult?.message}</p>
                  <div className="order-reference"><span>Referenz</span><strong>{orderResult?.orderId}</strong></div>
                  <button type="button" className="dark-action full" onClick={() => setModal("none")}>Zur Auswertung</button>
                </div>
              ) : (
                <form onSubmit={(event) => submitOrder(event, modal as "order" | "appointment")}>
                  <span className="audit-label">{modal === "order" ? "Umsetzung starten" : "Ergebnis besprechen"}</span>
                  <h3 id="modal-title">{modal === "order" ? "Machen wir aus dem Plan ein Projekt." : "Wählen Sie Ihren nächsten Schritt."}</h3>
                  <p>{modal === "order" ? "Wir prüfen Ihren gewählten Umfang und senden Ihnen die verbindliche Freigabe mit Zahlungslink." : "Hinterlassen Sie Ihre Kontaktdaten. Wir stimmen den passenden Termin persönlich mit Ihnen ab."}</p>
                  {modal === "order" && (
                    <div className="order-summary">
                      <div><span>Gewählter Umfang</span><strong>{selectedPriorities.length} Maßnahmen</strong></div>
                      <div><span>Projektwert</span><strong>{euro.format(total)}</strong></div>
                      <div><span>Startzahlung (50%)</span><strong>{euro.format(total / 2)}</strong></div>
                    </div>
                  )}
                  <label>Ihr Name<input name="name" required placeholder="Vor- und Nachname" /></label>
                  <label>Geschäftliche E-Mail<input name="email" type="email" required placeholder="name@unternehmen.de" /></label>
                  <label>Telefon <small>optional</small><input name="phone" type="tel" placeholder="+49 …" /></label>
                  <button type="submit" className="dark-action full" disabled={submitting || (modal === "order" && !selectedPriorities.length)}>
                    {submitting ? <LoaderCircle className="spin" size={16} /> : modal === "order" ? <Rocket size={16} /> : <CalendarDays size={16} />}
                    {submitting ? "Wird übermittelt …" : modal === "order" ? "Freigabe anfordern" : "Termin anfragen"}
                  </button>
                  <small className="modal-legal"><ShieldCheck size={13} /> Noch keine Zahlung. Sie erhalten zuerst eine verbindliche Bestätigung.</small>
                </form>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="audit-frame input-frame">
      <aside className="input-aside">
        <div className="aside-top">
          <span className="input-mark"><Target size={18} /></span>
          <strong>Scope Check</strong>
          <small>Schritt 1 von 1</small>
        </div>
        <div className="input-progress"><i /></div>
        <div className="aside-message">
          <span className="audit-label blue">Kostenlose Erstanalyse</span>
          <h3>Vier Angaben.<br />Ein klarer Blick.</h3>
          <p>Scope erstellt daraus eine individuelle Scorecard mit konkreten Verbesserungsvorschlägen.</p>
        </div>
        <div className="aside-benefits">
          <span><CheckCircle2 size={16} /> Sofortige Auswertung</span>
          <span><FileText size={16} /> Report zum Download</span>
          <span><ShieldCheck size={16} /> Keine Weitergabe Ihrer Daten</span>
        </div>
      </aside>
      <form className="audit-form" onSubmit={runAudit}>
        <div className="form-heading">
          <span>Ihr Unternehmen</span>
          <h3>Wen dürfen wir analysieren?</h3>
          <p>Sie können die Demo auch ohne bestehende Website starten.</p>
        </div>
        <div className="field-grid">
          <label className="wide-field">
            Unternehmensname
            <input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="z. B. Mustermann GmbH" autoComplete="organization" />
          </label>
          <label className="wide-field">
            Website <small>optional</small>
            <div className="input-with-icon"><Globe2 size={16} /><input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="www.ihr-unternehmen.de" inputMode="url" /></div>
          </label>
          <label>
            Branche
            <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
              <option value="">Bitte wählen</option>
              {industries.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Wichtigstes Ziel
            <select value={goal} onChange={(event) => setGoal(event.target.value)}>
              <option>Mehr qualifizierte Anfragen</option>
              <option>Höhere Preise durchsetzen</option>
              <option>Professioneller auftreten</option>
              <option>Prozesse automatisieren</option>
              <option>Bessere Mitarbeiter gewinnen</option>
            </select>
          </label>
        </div>
        {error && <div className="form-error"><CircleAlert size={15} /> {error}</div>}
        <div className="form-submit-row">
          <span><LockKeyhole size={14} /> Sicher & vertraulich verarbeitet</span>
          <button type="submit">Business Check starten <ArrowRight size={16} /></button>
        </div>
      </form>
    </div>
  );
}
