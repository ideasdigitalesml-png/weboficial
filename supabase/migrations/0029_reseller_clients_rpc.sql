-- Narrow, purpose-built read for the reseller dashboard's client table.
-- Resellers have no RLS SELECT access to `landings`/`payments`/`subscriptions`
-- at all (those policies only cover the landing's own owner and admins) --
-- deliberately not widened here either, since that would hand a reseller the
-- professional's entire form_data. Instead this returns exactly the columns
-- the dashboard needs (name, rubro, phone for the WhatsApp nudge, last
-- payment status), resolved from auth.uid() the same way create_payout_request
-- resolves its own reseller_id, never a client-supplied id.
create or replace function public.get_reseller_clients()
returns table (
  landing_id uuid,
  professional_name text,
  profession_name text,
  phone text,
  landing_status text,
  created_at timestamptz,
  last_payment_status text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    l.id,
    l.form_data ->> 'name',
    p.name,
    l.form_data ->> 'phone',
    l.status,
    l.created_at,
    (
      select pay.status
      from public.payments pay
      join public.subscriptions s on s.id = pay.subscription_id
      where s.landing_id = l.id
      order by pay.created_at desc
      limit 1
    )
  from public.landings l
  join public.professions p on p.id = l.profession_id
  join public.resellers r on r.id = l.reseller_id
  where r.user_id = auth.uid()
  order by l.created_at desc;
$$;

grant execute on function public.get_reseller_clients() to authenticated;
revoke execute on function public.get_reseller_clients() from public, anon;
