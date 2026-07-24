# Scope

Scope is a premium, interactive business-audit experience for German SMEs. It turns a short company intake into an actionable scorecard, a prioritized 90-day plan, a visual website direction, and a transparent implementation estimate.

## Included

- High-conversion German landing page
- Interactive four-field company intake
- Server-side deterministic audit engine with no external AI cost
- Six-area business scorecard and prioritized recommendations
- Selectable services with live project pricing
- Downloadable, personalized HTML business report
- Appointment and implementation request flows
- Responsive desktop and mobile layouts
- SEO metadata and `robots.txt`

## Run locally

```bash
npm install
npm run dev -- --hostname 127.0.0.1
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Quality checks

```bash
npm run lint
npm run build
```

## Design tech stack

This repo ships with a premium-design tech stack for Claude Code (Emil Kowalski + Taste + Impeccable skills, plus Figma and Playwright MCP) so the AI builds intentional, non-generic UI. See [`docs/design-stack.md`](docs/design-stack.md). To add it to a new project:

```bash
bash scripts/setup-design-stack.sh
```

## Production integrations

The audit, report download, pricing, and request flows work without external services. To turn requests into transactional delivery and payment, connect the placeholders in `.env.example` to:

- Resend or another transactional email provider
- Stripe Checkout and a verified webhook
- A calendar provider such as Cal.com or Calendly
- Persistent order storage (for example Supabase/Postgres)

The API boundaries are located in `src/app/api/audit/route.ts` and `src/app/api/order/route.ts`.
