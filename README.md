# PSM Agent Opportunity Calculator

Public calculator for independent insurance agents to estimate **Year-1 commission impact** and **multi-year compounding** (new production and renewals) on product lines they do not currently offer.

## Markets

Medicare · ACA / Marketplace · Life · Annuity (primary focus only) · Ancillary health

## Stack

- React 19 and TypeScript
- TanStack Start / Router
- Tailwind CSS v4
- Vite 8
- Nitro (Vercel preset) for production
- Optional Postgres (Neon) via `DATABASE_URL` for lead storage
- Optional Better Auth (not required for the public calculator)

## Scripts

```bash
npm install
npm run dev         # http://0.0.0.0:8080
npm run build
npm run typecheck
npm run test:math   # calculator integrity checks
```

## Environment (production)

Copy `.env.example` and set values in the Vercel project.

| Variable | Required | Purpose |
|---|---|---|
| `LEAD_WEBHOOK_URL` | **Strongly recommended** | HTTPS endpoint that receives lead JSON (Zapier / Make / CRM / Slack) |
| `DATABASE_URL` | Optional | Neon Postgres — stores `leads` + auth tables when set |
| `VITE_LEAD_FALLBACK_EMAIL` | Optional | Mailto fallback when online delivery is offline |
| `VITE_PUBLIC_SITE_URL` | Optional | Canonical URL for SEO / JSON-LD |
| `VITE_AUTH_ENABLED` | Optional | Set `false` for pure public beta (recommended) |
| `BETTER_AUTH_*` / `GROK_AUTH_*` | Only if auth on | Federated sign-in (not needed for calculator) |

**Beta gate:** Without `LEAD_WEBHOOK_URL` or `DATABASE_URL`, the portfolio-review form will **not** claim success. Agents see an honest error and an email fallback.

## Pages

| Path | Purpose |
|---|---|
| `/` | Calculator + results + lead form |
| `/privacy` | Agent privacy notice |
| `/disclaimer` | Estimate disclaimer |
| `/login` | Public notice that sign-in is not required (`noindex`) |

## Lead payload (webhook)

`POST` JSON includes: `id`, `source`, `submittedAt`, name, email, phone, state, optional `npn`, `contractedWithPsm`, `message`, and optional `calculatorSnapshot` (practice-level estimates only — no consumer PHI).

## Notes

- Results are **illustrative planning estimates**, not guarantees of income.
- MA defaults reference CMS national FMV structure; other lines use mid-market planning defaults (overrideable in the UI).
- Do not collect private client or PHI data in this tool.
- Lead form is for **agent** contact info only, with explicit professional consent.

## Deploy

Configured for Vercel via Nitro (`nitro({ preset: "vercel" })` on build). Set `LEAD_WEBHOOK_URL` (and/or `DATABASE_URL`) before inviting external agents.
