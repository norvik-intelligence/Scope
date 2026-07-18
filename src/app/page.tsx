import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  Clock3,
  FileSearch,
  Layers3,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { AuditFlow } from "@/components/audit-flow";
import auditMachine from "../../public/scope-audit-machine.webp";

const insights = [
  {
    number: "01",
    title: "Positionierung",
    copy: "Wir prüfen, ob in fünf Sekunden klar wird, warum Kunden gerade Sie wählen sollten.",
  },
  {
    number: "02",
    title: "Digitaler Auftritt",
    copy: "Website, Suchsichtbarkeit und Conversion werden als ein zusammenhängendes System bewertet.",
  },
  {
    number: "03",
    title: "Wachstumshebel",
    copy: "Aus abstrakten Chancen werden priorisierte Maßnahmen mit Aufwand, Nutzen und Preisrahmen.",
  },
];

const deliverables = [
  "Management Summary auf einer Seite",
  "Scorecard für 6 Unternehmensbereiche",
  "Konkrete Maßnahmen nach Wirkung sortiert",
  "Visuelle Vorschau Ihrer neuen Website",
  "Transparente Projekt- und Kostenkalkulation",
  "Direkter Weg zu Termin oder Umsetzung",
];

function ScopeMark() {
  return (
    <span className="scope-logo" aria-label="Scope Startseite">
      <span className="scope-mark" aria-hidden="true">
        <span />
      </span>
      <span>Scope</span>
    </span>
  );
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a href="#top" className="logo-link">
          <ScopeMark />
        </a>
        <nav aria-label="Hauptnavigation">
          <a href="#produkt">Produkt</a>
          <a href="#ablauf">Ablauf</a>
          <a href="#ergebnis">Ergebnis</a>
        </nav>
        <a className="header-cta" href="#check">
          Kostenlos prüfen <ArrowRight size={15} />
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow reveal-up">
            <span className="live-dot" />
            Der Business Check für den Mittelstand
          </div>
          <h1 className="reveal-up reveal-delay-1">
            Sehen Sie Ihr Unternehmen mit <em>neuen Augen.</em>
          </h1>
          <p className="hero-lead reveal-up reveal-delay-2">
            Scope analysiert Ihren digitalen Auftritt, Ihre Positionierung und
            ungenutzte Wachstumschancen – und macht daraus einen klaren Plan,
            den Sie direkt umsetzen können.
          </p>
          <div className="hero-actions reveal-up reveal-delay-3">
            <a className="primary-button" href="#check">
              Kostenlosen Check starten <ArrowRight size={17} />
            </a>
            <a className="text-button" href="#produkt">
              So funktioniert Scope
            </a>
          </div>
          <div className="trust-row reveal-up reveal-delay-3">
            <span><Check size={14} /> Kostenlos</span>
            <span><Check size={14} /> In 3 Minuten</span>
            <span><Check size={14} /> Ohne Anmeldung</span>
          </div>
        </div>

        <div className="hero-visual reveal-up reveal-delay-2">
          <Image
            src={auditMachine}
            alt="Abstrakte Scope Analysemaschine aus Aluminium und Glas"
            priority
            sizes="(max-width: 900px) 100vw, 58vw"
          />
          <div className="floating-card score-float">
            <span>Scope Score</span>
            <strong>74</strong>
            <small>+18 Potenzialpunkte</small>
          </div>
          <div className="floating-card signal-float">
            <span className="mini-icon"><Sparkles size={14} /></span>
            <div><strong>7 Chancen</strong><small>automatisch erkannt</small></div>
          </div>
        </div>

        <div className="hero-proof">
          <span>Bewertet nach</span>
          <strong>Strategie</strong>
          <strong>Marke</strong>
          <strong>Website</strong>
          <strong>SEO</strong>
          <strong>Conversion</strong>
          <strong>Prozesse</strong>
        </div>
      </section>

      <section className="statement-section" id="produkt">
        <div className="section-kicker">Was Scope sichtbar macht</div>
        <h2>
          Die meisten Unternehmen haben kein Ideenproblem.
          <span> Sie haben ein Klarheitsproblem.</span>
        </h2>
        <div className="insight-grid">
          {insights.map((item) => (
            <article className="insight-card" key={item.number}>
              <span className="insight-number">{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="process-section" id="ablauf">
        <div className="section-heading-row">
          <div>
            <div className="section-kicker light">Von Analyse zu Auftrag</div>
            <h2>Ein Check. Ein Plan.<br />Ein klarer nächster Schritt.</h2>
          </div>
          <p>
            Keine 80-seitige Präsentation. Scope übersetzt Analyse direkt in
            verständliche Entscheidungen und sichtbare Verbesserungen.
          </p>
        </div>
        <div className="process-grid">
          <article>
            <FileSearch size={25} />
            <span>01 / Verstehen</span>
            <h3>Unternehmen erfassen</h3>
            <p>Website, Branche, Ziel und aktuelle Hürden in wenigen Fragen.</p>
          </article>
          <article>
            <BarChart3 size={25} />
            <span>02 / Bewerten</span>
            <h3>Potenziale priorisieren</h3>
            <p>Scope bündelt die wichtigsten Signale in einer klaren Scorecard.</p>
          </article>
          <article>
            <WandSparkles size={25} />
            <span>03 / Visualisieren</span>
            <h3>Zielbild erleben</h3>
            <p>Sie sehen vor dem Auftrag, wie die neue Lösung wirken kann.</p>
          </article>
          <article>
            <Layers3 size={25} />
            <span>04 / Umsetzen</span>
            <h3>Direkt beauftragen</h3>
            <p>Leistung wählen, Preis sehen und Umsetzung verbindlich starten.</p>
          </article>
        </div>
      </section>

      <section className="audit-section" id="check">
        <div className="audit-intro">
          <div>
            <div className="section-kicker">Live Business Check</div>
            <h2>Starten Sie mit Ihrem Unternehmen.</h2>
          </div>
          <p>
            Die Demo läuft ohne externe KI-Kosten und erzeugt sofort eine
            individuelle, interaktive Auswertung.
          </p>
        </div>
        <AuditFlow />
      </section>

      <section className="result-section" id="ergebnis">
        <div className="result-copy">
          <div className="section-kicker">Ihr Ergebnis</div>
          <h2>Kein loses Feedback. Ein umsetzbares Entscheidungsdokument.</h2>
          <p>
            Der Scope Report ist für Unternehmer gemacht: visuell, konkret und
            bereit, intern geteilt oder direkt beauftragt zu werden.
          </p>
          <div className="deliverable-list">
            {deliverables.map((item) => (
              <span key={item}><BadgeCheck size={17} /> {item}</span>
            ))}
          </div>
        </div>
        <div className="report-stack" aria-label="Vorschau des Scope Reports">
          <div className="report-sheet report-back" />
          <div className="report-sheet report-middle" />
          <div className="report-sheet report-front">
            <div className="report-topline">
              <ScopeMark />
              <span>Business Audit / 2026</span>
            </div>
            <div className="report-title">Ihr Wachstum,<br />klar priorisiert.</div>
            <div className="report-score-row">
              <div className="report-ring"><strong>74</strong><small>/ 100</small></div>
              <div>
                <span>Größter Hebel</span>
                <strong>Digitale Conversion</strong>
                <small>+18 Punkte Potenzial</small>
              </div>
            </div>
            <div className="report-bars">
              {[72, 61, 84, 54].map((width, index) => (
                <div key={width}>
                  <span>{["Marke", "Website", "Angebot", "Prozesse"][index]}</span>
                  <i><b style={{ width: `${width}%` }} /></i>
                  <strong>{width}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-orb"><ShieldCheck size={28} /></div>
        <div className="section-kicker light">Bereit für Klarheit?</div>
        <h2>Der erste Schritt kostet<br />Sie nur drei Minuten.</h2>
        <p>Kein Verkaufsgespräch. Keine Kreditkarte. Erst sehen, dann entscheiden.</p>
        <a className="primary-button light-button" href="#check">
          Unternehmen kostenlos prüfen <ArrowRight size={17} />
        </a>
        <div className="cta-meta">
          <span><Clock3 size={15} /> Ergebnis in wenigen Minuten</span>
          <span><ShieldCheck size={15} /> Ihre Angaben bleiben vertraulich</span>
        </div>
      </section>

      <footer>
        <div className="footer-main">
          <ScopeMark />
          <p>Business clarity, built for action.</p>
          <div className="footer-links">
            <a href="#produkt">Produkt</a>
            <a href="#ablauf">Ablauf</a>
            <a href="mailto:hallo@scope.de">Kontakt</a>
            <a href="#">Datenschutz</a>
            <a href="#">Impressum</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Scope Intelligence</span>
          <span>Made for ambitious businesses in Germany.</span>
        </div>
      </footer>
    </main>
  );
}
