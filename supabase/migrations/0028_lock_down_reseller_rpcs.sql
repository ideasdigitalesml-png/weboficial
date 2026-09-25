-- `grant execute ... to authenticated` in 0027_resellers.sql didn't remove
-- the default PUBLIC EXECUTE grant Postgres adds to every new function --
-- the security advisor flagged all of these as still callable by `anon`.
-- Each function already checks auth.uid()/is_admin() internally and fails
-- safely for anon, but this closes the grant itself too, same as
-- 0025_lock_down_domain_rpcs.sql.

revoke execute on function public.create_payout_request(text) from public, anon;
revoke execute on function public.approve_payout(uuid) from public, anon;
revoke execute on function public.admin_create_reseller(text, text, text, text) from public, anon;
revoke execute on function public.admin_set_reseller_status(uuid, text) from public, anon;

-- Trigger-only function (return type `trigger`), never meant to be called
-- directly by anyone -- same treatment as create_reseller_commission.
revoke execute on function public.handle_payment_approved_for_commission() from public, anon, authenticated;
