# PSM Agent Opportunity Calculator

Public calculator for independent insurance agents to estimate **Year-1 commission impact** and **multi-year compounding** (new production and renewals) on product lines they do not currently offer.

## Public URLs

| Role | URL |
|---|---|
| **Marketing page (HubSpot)** | https://www.psmbrokerage.com/insurance-agent-opportunity-calculator |
| **App host (Vercel)** | https://psm-agent-opportunity-calculator.vercel.app/ |

The HubSpot page should either **redirect** to Vercel or **embed** the Vercel app (iframe). The app allows framing only from `psmbrokerage.com` / `www.psmbrokerage.com`.

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
| `LEAD_WEBHOOK_URL` | **Strongly recommended** | HTTPS endpoint → Zapier/Make → HubSpot Contacts |
| `DATABASE_URL` | Optional | Neon Postgres — stores `leads` when set |
| `VITE_LEAD_FALLBACK_EMAIL` | Optional | Mailto fallback when online delivery is offline |
| `VITE_PUBLIC_SITE_URL` | Recommended | `https://www.psmbrokerage.com/insurance-agent-opportunity-calculator` |
| `VITE_AUTH_ENABLED` | Optional | Set `false` for pure public beta (recommended) |

**Beta gate:** Without `LEAD_WEBHOOK_URL` or `DATABASE_URL`, the portfolio-review form will **not** claim success.

## HubSpot website page (go-live)

1. In HubSpot: **Content → Website pages → Create**
2. Page URL slug: `insurance-agent-opportunity-calculator`
3. **Option A — Redirect (simplest SEO):** page module or host redirect to  
   `https://psm-agent-opportunity-calculator.vercel.app/`
4. **Option B — Embed:** full-width HTML module:

```html
<iframe
  src="https://psm-agent-opportunity-calculator.vercel.app/"
  title="PSM Agent Opportunity Calculator"
  style="width:100%;min-height:90vh;border:0;display:block;"
  loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin"
></iframe>
```

5. Publish the page  
6. Set Vercel env `VITE_PUBLIC_SITE_URL` to the HubSpot URL and redeploy  
7. Wire `LEAD_WEBHOOK_URL` to Zapier → HubSpot Create Contact

## Lead payload (webhook)

`POST` JSON includes: `id`, `source`, `submittedAt`, name, email, phone, state, `npn` (required, 5-10 digits), `contractedWithPsm`, `message`, and optional `calculatorSnapshot` (practice-level estimates only — no consumer PHI).

## Notes

- Results are **illustrative planning estimates**, not guarantees of income.
- MA defaults reference CMS national FMV structure; other lines use mid-market planning defaults (overrideable in the UI).
- Do not collect private client or PHI data in this tool.
- Lead form is for **agent** contact info only, with explicit professional consent.

## Deploy

Configured for Vercel via Nitro (`nitro({ preset: "vercel" })` on build).
