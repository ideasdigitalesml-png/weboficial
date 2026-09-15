-- Subscriptions: one row per Mercado Pago preapproval. A landing can have
-- more than one over time (e.g. cancelled + resubscribed later), but never
-- more than one simultaneously 'authorized' -- enforced below with a
-- partial unique index, not just application logic.

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  landing_id uuid not null references public.landings (id),
  plan_id uuid not null references public.plans (id),
  mp_preapproval_id text not null unique,
  status text not null check (status in ('pending', 'authorized', 'paused', 'cancelled')),
  init_point text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_one_authorized_per_landing
  on public.subscriptions (landing_id)
  where status = 'authorized';

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  to authenticated
  using (
    exists (
      select 1 from public.landings
      where landings.id = subscriptions.landing_id
      and landings.user_id = auth.uid()
    )
  );

-- The user may kick off a subscription (status stays 'pending' until the
-- webhook says otherwise), but can never insert it in any other status, and
-- there is no UPDATE policy at all for authenticated users below -- once
-- created, only service_role (via the RPCs further down) can change it.
create policy "subscriptions_insert_own_pending"
  on public.subscriptions for insert
  to authenticated
  with check (
    status = 'pending'
    and exists (
      select 1 from public.landings
      where landings.id = subscriptions.landing_id
      and landings.user_id = auth.uid()
    )
  );

-- Payments: one row per Mercado Pago payment. Written exclusively by the
-- webhook (service_role) -- there is no INSERT/UPDATE policy for
-- authenticated users at all.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id),
  mp_payment_id text not null unique,
  status text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'ARS',
  mp_payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments_select_own"
  on public.payments for select
  to authenticated
  using (
    exists (
      select 1
      from public.subscriptions
      join public.landings on landings.id = subscriptions.landing_id
      where subscriptions.id = payments.subscription_id
      and landings.user_id = auth.uid()
    )
  );

-- Webhook events: internal audit/idempotency log. RLS is enabled with no
-- policies at all -- not even the landing owner can read this; only
-- service_role (which bypasses RLS) ever touches it.

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  mp_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'received' check (status in ('received', 'processed', 'failed', 'duplicate')),
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.webhook_events enable row level security;

-- Activation/deactivation RPCs. SECURITY DEFINER, but deliberately NOT
-- granted to authenticated/anon (unlike the slug helpers from Milestone 3):
-- these are the only two places in the whole schema that can flip
-- landings.status, so only service_role may ever call them.

create or replace function public.record_approved_payment(
  p_subscription_id uuid,
  p_mp_payment_id text,
  p_status text,
  p_amount numeric,
  p_currency text,
  p_mp_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landing_id uuid;
begin
  insert into public.payments (subscription_id, mp_payment_id, status, amount, currency, mp_payload)
  values (p_subscription_id, p_mp_payment_id, p_status, p_amount, p_currency, p_mp_payload)
  on conflict (mp_payment_id) do update
    set status = excluded.status,
        mp_payload = excluded.mp_payload;

  if p_status = 'approved' then
    update public.subscriptions
    set status = 'authorized'
    where id = p_subscription_id;

    select landing_id into v_landing_id
    from public.subscriptions
    where id = p_subscription_id;

    -- The `where status = 'draft'` guard is what makes this idempotent for
    -- renewal payments: once the landing is already 'active', re-running
    -- this (duplicate webhook, or a later monthly charge) is a no-op here.
    update public.landings
    set status = 'active', published_at = now()
    where id = v_landing_id and status = 'draft';
  end if;
end;
$$;

create or replace function public.upsert_subscription_from_preapproval(
  p_mp_preapproval_id text,
  p_landing_id uuid,
  p_plan_id uuid,
  p_status text,
  p_init_point text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subscription_id uuid;
begin
  insert into public.subscriptions (landing_id, plan_id, mp_preapproval_id, status, init_point)
  values (p_landing_id, p_plan_id, p_mp_preapproval_id, p_status, p_init_point)
  on conflict (mp_preapproval_id) do update
    set status = excluded.status
  returning id into v_subscription_id;

  if p_status = 'cancelled' then
    update public.landings
    set status = 'deactivated'
    where id = p_landing_id and status = 'active';
  end if;

  return v_subscription_id;
end;
$$;
