import { createLandingForUser } from "../src/lib/landings/create-landing";
import { fetchAdminList, fetchProfessionalDetail } from "../src/lib/admin/queries";
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

  // NOTE on scope: profiles.role = 'admin' is the sole source of truth for
  // admin access, enforced by RLS (see migrations/0006_admin_panel.sql),
  // and requireAdmin() just redirects at the page level on top of that
  // already-safe foundation. These tests exercise the RLS/data layer
  // directly -- the guarantee the milestone calls out as authoritative --
  // rather than trying to replicate an authenticated browser session over
  // raw HTTP to also assert the page-level redirect.

  await test("un usuario sin role='admin' solo ve sus propios datos, nunca los de otros", async () => {
    const emailA = `test-admin-scope-a-${suffix}@example.com`;
    const emailB = `test-admin-scope-b-${suffix}@example.com`;
    const userAId = await createTestUser(emailA);
    const userBId = await createTestUser(emailB);
    try {
      const clientA = await signInAs(emailA);
      const clientB = await signInAs(emailB);

      const createdA = await createLandingForUser(clientA, userAId, {
        professionId,
        templateId,
        formData: VALID_FORM_DATA,
        desiredSlug: `contador-scope-a-${suffix}`,
      });
      const createdB = await createLandingForUser(clientB, userBId, {
        professionId,
        templateId,
        formData: VALID_FORM_DATA,
        desiredSlug: `contador-scope-b-${suffix}`,
      });
      assert(createdA.ok, `no se pudo crear la landing de A: ${JSON.stringify(createdA)}`);
      assert(createdB.ok, `no se pudo crear la landing de B: ${JSON.stringify(createdB)}`);
      if (!createdA.ok || !createdB.ok) return;

      // A queries the exact same unfiltered `landings` select the admin
      // list page uses. RLS should scope it down to A's own row only.
      const { professionals } = await fetchAdminList(clientA);
      const ids = professionals.map((p) => p.landingId);
      assert(
        ids.includes(createdA.landing.id),
        "A debería ver su propia landing"
      );
      assert(
        !ids.includes(createdB.landing.id),
        "A NO debería ver la landing de B sin ser admin"
      );

      // Same for the detail query: A asking for B's landingId directly.
      const detailOfB = await fetchProfessionalDetail(clientA, createdB.landing.id);
      assert(
        detailOfB === null,
        "A no debería poder leer el detalle de la landing de B sin ser admin"
      );
    } finally {
      await deleteTestUser(userAId);
      await deleteTestUser(userBId);
    }
  });

  await test("un admin ve el listado y el detalle de todos los profesionales", async () => {
    const emailAdmin = `test-admin-real-${suffix}@example.com`;
    const emailUser = `test-admin-observed-${suffix}@example.com`;
    const adminId = await createTestUser(emailAdmin);
    const userId = await createTestUser(emailUser);
    try {
      // Promote via the service-role client, exactly like the direct DB
      // change the human operator did -- never through a user-facing API.
      const { error: promoteError } = await admin
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", adminId);
      assert(!promoteError, `no se pudo promover a admin: ${promoteError?.message}`);

      const adminClient = await signInAs(emailAdmin);
      const userClient = await signInAs(emailUser);

      const created = await createLandingForUser(userClient, userId, {
        professionId,
        templateId,
        formData: VALID_FORM_DATA,
        desiredSlug: `contador-observed-${suffix}`,
      });
      assert(created.ok, `no se pudo crear la landing: ${JSON.stringify(created)}`);
      if (!created.ok) return;

      const { professionals } = await fetchAdminList(adminClient);
      assert(
        professionals.some((p) => p.landingId === created.landing.id),
        "el admin debería ver la landing de otro usuario en el listado"
      );

      const detail = await fetchProfessionalDetail(adminClient, created.landing.id);
      assert(detail !== null, "el admin debería poder ver el detalle de la landing");
      assert(
        detail?.ownerEmail === emailUser,
        "el detalle debería incluir el email real del dueño de la landing"
      );
    } finally {
      await deleteTestUser(adminId);
      await deleteTestUser(userId);
    }
  });

  await test("un usuario no puede auto-asignarse role='admin'", async () => {
    const email = `test-role-immutable-${suffix}@example.com`;
    const userId = await createTestUser(email);
    try {
      const client = await signInAs(email);

      const { error } = await client
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId);
      assert(
        Boolean(error),
        "un update de role hecho por el propio usuario debería fallar"
      );

      const { data: row } = await admin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      assert(
        row?.role === "user",
        "role no debería haber cambiado tras el intento de auto-promoción"
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
