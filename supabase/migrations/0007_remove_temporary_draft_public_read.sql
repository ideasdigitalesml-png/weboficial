-- Closes the temporary hole opened by 0004_public_landing_read.sql: that
-- migration made 'draft' landings publicly readable (no login required) as
-- a stopgap for testing multi-tenant routing before Milestone 4 (real
-- Mercado Pago activation) shipped. Both conditions the original comment
-- named as the trigger for removing it are now true -- Milestone 4 is live
-- in production -- and leaving it in also undermines Milestone 7's
-- admin-only visibility guarantee (any signed-in user could already read
-- any other user's still-unpaid landing).

drop policy "landings_select_public" on public.landings;

create policy "landings_select_public"
  on public.landings for select
  to public
  using (status = 'active');
