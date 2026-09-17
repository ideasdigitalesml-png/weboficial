-- The onboarding wizard is now reachable without a session (form + live
-- preview happen before signup; see the registration-flow refactor this
-- shipped in). It already needed professions/templates readable by anon
-- (0011_public_profession_template_read.sql) -- stock_images (profile
-- photo gallery) and the slug-availability RPCs are the remaining two
-- reads an anonymous visitor needs while filling the form. Both are
-- non-sensitive (a public image catalog and a boolean "is this slug
-- taken" check), so this widens them the same way 0011 did.
create policy "stock_images_select_public"
  on public.stock_images for select
  to public
  using (true);

grant execute on function public.is_slug_taken(text) to public;
grant execute on function public.filter_taken_slugs(text[]) to public;
