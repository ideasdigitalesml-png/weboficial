-- Lets admins see custom_domains/domain_registrants rows across all users
-- (same additive-SELECT-policy pattern as 0006_admin_panel.sql's
-- landings_select_admin etc.) -- needed for the /admin "dominios con error"
-- list, so an admin can see a failed registration (and the registrant's
-- contact info, to resolve it manually) without a service-role bypass.
create policy "custom_domains_select_admin"
  on public.custom_domains for select
  to authenticated
  using (public.is_admin());

create policy "domain_registrants_select_admin"
  on public.domain_registrants for select
  to authenticated
  using (public.is_admin());
