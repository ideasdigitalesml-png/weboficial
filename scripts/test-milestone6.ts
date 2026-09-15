import { createLandingForUser } from "../src/lib/landings/create-landing";
import {
  updateLandingFormData,
  updateLandingSectionsConfig,
} from "../src/lib/landings/update-landing";
import {
  admin,
  createTestUser,
  deleteTestUser,
  signInAs,
  getSeedIds,
  VALID_FORM_DATA,
  assert,
  createRunner,
} from "./test-helpers";

async function main() {
  const { test, report } = createRunner();
  const { professionId, templateId } = await getSeedIds();
  const suffix = Date.now();

  await test("editar form_data de la propia landing persiste y se valida server-side", async () => {
    const email = `test-edit-own-${suffix}@example.com`;
    const userId = await createTestUser(email);
    try {
      const client = await signInAs(email);
      const created = await createLandingForUser(client, userId, {
        professionId,
        templateId,
        formData: VALID_FORM_DATA,
        desiredSlug: `contador-edit-own-${suffix}`,
      });
      assert(created.ok, `no se pudo crear la landing: ${JSON.stringify(created)}`);
      if (!created.ok) return;

      const invalid = await updateLandingFormData(client, userId, created.landing.id, {
        ...VALID_FORM_DATA,
        email: "no-es-un-email",
      });
      assert(
        !invalid.ok && invalid.reason === "invalid_form_data",
        `se esperaba invalid_form_data, se obtuvo ${JSON.stringify(invalid)}`
      );

      const newName = "Juan Carlos Pérez";
      const valid = await updateLandingFormData(client, userId, created.landing.id, {
        ...VALID_FORM_DATA,
        name: newName,
      });
      assert(valid.ok, `se esperaba éxito, se obtuvo ${JSON.stringify(valid)}`);

      const { data: row } = await admin
        .from("landings")
        .select("form_data")
        .eq("id", created.landing.id)
        .single();
      assert(
        row?.form_data.name === newName,
        "form_data.name debería reflejar el nuevo valor en la base"
      );
    } finally {
      await deleteTestUser(userId);
    }
  });

  await test("un usuario no puede editar la landing de otro usuario", async () => {
    const emailA = `test-owner-a-${suffix}@example.com`;
    const emailB = `test-owner-b-${suffix}@example.com`;
    const userAId = await createTestUser(emailA);
    const userBId = await createTestUser(emailB);
    try {
      const clientA = await signInAs(emailA);
      const clientB = await signInAs(emailB);

      const created = await createLandingForUser(clientA, userAId, {
        professionId,
        templateId,
        formData: VALID_FORM_DATA,
        desiredSlug: `contador-owner-a-${suffix}`,
      });
      assert(created.ok, `no se pudo crear la landing de A: ${JSON.stringify(created)}`);
      if (!created.ok) return;

      const attempt = await updateLandingFormData(clientB, userBId, created.landing.id, {
        ...VALID_FORM_DATA,
        name: "Nombre Intruso",
      });
      assert(
        !attempt.ok && attempt.reason === "not_found",
        `se esperaba not_found al intentar editar la landing de otro usuario, se obtuvo ${JSON.stringify(attempt)}`
      );

      const sectionsAttempt = await updateLandingSectionsConfig(
        clientB,
        userBId,
        created.landing.id,
        [
          { id: "hero", visible: false, order: 1 },
          { id: "about", visible: true, order: 2 },
          { id: "services", visible: true, order: 3 },
          { id: "contact", visible: true, order: 4 },
        ]
      );
      assert(
        !sectionsAttempt.ok && sectionsAttempt.reason === "not_found",
        `se esperaba not_found al intentar editar sections_config de otro usuario, se obtuvo ${JSON.stringify(sectionsAttempt)}`
      );

      const { data: row } = await admin
        .from("landings")
        .select("form_data")
        .eq("id", created.landing.id)
        .single();
      assert(
        row?.form_data.name === VALID_FORM_DATA.name,
        "form_data de la landing de A no debería haber cambiado"
      );
    } finally {
      await deleteTestUser(userAId);
      await deleteTestUser(userBId);
    }
  });

  await test("sections_config: reordenar y ocultar funciona, pero no se pueden agregar/quitar secciones", async () => {
    const email = `test-sections-${suffix}@example.com`;
    const userId = await createTestUser(email);
    try {
      const client = await signInAs(email);
      const created = await createLandingForUser(client, userId, {
        professionId,
        templateId,
        formData: VALID_FORM_DATA,
        desiredSlug: `contador-sections-${suffix}`,
      });
      assert(created.ok, `no se pudo crear la landing: ${JSON.stringify(created)}`);
      if (!created.ok) return;

      const reordered = await updateLandingSectionsConfig(
        client,
        userId,
        created.landing.id,
        [
          { id: "contact", visible: true, order: 1 },
          { id: "hero", visible: true, order: 2 },
          { id: "about", visible: false, order: 3 },
          { id: "services", visible: true, order: 4 },
        ]
      );
      assert(reordered.ok, `se esperaba éxito, se obtuvo ${JSON.stringify(reordered)}`);

      const withExtraSection = await updateLandingSectionsConfig(
        client,
        userId,
        created.landing.id,
        [
          { id: "contact", visible: true, order: 1 },
          { id: "hero", visible: true, order: 2 },
          { id: "about", visible: false, order: 3 },
          { id: "footer", visible: true, order: 4 },
        ]
      );
      assert(
        !withExtraSection.ok && withExtraSection.reason === "invalid_sections_config",
        `se esperaba invalid_sections_config al intentar agregar una sección nueva, se obtuvo ${JSON.stringify(withExtraSection)}`
      );

      const missingSection = await updateLandingSectionsConfig(
        client,
        userId,
        created.landing.id,
        [
          { id: "contact", visible: true, order: 1 },
          { id: "hero", visible: true, order: 2 },
          { id: "about", visible: false, order: 3 },
        ]
      );
      assert(
        !missingSection.ok && missingSection.reason === "invalid_sections_config",
        `se esperaba invalid_sections_config al intentar quitar una sección, se obtuvo ${JSON.stringify(missingSection)}`
      );

      const { data: row } = await admin
        .from("landings")
        .select("sections_config")
        .eq("id", created.landing.id)
        .single();
      const contactSection = (row?.sections_config as { id: string; order: number }[]).find(
        (s) => s.id === "contact"
      );
      assert(
        contactSection?.order === 1,
        "el reordenamiento válido debería haber persistido en la base"
      );
    } finally {
      await deleteTestUser(userId);
    }
  });

  await test("el status de la landing no se puede modificar desde este flujo", async () => {
    const email = `test-status-immutable-${suffix}@example.com`;
    const userId = await createTestUser(email);
    try {
      const client = await signInAs(email);
      const created = await createLandingForUser(client, userId, {
        professionId,
        templateId,
        formData: VALID_FORM_DATA,
        desiredSlug: `contador-status-${suffix}`,
      });
      assert(created.ok, `no se pudo crear la landing: ${JSON.stringify(created)}`);
      if (!created.ok) return;

      // updateLandingFormData never sends `status` in its update payload,
      // regardless of what's passed in -- confirm that holds even if a
      // caller tries to smuggle it in through the form_data object itself.
      await updateLandingFormData(client, userId, created.landing.id, {
        ...VALID_FORM_DATA,
        status: "active",
      });

      const { data: afterFormUpdate } = await admin
        .from("landings")
        .select("status")
        .eq("id", created.landing.id)
        .single();
      assert(
        afterFormUpdate?.status === "draft",
        "status no debería cambiar al editar form_data, incluso si se intenta incluirlo"
      );

      // Direct proof at the database layer: even a raw update issued by the
      // landing's own owner, through their own RLS-scoped session, is
      // rejected by the protect_landing_immutable_fields trigger unless it
      // runs as service_role (i.e. only the Mercado Pago webhook).
      const { error: rawUpdateError } = await client
        .from("landings")
        .update({ status: "active" })
        .eq("id", created.landing.id);
      assert(
        Boolean(rawUpdateError),
        "un update directo de status por el dueño de la landing debería fallar"
      );

      const { data: afterRawUpdate } = await admin
        .from("landings")
        .select("status")
        .eq("id", created.landing.id)
        .single();
      assert(
        afterRawUpdate?.status === "draft",
        "status no debería haber cambiado tras el intento de update directo"
      );
    } finally {
      await deleteTestUser(userId);
    }
  });

  report();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
