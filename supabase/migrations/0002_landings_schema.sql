-- Catalog tables: plans, professions, templates, stock_images.
-- Seed-only in the MVP (no admin CRUD) but readable at runtime by any
-- authenticated user, since the onboarding wizard needs them.

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  amount numeric(12, 2) not null,
  currency text not null default 'ARS',
  frequency text not null default 'monthly' check (frequency in ('monthly')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.plans enable row level security;

create policy "plans_select_authenticated"
  on public.plans for select
  to authenticated
  using (true);

create table public.professions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  form_schema jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.professions enable row level security;

create policy "professions_select_authenticated"
  on public.professions for select
  to authenticated
  using (true);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  profession_id uuid not null references public.professions (id) on delete cascade,
  name text not null,
  slug text not null,
  preview_image_url text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint templates_profession_slug_key unique (profession_id, slug)
);

alter table public.templates enable row level security;

create policy "templates_select_authenticated"
  on public.templates for select
  to authenticated
  using (true);

create table public.stock_images (
  id uuid primary key default gen_random_uuid(),
  profession_id uuid references public.professions (id) on delete cascade,
  category text not null,
  image_url text not null unique,
  created_at timestamptz not null default now()
);

alter table public.stock_images enable row level security;

create policy "stock_images_select_authenticated"
  on public.stock_images for select
  to authenticated
  using (true);

-- Landings: one per user in the MVP. `status` is a payment-controlled field
-- (see protect_landing_immutable_fields below) and `template_id` is fixed
-- forever once the row is created.

create table public.landings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  profession_id uuid not null references public.professions (id),
  template_id uuid not null references public.templates (id),
  plan_id uuid not null references public.plans (id),
  slug text not null,
  internal_subdomain text not null,
  domain_type text not null default 'subdomain' check (domain_type = 'subdomain'),
  form_data jsonb not null default '{}'::jsonb,
  sections_config jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'active', 'deactivated')),
  onboarding_status text not null default 'not_started' check (onboarding_status in ('not_started', 'payment_pending', 'completed')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landings_user_id_key unique (user_id),
  constraint landings_slug_key unique (slug),
  constraint landings_internal_subdomain_key unique (internal_subdomain)
);

alter table public.landings enable row level security;

create policy "landings_select_own"
  on public.landings for select
  to authenticated
  using (auth.uid() = user_id);

-- Any client-issued insert is forced into status='draft' /
-- onboarding_status='not_started' regardless of what the request body says.
create policy "landings_insert_own"
  on public.landings for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'draft'
    and onboarding_status = 'not_started'
  );

create policy "landings_update_own"
  on public.landings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at is always maintained by Postgres, never set from application code.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger landings_set_updated_at
  before update on public.landings
  for each row
  execute function public.set_updated_at();

-- status can only be flipped by the Mercado Pago webhook, which runs as
-- service_role. template_id can never change after creation, for anyone.
create or replace function public.protect_landing_immutable_fields()
returns trigger
language plpgsql
as $$
begin
  if new.template_id is distinct from old.template_id then
    raise exception 'template_id cannot be changed after creation';
  end if;

  if new.status is distinct from old.status and auth.role() <> 'service_role' then
    raise exception 'status can only be changed by the Mercado Pago webhook';
  end if;

  return new;
end;
$$;

create trigger landings_protect_immutable_fields
  before update on public.landings
  for each row
  execute function public.protect_landing_immutable_fields();

-- Slug availability helpers. SECURITY DEFINER because a regular
-- authenticated user's RLS scope only exposes their own landing row, but
-- checking/suggesting a subdomain slug requires visibility across all
-- users. Both functions only ever return a boolean or the candidate slugs
-- themselves, never any other landing data, so this stays narrowly scoped.

create or replace function public.is_slug_taken(candidate text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.landings where slug = candidate);
$$;

grant execute on function public.is_slug_taken(text) to authenticated;

create or replace function public.filter_taken_slugs(candidates text[])
returns text[]
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(array_agg(c), '{}'::text[])
  from unnest(candidates) as c
  where exists (select 1 from public.landings where slug = c);
$$;

grant execute on function public.filter_taken_slugs(text[]) to authenticated;
