# Beta readiness checklist — Agent Opportunity Calculator

Public planning tool for independent insurance agents (PSM Brokerage).  
No login required for the core calculator. Lead form collects agent PII only (no consumer PHI).

## Environment readiness

- [ ] `LEAD_WEBHOOK_URL` set in Vercel (Zapier/Make → HubSpot) **or** `DATABASE_URL` for Neon
- [ ] `VITE_PUBLIC_SITE_URL` = marketing canonical URL
- [ ] `VITE_LEAD_FALLBACK_EMAIL` = monitored inbox
- [ ] `LEAD_ALLOWED_ORIGINS` only if using a custom domain not already in code allowlist
- [ ] `VITE_AUTH_ENABLED=false` for public calculator beta
- [ ] Production deploy green on Vercel

## Auth flow

- [ ] N/A for core product — no sign-up required
- [ ] Confirm `/login` is not required to calculate
- [ ] Confirm auth is not half-enabled against Neon in a confusing way

## Role / permission checks

- [ ] N/A — single public role (agent visitor)
- [ ] Lead POST rejects missing Origin scripts (fail-closed)

## Critical workflow 1 — Calculate opportunity

1. Open production app (Vercel or HubSpot page).
2. Select state + primary market(s).
3. Enter active clients and new clients/year.
4. Choose review frequency → **Show My Opportunity**.
5. Confirm **range appears above planning estimate**.
6. Confirm place-rate trust note is visible (~35% default).

## Critical workflow 2 — Multi-year path and assumptions

1. Open multi-year chart; confirm cumulative climbs.
2. Open **Use my contract assumptions**; change place rate; results update.
3. Open **How the money is calculated**.

## Critical workflow 3 — Portfolio review lead

1. Fill name, email, phone (formatted), state.
2. Enter NPN **or** check **NPN pending**.
3. Contracted with PSM + professional consent.
4. Submit → see **Request received** (or email fallback if delivery down).
5. Confirm contact appears in HubSpot/Zapier (manual).

## Unauthorized / abuse checks

- [ ] POST without Origin header is rejected (server)
- [ ] Rapid resubmits eventually rate-limit
- [ ] Honeypot field not visible; bots filling it do not pollute CRM

## Database / isolation

- [ ] No Supabase — Neon optional; access only via server
- [ ] If Neon: least-privilege credentials; no public SQL API
- [ ] No consumer PHI fields in schema

## Sensitive data

- [ ] No full PII in localStorage (receipt id only)
- [ ] Webhook payload includes consent + npnPending flags
- [ ] Logs do not print email/phone/NPN bodies

## Payments / webhooks

- [ ] No payments
- [ ] Outbound CRM webhook: monitor Zapier history daily during beta

## Mobile / narrow screen

- [ ] Direct app URL at ~390px: no horizontal overflow; form usable
- [ ] HubSpot embed: **Open full screen** banner appears when iframed on mobile
- [ ] Sticky chrome does not hide primary CTAs

## Error / loading / empty / success

- [ ] Empty wizard: Continue disabled until required fields
- [ ] Lead validation errors explain how to fix
- [ ] Delivery failure shows mailto fallback
- [ ] Success shows clear follow-up message + optional reference id

## Accessibility

- [ ] Form labels present; errors use `role="alert"`
- [ ] Keyboard can complete wizard and lead form
- [ ] Focus visible on controls
- [ ] Touch targets ≥ ~44px on primary actions

## UX onboarding

- [ ] First screen states: free tool, any primary market, no login, no consumer data
- [ ] Primary CTA: **Calculate My Opportunity**
- [ ] Dollars framed as potential / illustrative

## Rollback / recovery

- [ ] Revert Vercel deployment to previous production if lead delivery breaks
- [ ] Temporarily unset `LEAD_WEBHOOK_URL` forces email fallback (form still usable)
- [ ] Git tag or known good commit on `main` before marketing push

## HubSpot-specific

- [ ] Marketing page iframe `src` points at production Vercel URL
- [ ] Prefer responsive embed or full redirect on mobile
- [ ] End-to-end: submit from HubSpot page → CRM contact verified by a human

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Product | | | |
| Marketing / HubSpot | | | |
| Engineering | | | |


## Fragile browser APIs (regression watch)

These failed in real use before — re-check after every share/lead change:

- [ ] **Copy estimate** works on desktop Chrome and mobile Safari (button + visible text boxes)
- [ ] **No save/copy link** (removed — marketing URLs do not restore state)
- [ ] **No long mailto** for estimate email (removed by design)
- [ ] Lead **delivery failure** shows **Copy my request** (not only email app)
- [ ] **Print** hidden or messaged inside HubSpot iframe
- [ ] Place-rate helper text says **35% / 20–50%**, not 5–15%
