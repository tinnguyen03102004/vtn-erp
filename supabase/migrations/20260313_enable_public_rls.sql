-- Harden Supabase public API surface.
-- App server now reads/writes through Prisma/direct Postgres, so public REST access
-- should be denied by default unless explicit policies are added later.

alter table public.attachments enable row level security;
alter table public.users enable row level security;
alter table public.accounts enable row level security;
alter table public.sessions enable row level security;
alter table public.verification_tokens enable row level security;
alter table public.employees enable row level security;
alter table public.crm_stages enable row level security;
alter table public.crm_leads enable row level security;
alter table public.sale_order_lines enable row level security;
alter table public.sale_milestones enable row level security;
alter table public.projects enable row level security;
alter table public.project_phases enable row level security;
alter table public.project_tasks enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.timesheets enable row level security;
alter table public.audit_logs enable row level security;
alter table public.settings enable row level security;
alter table public.app_sessions enable row level security;
alter table public.sale_orders enable row level security;
