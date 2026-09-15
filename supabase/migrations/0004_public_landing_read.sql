-- ============================================================================
-- ATENCION: PERMISO TEMPORAL, SOLO PARA DESARROLLO
-- ============================================================================
-- Esta policy agrega lectura pública (rol "public", incluye visitantes
-- anónimos) sobre landings con status = 'active' O status = 'draft'.
--
-- La rama "or status = 'draft'" NO debería existir en producción: existe
-- únicamente para poder probar el routing multi-tenant del Milestone 3
-- antes de que el Milestone 4 (pago con Mercado Pago) empiece a producir
-- landings realmente 'active'.
--
-- ANTES DE PRODUCCION / ANTES DE QUE SALGA EL MILESTONE 4:
--   Sacar la cláusula "or status = 'draft'" de esta policy, dejando
--   únicamente status = 'active'. Sin este cambio, cualquier landing en
--   borrador (con datos que el usuario todavía no confirmó ni pagó)
--   quedaría visible públicamente sin login.
-- ============================================================================

create policy "landings_select_public"
  on public.landings for select
  to public
  using (
    status = 'active'
    or status = 'draft' -- TEMPORAL: sacar antes de producción, ver aviso arriba
  );
