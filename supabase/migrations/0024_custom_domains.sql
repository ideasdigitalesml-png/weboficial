-- Custom domain purchase (Fase 1): registrant WHOIS contact (reusable across
-- purchases) + the actual domain purchase/registration record. Follows the
-- same shape as 0005_subscriptions_payments_webhooks.sql: an authenticated
-- user may only insert their own row in its initial state; every later
-- status transition happens exclusively through a SECURITY DEFINER RPC that
-- only service_role (the webhook) ever calls.

-- registrant_contacts: one per user. This is the user's own WHOIS/contact
-- data (not money-moving state), so unlike subscriptions/payments they may
-- select/insert/update their own row directly -- the resellerclub_*_id
-- columns are still only ever populated by the webhook in practice (the
-- server action that writes this table never touches those two columns).
create table public.registrant_contacts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone_country_code text not null,
  phone_number text not null,
  address_line1 text not null,
  city text not null,
  state text not null,
  country_code text not null,
  zipcode text not null,
  company_name text,
  resellerclub_customer_id text,
  resellerclub_contact_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger registrant_contacts_set_updated_at
  before update on public.registrant_contacts
  for each row
  execute function public.set_updated_at();

alter table public.registrant_contacts enable row level security;

create policy "registrant_contacts_select_own"
  on public.registrant_contacts for select
  to authenticated
  using (user_id = auth.uid());

create policy "registrant_contacts_insert_own"
  on public.registrant_contacts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "registrant_contacts_update_own"
  on public.registrant_contacts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- custom_domains: one row per purchase attempt. `slug` is a copy of
-- landings.slug taken at insert time (not a live join) so src/proxy.ts can
-- resolve a custom-domain Host header to a landing slug with a single
-- indexed lookup on every request, same reasoning as denormalizing instead
-- of joining in a hot path.
create table public.custom_domains (
  id uuid primary key default gen_random_uuid(),
  landing_id uuid not null references public.landings (id),
  domain text not null unique,
  tld text not null,
  slug text not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'pending_registration', 'active', 'failed', 'expired')),
  price_ars numeric(12, 2) not null,
  mp_preference_id text,
  mp_payment_id text unique,
  resellerclub_order_id text,
  vercel_domain_added boolean not null default false,
  failure_reason text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index custom_domains_one_active_per_landing
  on public.custom_domains (landing_id)
  where status = 'active';

-- Fast path for src/proxy.ts: exact Host header match against active
-- custom domains only.
create index custom_domains_active_domain_lookup
  on public.custom_domains (domain)
  where status = 'active';

create trigger custom_domains_set_updated_at
  before update on public.custom_domains
  for each row
  execute function public.set_updated_at();

alter table public.custom_domains enable row level security;

create policy "custom_domains_select_own"
  on public.custom_domains for select
  to authenticated
  using (
    exists (
      select 1 from public.landings
      where landings.id = custom_domains.landing_id
      and landings.user_id = auth.uid()
    )
  );

-- Same idea as subscriptions_insert_own_pending: the user may kick off a
-- purchase (status stays 'pending_payment' until the webhook says
-- otherwise), but can never insert it in any other status, and there is no
-- UPDATE policy at all for authenticated users -- only service_role (via
-- the RPCs below) can change it from here on.
create policy "custom_domains_insert_own_pending"
  on public.custom_domains for insert
  to authenticated
  with check (
    status = 'pending_payment'
    and exists (
      select 1 from public.landings
      where landings.id = custom_domains.landing_id
      and landings.user_id = auth.uid()
    )
  );

-- Activation/registration RPCs. SECURITY DEFINER, deliberately NOT granted
-- to authenticated/anon -- only service_role (the webhook) may ever call
-- these, exactly like record_approved_payment / upsert_subscription_from_preapproval.

create or replace function public.activate_domain_payment(
  p_custom_domain_id uuid,
  p_mp_payment_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The `where status = 'pending_payment'` guard makes this idempotent
  -- against Mercado Pago's webhook retries: a duplicate delivery for a
  -- purchase that already moved on is a no-op here.
  update public.custom_domains
  set status = 'pending_registration',
      mp_payment_id = p_mp_payment_id
  where id = p_custom_domain_id and status = 'pending_payment';
end;
$$;

create or replace function public.finalize_domain_registration(
  p_custom_domain_id uuid,
  p_resellerclub_order_id text,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.custom_domains
  set status = 'active',
      resellerclub_order_id = p_resellerclub_order_id,
      vercel_domain_added = true,
      expires_at = p_expires_at
  where id = p_custom_domain_id and status = 'pending_registration';
end;
$$;

-- Payment already succeeded (money collected) but the ResellerClub
-- registration or the Vercel domain-add call failed -- surfaced in the
-- dashboard via failure_reason. No automatic refund in Fase 1; this is a
-- manual/support follow-up case, same as cancelSubscriptionAction's
-- "escribinos" dead end.
create or replace function public.mark_domain_registration_failed(
  p_custom_domain_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.custom_domains
  set status = 'failed',
      failure_reason = p_reason
  where id = p_custom_domain_id and status = 'pending_registration';
end;
$$;
