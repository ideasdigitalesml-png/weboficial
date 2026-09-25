-- Cambiar plantilla (/dashboard/cambiar-plantilla): template_id was
-- previously locked forever by this trigger ("template_id cannot be changed
-- after creation, for anyone"). Now a landing's owner can switch between
-- templates of their OWN profession (see
-- lib/landings/update-landing.ts:updateLandingTemplate) -- switching to a
-- template belonging to a different profession is still blocked, since that
-- template's layout wouldn't match the landing's form_data/form_schema.
create or replace function public.protect_landing_immutable_fields()
returns trigger
language plpgsql
as $$
begin
  if new.template_id is distinct from old.template_id then
    if not exists (
      select 1 from public.templates
      where id = new.template_id and profession_id = old.profession_id
    ) then
      raise exception 'template_id must belong to the same profession as the landing';
    end if;
  end if;

  if new.status is distinct from old.status and auth.role() <> 'service_role' then
    raise exception 'status can only be changed by the Mercado Pago webhook';
  end if;

  return new;
end;
$$;
