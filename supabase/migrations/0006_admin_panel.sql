-- Admin panel (Milestone 7): profiles.role decides who is an admin. Two
-- guarantees, mirroring how landings.status is protected:
--   1. A user can never change their own (or anyone else's) role from the
--      client -- only service_role (i.e. a direct DB change, same as the
--      Mercado Pago webhook flips landings.status) can do it.
--   2. Admin-wide read access is granted via RLS itself (not by routing
--      admin queries through the service-role key), so the data-level
--      guarantee holds regardless of which code path queries Supabase.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception 'role can only be changed via direct database access';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row
  execute function public.protect_profile_role();

-- SECURITY DEFINER so it can be safely referenced from other tables' RLS
-- policies below without those policies needing their own visibility into
-- `profiles` -- it only ever returns a boolean, never row data.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- Additive SELECT policies: Postgres OR's multiple permissive policies on
-- the same table together, so these only ever widen access for admins --
-- everyone else keeps exactly the "own rows" access they already had.

create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "landings_select_admin"
  on public.landings for select
  to authenticated
  using (public.is_admin());

create policy "subscriptions_select_admin"
  on public.subscriptions for select
  to authenticated
  using (public.is_admin());

create policy "payments_select_admin"
  on public.payments for select
  to authenticated
  using (public.is_admin());
