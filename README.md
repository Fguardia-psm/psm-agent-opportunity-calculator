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
- Optional Postgres (Neon) via `DATABASE_URL` for lead storage / Better Auth
- Optional Better Auth (Grok broker) — calculator itself is public (no login required)

## Scripts

```bash
npm install
npm run dev         # http://0.0.0.0:8080
npm run build
npm run typecheck
npm run test:math   # calculator integrity checks
```

## Environment (production)

| Variable | Required | Purpose |
|---|---|---|
| `LEAD_WEBHOOK_URL` | **Strongly recommended for beta** | HTTPS endpoint that receives lead JSON (Zapier / Make / CRM / Slack) |
| `DATABASE_URL` | Optional | Neon Postgres — stores `leads` + auth tables when set |
| `VITE_LEAD_FALLBACK_EMAIL` | Optional | Mailto fallback address when online delivery is not configured (default `agents@psmbrokerage.com`) |
| `BETTER_AUTH_URL` | If auth on | Public site origin for Better Auth |
| `BETTER_AUTH_SECRET` | If auth on | Session signing secret |
| `GROK_AUTH_CLIENT_ID` / `GROK_AUTH_CLIENT_SECRET` | If auth on | Federated sign-in (not needed for public calculator) |
| `VITE_AUTH_ENABLED` | Optional | Set `false` to disable auth UI |

**Beta gate:** Without `LEAD_WEBHOOK_URL` or `DATABASE_URL`, the portfolio-review form will **not** claim success. Agents see an honest error and an email fallback.

## Lead payload (webhook)

`POST` JSON includes: `id`, `source`, `submittedAt`, name, email, phone, state, optional `npn`, `contractedWithPsm`, `message`, and optional `calculatorSnapshot` (practice-level estimates only — no consumer PHI).

## Notes

- Results are **illustrative planning estimates**, not guarantees of income.
- MA defaults reference CMS national FMV structure; other lines use mid-market planning defaults (overrideable in the UI).
- Do not collect private client or PHI data in this tool.
- Lead form is for **agent** contact info only.

## Deploy

Configured for Vercel via Nitro (`nitro({ preset: "vercel" })` on build). Set `LEAD_WEBHOOK_URL` (and/or `DATABASE_URL`) before inviting external agents.
