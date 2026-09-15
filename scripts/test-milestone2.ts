import { createLandingForUser } from "../src/lib/landings/create-landing";
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

  await test("caso 1: slug duplicado se rechaza y sugiere alternativas", async () => {
    const emailA = `test-a-${suffix}@example.com`;
    const emailB = `test-b-${suffix}@example.com`;
    const userAId = await createTestUser(emailA);
    const userBId = await createTestUser(emailB);
    try {
      const clientA = await signInAs(emailA);
      const clientB = await signInAs(emailB);
      const slug = `contador-test-${suffix}`;

      const resultA = await createLandingForUser(clientA, userAId, {
        professionId,
        templateId,
        formData: VALID_FORM_DATA,
        desiredSlug: slug,
      });
      assert(
        resultA.ok,
        `se esperaba que la primera creación tuviera éxito: ${JSON.stringify(resultA)}`
      );

      const resultB = await createLandingForUser(clientB, userBId, {
        professionId,
        templateId,
        formData: VALID_FORM_DATA,
        desiredSlug: slug,
      });
      assert(
        !resultB.ok && resultB.reason === "slug_taken",
        `se esperaba slug_taken, se obtuvo ${JSON.stringify(resultB)}`
      );
      if (!resultB.ok && resultB.reason === "slug_taken") {
        assert(
          resultB.suggestions.length >= 2,
          "se esperaban al menos 2 sugerencias"
        );
        assert(
          resultB.suggestions.every((s) => s !== slug),
          "las sugerencias no deben ser iguales al slug ocupado"
        );
      }
    } finally {
      await deleteTestUser(userAId);
      await deleteTestUser(userBId);
    }
  });

  await test("caso 2: form_data inválido se rechaza server-side", async () => {
    const email = `test-invalid-${suffix}@example.com`;
    const userId = await createTestUser(email);
    try {
      const client = await signInAs(email);
      const result = await createLandingForUser(client, userId, {
        professionId,
        templateId,
        formData: { ...VALID_FORM_DATA, email: "no-es-un-email" },
        desiredSlug: `contador-invalido-${suffix}`,
      });
      assert(
        !result.ok && result.reason === "invalid_form_data",
        `se esperaba invalid_form_data, se obtuvo ${JSON.stringify(result)}`
      );
      if (!result.ok && result.reason === "invalid_form_data") {
        assert(Boolean(result.errors.email), "se esperaba un error en el campo email");
      }

      const { data: rows } = await admin
        .from("landings")
        .select("id")
        .eq("user_id", userId);
      assert(
        (rows?.length ?? 0) === 0,
        "no debería haberse insertado ninguna fila en landings"
      );
    } finally {
      await deleteTestUser(userId);
    }
  });

  await test("caso 3: creación completa queda en estado draft", async () => {
    const email = `test-success-${suffix}@example.com`;
    const userId = await createTestUser(email);
    try {
      const client = await signInAs(email);
      const slug = `contador-ok-${suffix}`;
      const result = await createLandingForUser(client, userId, {
        professionId,
        templateId,
        formData: VALID_FORM_DATA,
        desiredSlug: slug,
      });
      assert(result.ok, `se esperaba éxito, se obtuvo ${JSON.stringify(result)}`);

      const { data: row, error } = await admin
        .from("landings")
        .select("*")
        .eq("user_id", userId)
        .single();
      assert(!error && row, "no se pudo leer la landing creada");
      assert(row.status === "draft", "status debe ser 'draft' por default");
      assert(
        row.onboarding_status === "not_started",
        "onboarding_status debe ser 'not_started' por default"
      );
      assert(row.slug === slug, "el slug debe coincidir con el elegido");
      assert(
        row.internal_subdomain === slug,
        "internal_subdomain debe reflejar el slug"
      );
      assert(
        Array.isArray(row.sections_config) && row.sections_config.length === 4,
        "sections_config debe tener las 4 secciones por default"
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
