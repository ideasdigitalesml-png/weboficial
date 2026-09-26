-- activate_domain_payment now reports whether it actually transitioned the
-- row (pending_payment -> pending_registration) instead of returning void.
-- Mercado Pago can deliver two distinct notifications (different
-- mp_event_id, so webhook_events' uniqueness doesn't dedupe them) for the
-- same underlying payment -- e.g. a status-change re-notification. Without
-- this, process-mercadopago-webhook.ts's handleDomainPaymentEvent had no way
-- to tell "first activation" apart from "already past pending_payment" and
-- fell through into a second real registerDomain() call against
-- ResellerClub for an already-registered domain.
--
-- Return type changes from void to boolean, so the function must be dropped
-- and recreated (CREATE OR REPLACE can't change a function's return type).
drop function public.activate_domain_payment(uuid, text);

create function public.activate_domain_payment(
  p_custom_domain_id uuid,
  p_mp_payment_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row_count int;
begin
  update public.custom_domains
  set status = 'pending_registration',
      mp_payment_id = p_mp_payment_id
  where id = p_custom_domain_id and status = 'pending_payment';
  get diagnostics v_row_count = row_count;
  return v_row_count > 0;
end;
$$;

-- Recreating the function reset EXECUTE to the default (granted to PUBLIC)
-- -- reapply the same lockdown 0025_lock_down_domain_rpcs.sql put in place.
revoke execute on function public.activate_domain_payment(uuid, text) from public, anon, authenticated;
