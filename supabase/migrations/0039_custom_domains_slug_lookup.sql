-- Reverse of custom_domains_active_domain_lookup (0024_custom_domains.sql):
-- that one is domain -> slug (proxy.ts resolving an incoming custom-domain
-- Host header), this is slug -> domain (proxy.ts checking, on every
-- <slug>.weboficial.com.ar request, whether that landing already has an
-- active custom domain to redirect to instead). Hit on every subdomain
-- request, so it gets the same partial index treatment.
create index custom_domains_active_slug_lookup
  on public.custom_domains (slug)
  where status = 'active';
