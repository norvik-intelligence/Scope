#!/usr/bin/env bash
# Printed when the Codespace attaches — the two steps to use Scope Studio from a phone.
cat <<'MSG'

──────────────────────────────────────────────
  Scope Studio — bereit.
──────────────────────────────────────────────
  1) Einmalig bei Claude einloggen (Claude-Abo):
       npx @anthropic-ai/claude-code
     Dem Login-Link folgen (öffnet im Browser), dann zurück ins Terminal.

  2) Tool starten:
       npm run studio
     Codespaces leitet Port 3000 weiter und öffnet die Vorschau.
     Danach im geöffneten Tab /studio anhängen  → …app.github.dev/studio

  Tokens (optional, für GitHub/Vercel-Auslieferung) als Codespaces-Secrets setzen:
     STUDIO_GITHUB_TOKEN, VERCEL_TOKEN  (GitHub → Settings → Codespaces → Secrets)
  Ohne Tokens läuft alles bis zum lokalen Build; Push/Deploy werden übersprungen.
──────────────────────────────────────────────

MSG
