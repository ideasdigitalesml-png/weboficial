-- PublicLandingView now joins professions(slug) and templates(config) to
-- pick the right per-profession template component and accent color. Both
-- tables were only readable "to authenticated" (0002_landings_schema.sql),
-- which is fine for the onboarding wizard but breaks anonymous visitors on
-- a published landing -- the embedded join silently comes back null under
-- RLS, so the page 404s even though the landing itself is public.
--
-- Both tables are non-sensitive catalog/reference data (profession names,
-- slugs, form field definitions, template preview images and display
-- config) -- there's nothing here a public visitor shouldn't see, so this
-- widens the existing "authenticated" policies to "public" rather than
-- trying to scope it to "only rows referenced by an active landing".
create policy "professions_select_public"
  on public.professions for select
  to public
  using (true);

create policy "templates_select_public"
  on public.templates for select
  to public
  using (true);
