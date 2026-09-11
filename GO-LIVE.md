# PSM go-live checklist

Run this before any app with NPN, agent PII, or pay data goes (or stays) live.

- [ ] Unique credentials. No shared desk login for tools that hold PII or pay.
- [ ] Secrets only in Vercel env. Nothing in README, chat logs, or review packets.
- [ ] Rotate anything that was ever shared or committed.
- [ ] Live database: RLS on. Agent tables own-row only. Confirm in the **live** SQL editor, not by commit name.
- [ ] Backups on. One restore tested and dated.
- [ ] `LEAD_WEBHOOK_URL` set. Forms fail closed if it is missing.
- [ ] Preview deployments do **not** accept live NPNs (`ALLOW_PREVIEW_LEADS` unset).
- [ ] Logs redact email, phone, NPN.
- [ ] No `AGENTS.md`, `.grok/`, or Created-with-Grok banner in the shipped tree.
- [ ] `npm run build` does **not** run `db:migrate`. Migrate is a separate, reviewed step.
- [ ] Production URL is a `psmbrokerage.com` host, not a preview `*.vercel.app`.
- [ ] A second human (IT / contractor) reviews before merge.

Do not open a new repo until this list is checked for ClearPath and this calculator.
