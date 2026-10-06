-- Marks the instant the Meta Pixel/Conversions API "CompleteRegistration"
-- event was reported for this user, so auth/callback can fire it exactly
-- once (on first login/signup) instead of on every subsequent sign-in.
alter table public.profiles
  add column registration_tracked_at timestamptz;

-- Backfill existing users as already-tracked so the new instrumentation
-- never fires retroactively for anyone who signed up before this column
-- existed.
update public.profiles
  set registration_tracked_at = now()
  where registration_tracked_at is null;

-- This column must only ever be written by the server (the auth/callback
-- route, via the service-role client), never by the user's own session --
-- otherwise a user could suppress or replay their own CompleteRegistration
-- tracking. A column-level REVOKE would NOT work here: Supabase grants
-- UPDATE at the table level to authenticated/anon by default, and a
-- column-level revoke doesn't override a broader table-level grant in
-- Postgres. So enforce it with a trigger instead: any attempt to change
-- this column from a role other than service_role is silently reverted
-- to its previous value. `postgres` is also exempted so a human can still
-- correct data by hand from the SQL editor.
create function public.protect_registration_tracked_at()
returns trigger
language plpgsql
as $$
begin
  if current_user not in ('service_role', 'postgres')
     and new.registration_tracked_at is distinct from old.registration_tracked_at then
    new.registration_tracked_at := old.registration_tracked_at;
  end if;
  return new;
end;
$$;

create trigger protect_registration_tracked_at
  before update on public.profiles
  for each row
  execute function public.protect_registration_tracked_at();
