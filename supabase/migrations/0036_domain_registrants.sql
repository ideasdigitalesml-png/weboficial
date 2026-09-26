-- domain_registrants: the WHOIS/contact data for a domain's actual titular,
-- captured fresh at purchase time and always editable per purchase --
-- unlike registrant_contacts (one fixed row reused forever per weboficial
-- user), the domain's owner can be a different person/email each time
-- (business rule: the .com belongs to the customer, not to weboficial).
-- 1:1 with custom_domains via a shared primary key. registrant_contacts is
-- no longer written to by the purchase flow (left in place, unused, rather
-- than dropped -- no data loss risk either way since there are no real
-- customers yet, but dropping isn't needed for this change to work).
create table public.domain_registrants (
  custom_domain_id uuid primary key references public.custom_domains (id) on delete cascade,
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
  created_at timestamptz not null default now()
);

alter table public.domain_registrants enable row level security;

create policy "domain_registrants_select_own"
  on public.domain_registrants for select
  to authenticated
  using (
    exists (
      select 1 from public.custom_domains
      join public.landings on landings.id = custom_domains.landing_id
      where custom_domains.id = domain_registrants.custom_domain_id
      and landings.user_id = auth.uid()
    )
  );

-- Same shape as custom_domains_insert_own_pending: the user may attach
-- registrant data to their own custom_domains row while it's still
-- pending_payment (i.e. right after creating it, before paying) -- there is
-- no UPDATE policy at all, so once inserted it's immutable to the caller.
create policy "domain_registrants_insert_own"
  on public.domain_registrants for insert
  to authenticated
  with check (
    exists (
      select 1 from public.custom_domains
      join public.landings on landings.id = custom_domains.landing_id
      where custom_domains.id = domain_registrants.custom_domain_id
      and landings.user_id = auth.uid()
      and custom_domains.status = 'pending_payment'
    )
  );

-- resellerclub_customers: reuses a ResellerClub "customer" record by the
-- registrant's email across purchases, independent of which weboficial
-- account bought -- ResellerClub's customers/signup.json errors if the same
-- username/email signs up twice, and since domain_registrants is per
-- purchase (not per weboficial user) there's no other place left to cache
-- this. Only ever read/written by the webhook (service_role) -- no policies
-- granted, same lockdown shape as webhook_events.
create table public.resellerclub_customers (
  email text primary key,
  resellerclub_customer_id text not null,
  created_at timestamptz not null default now()
);

alter table public.resellerclub_customers enable row level security;
