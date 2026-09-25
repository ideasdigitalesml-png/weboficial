-- Reseller program: manually-approved resellers earn a lifetime 25%
-- commission on every approved monthly payment from landings they referred.
-- First-touch attribution (landings.reseller_id, set once and never
-- overwritten -- see protect_landing_referral_attribution below). Does not
-- touch the Mercado Pago webhook or record_approved_payment at all: instead
-- a trigger on `payments` itself reacts to status = 'approved' and calls the
-- SECURITY DEFINER create_reseller_commission(), same "trigger + narrowly
-- scoped RPC" shape as landings.status / record_approved_payment already use.

create table public.resellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  whatsapp text not null,
  referral_code text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  cbu_alias text,
  created_at timestamptz not null default now(),
  approved_at timestamptz not null default now()
);

create index resellers_referral_code_active_idx
  on public.resellers (referral_code)
  where status = 'active';

alter table public.resellers enable row level security;

create policy "resellers_select_own"
  on public.resellers for select
  to authenticated
  using (auth.uid() = user_id);

-- reseller_payout_requests is created before reseller_commissions because
-- the latter has a FK into it (payout_request_id).

create table public.reseller_payout_requests (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references public.resellers (id),
  amount numeric(12, 2) not null check (amount > 0),
  cbu_alias text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  notes text
);

create index reseller_payout_requests_reseller_idx
  on public.reseller_payout_requests (reseller_id);

-- Guards the same invariant create_payout_request() checks in application
-- code, but atomically -- belt and suspenders against a race between two
-- concurrent RPC calls from the same reseller.
create unique index reseller_payout_requests_one_pending_per_reseller
  on public.reseller_payout_requests (reseller_id)
  where status = 'pending';

alter table public.reseller_payout_requests enable row level security;

create policy "reseller_payout_requests_select_own"
  on public.reseller_payout_requests for select
  to authenticated
  using (
    exists (
      select 1 from public.resellers
      where resellers.id = reseller_payout_requests.reseller_id
      and resellers.user_id = auth.uid()
    )
  );

-- Deliberately no INSERT policy: creating a payout request must also
-- atomically flip the underlying commissions to 'processing' and stamp
-- payout_request_id on them, which a plain row-level INSERT policy on this
-- table can't guarantee by itself. The only way in is create_payout_request()
-- below (SECURITY DEFINER) -- it still only ever lets a reseller act on
-- their own row (resolved from auth.uid(), never a client-supplied id), so
-- this isn't a loss of the "crear las suyas" guarantee, just enforced one
-- layer up.

create table public.reseller_commissions (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references public.resellers (id),
  payment_id uuid not null unique references public.payments (id),
  landing_id uuid not null references public.landings (id),
  payment_amount numeric(12, 2) not null,
  commission_amount numeric(12, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid')),
  payout_request_id uuid references public.reseller_payout_requests (id),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index reseller_commissions_reseller_status_idx
  on public.reseller_commissions (reseller_id, status);
create index reseller_commissions_payout_request_idx
  on public.reseller_commissions (payout_request_id);

alter table public.reseller_commissions enable row level security;

create policy "reseller_commissions_select_own"
  on public.reseller_commissions for select
  to authenticated
  using (
    exists (
      select 1 from public.resellers
      where resellers.id = reseller_commissions.reseller_id
      and resellers.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE policy for authenticated users at all -- written
-- exclusively by create_reseller_commission (trigger-invoked) and
-- create_payout_request/approve_payout below, same as payments/subscriptions.

-- landings: referral attribution, set once at landing-creation time.

alter table public.landings
  add column reseller_id uuid references public.resellers (id),
  add column referral_code text;

create index landings_reseller_id_idx on public.landings (reseller_id);

-- Extends the existing insert policy so a client-issued insert can only ever
-- reference an active reseller. resolve_active_reseller_id() below is the
-- only supported way a legitimate client resolves a reseller_id to send.
drop policy "landings_insert_own" on public.landings;
create policy "landings_insert_own"
  on public.landings for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'draft'
    and onboarding_status = 'not_started'
    and (
      reseller_id is null
      or exists (select 1 from public.resellers where id = reseller_id and status = 'active')
    )
  );

-- First-touch attribution is permanent: once reseller_id is set, nothing
-- (including the owner's own landings_update_own policy) can change or clear
-- it. Mirrors protect_landing_immutable_fields' treatment of status/template_id.
create or replace function public.protect_landing_referral_attribution()
returns trigger
language plpgsql
as $$
begin
  if old.reseller_id is not null and new.reseller_id is distinct from old.reseller_id then
    raise exception 'reseller_id cannot be changed once set';
  end if;
  return new;
end;
$$;

create trigger landings_protect_referral_attribution
  before update on public.landings
  for each row
  execute function public.protect_landing_referral_attribution();

-- Public helper: resolve a referral code to an active reseller's id.
-- SECURITY DEFINER because RLS on resellers only allows selecting your own
-- row, and this needs to work for anonymous visitors and freshly-registered
-- users alike, before they have any relationship with the reseller. Only
-- ever returns an id (or null) -- no PII, same shape as is_slug_taken.
create or replace function public.resolve_active_reseller_id(p_referral_code text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.resellers
  where referral_code = upper(p_referral_code) and status = 'active'
  limit 1;
$$;

grant execute on function public.resolve_active_reseller_id(text) to anon, authenticated;

-- create_reseller_commission: called exclusively by the payments trigger
-- below, never directly by a client -- see the revoke underneath, same
-- reasoning as 0025_lock_down_domain_rpcs.sql.
create or replace function public.create_reseller_commission(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landing_id uuid;
  v_reseller_id uuid;
  v_amount numeric;
begin
  select p.amount, s.landing_id
  into v_amount, v_landing_id
  from public.payments p
  join public.subscriptions s on s.id = p.subscription_id
  where p.id = p_payment_id;

  if v_landing_id is null then
    return;
  end if;

  select reseller_id into v_reseller_id
  from public.landings
  where id = v_landing_id;

  if v_reseller_id is null then
    return;
  end if;

  insert into public.reseller_commissions
    (reseller_id, payment_id, landing_id, payment_amount, commission_amount)
  values
    (v_reseller_id, p_payment_id, v_landing_id, v_amount, round(v_amount * 0.25, 2))
  on conflict (payment_id) do nothing;
end;
$$;

revoke execute on function public.create_reseller_commission(uuid) from public, anon, authenticated;

-- Fires on every payments insert/update that lands in status = 'approved' --
-- covers both a fresh INSERT (first attempt approved) and the ON CONFLICT DO
-- UPDATE branch inside record_approved_payment (a retried webhook delivery
-- for the same mp_payment_id). create_reseller_commission's own
-- ON CONFLICT (payment_id) DO NOTHING makes re-firing harmless.
create or replace function public.handle_payment_approved_for_commission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_reseller_commission(new.id);
  return new;
end;
$$;

create trigger payments_create_reseller_commission
  after insert or update on public.payments
  for each row
  when (new.status = 'approved')
  execute function public.handle_payment_approved_for_commission();

-- create_payout_request: the reseller's "Solicitar Pago" action. Computes
-- the amount itself from the caller's own pending commissions (never trusts
-- a client-supplied amount), so the payout total and the commissions it
-- locks into 'processing' can never drift apart. Resolves the reseller from
-- auth.uid(), never a client-supplied reseller_id.
create or replace function public.create_payout_request(p_cbu_alias text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reseller_id uuid;
  v_amount numeric;
  v_payout_id uuid;
begin
  select id into v_reseller_id
  from public.resellers
  where user_id = auth.uid() and status = 'active';

  if v_reseller_id is null then
    raise exception 'not an active reseller';
  end if;

  if p_cbu_alias is null or length(trim(p_cbu_alias)) = 0 then
    raise exception 'cbu_alias is required';
  end if;

  if exists (
    select 1 from public.reseller_payout_requests
    where reseller_id = v_reseller_id and status = 'pending'
  ) then
    raise exception 'a payout request is already pending';
  end if;

  select coalesce(sum(commission_amount), 0) into v_amount
  from public.reseller_commissions
  where reseller_id = v_reseller_id and status = 'pending';

  if v_amount <= 0 then
    raise exception 'no pending balance to request';
  end if;

  insert into public.reseller_payout_requests (reseller_id, amount, cbu_alias)
  values (v_reseller_id, v_amount, trim(p_cbu_alias))
  returning id into v_payout_id;

  update public.reseller_commissions
  set status = 'processing', payout_request_id = v_payout_id
  where reseller_id = v_reseller_id and status = 'pending';

  update public.resellers set cbu_alias = trim(p_cbu_alias) where id = v_reseller_id;

  return v_payout_id;
end;
$$;

grant execute on function public.create_payout_request(text) to authenticated;

-- approve_payout: admin-only "Marcar como pagado" action. Checked internally
-- via is_admin() (same pattern as every other admin write in this schema)
-- rather than by withholding the grant, since admin actions in this codebase
-- always run through the caller's own RLS-scoped client, never a
-- service-role bypass (see require-admin.ts).
create or replace function public.approve_payout(p_payout_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  update public.reseller_payout_requests
  set status = 'paid', processed_at = now()
  where id = p_payout_request_id and status = 'pending';

  if not found then
    raise exception 'payout request not found or not pending';
  end if;

  update public.reseller_commissions
  set status = 'paid', paid_at = now()
  where payout_request_id = p_payout_request_id;
end;
$$;

grant execute on function public.approve_payout(uuid) to authenticated;

-- admin_create_reseller: admin-only "Crear revendedor" action. Looks the
-- user up in `profiles` (one row per auth.users row, email copied at signup
-- by handle_new_user -- see 0001_profiles.sql) rather than auth.users
-- directly, same source admin/queries.ts already treats as the owner email.
create or replace function public.admin_create_reseller(
  p_email text,
  p_name text,
  p_whatsapp text,
  p_referral_code text
)
returns public.resellers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_reseller public.resellers;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  select id into v_user_id from public.profiles where email = p_email;

  if v_user_id is null then
    raise exception 'no_account_for_email';
  end if;

  insert into public.resellers (user_id, name, email, whatsapp, referral_code)
  values (v_user_id, p_name, p_email, p_whatsapp, upper(p_referral_code))
  returning * into v_reseller;

  return v_reseller;
end;
$$;

grant execute on function public.admin_create_reseller(text, text, text, text) to authenticated;

-- admin_set_reseller_status: admin-only activate/deactivate toggle.
-- Deactivating never touches existing reseller_commissions rows -- the
-- reseller keeps earning on clients already attributed to them for life,
-- only resolve_active_reseller_id (status = 'active' filter) stops matching
-- their code for new signups.
create or replace function public.admin_set_reseller_status(p_reseller_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  if p_status not in ('active', 'inactive') then
    raise exception 'invalid status';
  end if;

  update public.resellers set status = p_status where id = p_reseller_id;
end;
$$;

grant execute on function public.admin_set_reseller_status(uuid, text) to authenticated;

-- Admin-wide read access, same additive-policy pattern as 0006_admin_panel.sql.

create policy "resellers_select_admin"
  on public.resellers for select
  to authenticated
  using (public.is_admin());

create policy "reseller_commissions_select_admin"
  on public.reseller_commissions for select
  to authenticated
  using (public.is_admin());

create policy "reseller_payout_requests_select_admin"
  on public.reseller_payout_requests for select
  to authenticated
  using (public.is_admin());
