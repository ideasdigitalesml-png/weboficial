-- The security advisor flags that SECURITY DEFINER functions are callable
-- by anon/authenticated via PostgREST's /rest/v1/rpc/* unless EXECUTE is
-- explicitly revoked -- Postgres grants it to PUBLIC by default, and
-- 0024_custom_domains.sql never revoked it. Without this, any authenticated
-- user could call activate_domain_payment on someone else's pending_payment
-- row with a fabricated mp_payment_id and push it into pending_registration
-- -- i.e. trigger a real domain registration attempt without having paid.
-- Scoped to only the 3 new functions from this feature.

revoke execute on function public.activate_domain_payment(uuid, text) from public, anon, authenticated;
revoke execute on function public.finalize_domain_registration(uuid, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.mark_domain_registration_failed(uuid, text) from public, anon, authenticated;
