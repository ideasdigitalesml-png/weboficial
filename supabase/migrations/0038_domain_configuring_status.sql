-- 'configuring': ResellerClub registration + the Vercel domain-add (bare +
-- www) both succeeded, but the domain isn't actually live for a visitor
-- until Vercel confirms both hosts are verified -- NS delegation can take
-- anywhere from minutes to a few hours to propagate through the .com
-- registry, entirely outside our control. Previously finalize_domain_registration
-- jumped straight to 'active', which lied about domains still propagating
-- (see reconcile-domain-configuration.ts for how 'configuring' -> 'active'
-- actually happens).
alter table public.custom_domains drop constraint custom_domains_status_check;
alter table public.custom_domains add constraint custom_domains_status_check
  check (status in ('pending_payment', 'pending_registration', 'configuring', 'active', 'failed', 'expired'));

-- Same signature as before (CREATE OR REPLACE on an unchanged signature
-- preserves the 0025_lock_down_domain_rpcs.sql revoke -- no need to redo it)
-- -- only the resulting status differs.
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
  set status = 'configuring',
      resellerclub_order_id = p_resellerclub_order_id,
      vercel_domain_added = true,
      expires_at = p_expires_at
  where id = p_custom_domain_id and status = 'pending_registration';
end;
$$;

-- Flips 'configuring' -> 'active' once reconcile-domain-configuration.ts
-- has actually confirmed both hosts are verified in Vercel. Brand-new
-- function, so (unlike finalize_domain_registration above) it needs its
-- own explicit revoke -- a fresh CREATE FUNCTION defaults to PUBLIC.
create or replace function public.activate_verified_domain(
  p_custom_domain_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.custom_domains
  set status = 'active'
  where id = p_custom_domain_id and status = 'configuring';
end;
$$;

revoke execute on function public.activate_verified_domain(uuid) from public, anon, authenticated;
