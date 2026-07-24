# Scope Studio

Ein **lokales Inhouse-Tool**: Website-URL einfügen → Scope Studio erfasst Inhalt, Marke und Branche,
baut mit dem installierten Design-Techstack eine **komplett neue, hochwertige Website** im Branchenstil,
pusht sie in ein **neues GitHub-Repo** und **deployt sie auf Vercel** — alles aus einer Oberfläche.
Ergebnis: eine fertige Live-URL, die du direkt an den Kunden schicken kannst.

> **Kein Klon, sondern Premium-Neuinterpretation:** Inhalt und Marke werden übernommen, Design,
> Typografie, Spacing und Motion aber auf Agentur-Niveau neu gestaltet — angetrieben von den Skills
> `design-taste-frontend`, `impeccable` und `emil-design-eng` (siehe [docs/design-stack.md](design-stack.md)).

## Warum lokal?

Die Pipeline braucht ein langlaufendes Node-Prozess mit Dateisystem, startet einen Browser (Playwright)
und den Design-Agenten (Claude Agent SDK) als Subprozesse und nutzt deinen lokalen Claude-Login. Das läuft
**nicht** in einer Vercel-Serverless-Function. Scope Studio läuft deshalb als lokales Kontroll-Panel auf
deinem Rechner und liefert von dort nach GitHub/Vercel aus.

## Voraussetzungen (einmalig)

1. **Node.js 18+** und `npm install` im Projekt.
2. **Claude Code Login** (Claude-Abo) — die KI-Engine nutzt keinen API-Key, sondern deinen Login:
   ```bash
   npx @anthropic-ai/claude-code
   ```
   einmal ausführen und mit deinem Claude-Konto einloggen. (Ein `claude`-Login auf dem Rechner genügt.)
3. **Tokens** in `.env.local` (Vorlage: `.env.example`):
   - `GITHUB_TOKEN` — PAT mit Repo-Erstellung + Contents (klassisch: Scope `repo`; fine-grained:
     *Administration* + *Contents: read/write*).
   - `VERCEL_TOKEN` — von <https://vercel.com/account/tokens>.
   - `VERCEL_TEAM_ID` — nur, wenn das Vercel-Projekt unter einem Team liegt.
4. **Vercel ↔ GitHub App** an deinem Account installiert, damit Vercel das neue Repo bauen darf
   (einmalig unter vercel.com verbinden).

Fehlt ein Token, wird die jeweilige Stufe **sauber übersprungen** — alles bis inkl. lokalem Build
funktioniert trotzdem.

## Starten

```bash
npm run studio        # startet Next.js lokal
```

Dann [http://localhost:3000/studio](http://localhost:3000/studio) öffnen:

1. Website-URL einfügen, optional Repo-Name.
2. Optionen wählen (privates Repo, Push/Deploy überspringen für Trockenläufe).
3. **Rebuild & Ship** — die Live-Timeline zeigt jede Stufe, das Agent-Log und Vorher/Nachher.
4. Am Ende: Live-URL, GitHub-Link und eine fertige „Kunden-Nachricht" zum Kopieren.

## Pipeline (6 Stufen)

| Stufe | Was passiert |
| --- | --- |
| Capture | Playwright lädt die URL, extrahiert Inhalt, Farben, Fonts, Logo, Screenshots. |
| Brief | Ableitung von Branche, Zielgruppe, Tonalität, Palette, Sektionen. |
| Generate | Next.js+Tailwind-Starter + Design-Skills → Claude Agent SDK baut die Premium-Seite. |
| Verify | `npm install` + `npm run build`; bei Fehlern eine Reparatur-Runde des Agenten. |
| Publish | Neues GitHub-Repo anlegen und die Seite als ein Commit pushen. |
| Deploy | Vercel-Produktions-Deployment aus dem Repo, wartet bis `READY`, liefert die Live-URL. |

## Trockenlauf (empfohlen für den ersten Test)

„GitHub-Push überspringen" + „Vercel-Deploy überspringen" aktivieren. Dann prüfst du Capture, Brief,
Generierung und lokalen Build, ohne etwas zu veröffentlichen. Das generierte Projekt liegt unter
`.studio/jobs/<jobId>/site/`.

## Troubleshooting

- **„Claude-Code-Login nicht gefunden"** → `npx @anthropic-ai/claude-code` ausführen und einloggen.
- **GitHub 403 beim Anlegen** → PAT-Scopes prüfen (Repo-Erstellung/Contents).
- **Vercel startet nicht** → Vercel-GitHub-App am Account verbinden; `VERCEL_TOKEN`/`VERCEL_TEAM_ID` prüfen.
- **Build im generierten Projekt schlägt fehl** → Log ansehen; die Reparatur-Runde behebt die meisten
  Fälle. Das Workspace-Verzeichnis bleibt zum Nachschauen unter `.studio/jobs/<jobId>/site/`.

## Konfiguration

- `STUDIO_MODEL` (optional) — pinnt das Modell des Design-Agenten.
- `.studio/` (gitignored) — lokale Job-Datenbank, Screenshots und generierte Projekte.
