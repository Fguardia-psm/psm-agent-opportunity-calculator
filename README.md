# PSM Agent Opportunity Calculator

Public calculator for independent insurance agents to estimate **Year-1 commission impact** and **multi-year compounding** (new production and renewals) on product lines they do not currently offer.

## Markets

Medicare · ACA / Marketplace · Life · Annuity · Ancillary health

## Stack

- React 19 and TypeScript
- TanStack Start / Router
- Tailwind CSS v4
- Vite 8
- Nitro (Vercel preset) for production

## Scripts

```bash
npm install
npm run dev      # http://0.0.0.0:8080
npm run build
npm run typecheck
```

## Notes

- Results are **illustrative planning estimates**, not guarantees of income.
- MA defaults reference CMS national FMV structure; other lines use mid-market planning defaults (overrideable in the UI).
- Do not collect private client or PHI data in this tool.

## Deploy

Configured for Vercel via Nitro (`nitro({ preset: "vercel" })` on build).
