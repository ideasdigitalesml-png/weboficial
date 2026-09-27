-- proxy.ts's resolveCustomDomainSlug now matches status IN ('configuring',
-- 'active') instead of just 'active' (a domain can start actually resolving
-- before our own DB record catches up to 'active' -- see
-- reconcile-domain-configuration.ts). custom_domains_active_domain_lookup
-- (0024_custom_domains.sql) only indexed 'active' rows, so a 'configuring'
-- row wouldn't benefit from it on this hot path (every external-domain
-- request). Replaced with a wider partial index covering both statuses.
drop index public.custom_domains_active_domain_lookup;

create index custom_domains_domain_lookup
  on public.custom_domains (domain)
  where status in ('configuring', 'active');
