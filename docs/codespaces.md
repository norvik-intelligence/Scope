# Scope Studio vom Handy nutzen (GitHub Codespaces)

Du brauchst keinen Mac und kein Terminal auf dem Gerät — nur den **Handy-Browser** und ein
GitHub-Konto. Ein Codespace ist eine Cloud-Maschine, auf der Scope Studio läuft; du bedienst sie
über den Browser.

## 1. Codespace starten

1. Im Handy-Browser zu deinem Repo: `github.com/norvik-intelligence/scope`.
2. Branch auf `claude/techstack-installation-setup-nonwfj` wechseln (bzw. `main`, wenn PR #3 gemergt ist).
3. Grüner Button **Code** → Reiter **Codespaces** → **Create codespace**.

Der Codespace richtet sich automatisch ein (`npm install` + Chromium für Playwright). Das dauert
beim ersten Mal ein paar Minuten.

## 2. Einmalig bei Claude einloggen (Claude-Abo)

Im Codespace unten das **Terminal** öffnen und eingeben:

```bash
npx @anthropic-ai/claude-code
```

Dem angezeigten Login-Link folgen (öffnet einen Browser-Tab), mit deinem Claude-Konto einloggen,
dann zurück ins Terminal. Das ist nur **einmal pro Codespace** nötig.

## 3. Tool starten

```bash
npm run studio
```

Codespaces leitet **Port 3000** automatisch weiter und öffnet eine Vorschau. Hänge in der Adresse
`/studio` an — die URL sieht etwa so aus:

```
https://<dein-codespace>-3000.app.github.dev/studio
```

Dort URL einfügen → **Rebuild & Ship**.

> Erster Test: die Häkchen **„GitHub-Push überspringen"** + **„Vercel-Deploy überspringen"** setzen —
> dann läuft alles bis zum Build, ohne etwas zu veröffentlichen.

## 4. Tokens für die Auslieferung (optional)

Damit Studio nach GitHub pusht und auf Vercel deployt, hinterlege Tokens **als Codespaces-Secrets**
(einmalig, über die GitHub-Weboberfläche — geht auch am Handy):

**GitHub → Settings → Codespaces → Secrets → New secret**, jeweils für das Repo `scope` freigeben:

| Secret-Name | Wert |
| --- | --- |
| `STUDIO_GITHUB_TOKEN` | GitHub-PAT mit Repo-Erstellung + Contents |
| `VERCEL_TOKEN` | Token von vercel.com/account/tokens |
| `VERCEL_TEAM_ID` | nur bei Team-Projekten |

> `GITHUB_TOKEN` als Secret-Name ist bei Codespaces gesperrt — deshalb `STUDIO_GITHUB_TOKEN`.
> Nach dem Setzen den Codespace neu starten (oder neu erstellen), damit die Secrets greifen.
> Für Vercel muss zusätzlich die Vercel-GitHub-App an deinem Account installiert sein.

## Hinweise

- Der Codespace läuft nur, solange er aktiv ist (GitHub bietet ein kostenloses Stundenkontingent).
  Stoppen: **Code → Codespaces → … → Stop**.
- Alles Weitere (Pipeline, Stufen, Troubleshooting) steht in [docs/studio.md](studio.md).
