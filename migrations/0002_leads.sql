-- Public agent lead captures from the Opportunity Calculator.
-- No consumer PHI. Practice-level estimates only.
-- Access is via server functions only (no direct client SQL).

create table if not exists leads (
  id text primary key,
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  state text not null,
  npn text,
  contracted_with_psm text not null,
  message text,
  calculator_snapshot jsonb,
  source text not null default 'agent-opportunity-calculator',
  user_agent text,
  ip_hash text
);

create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists leads_email_idx on leads (email);
