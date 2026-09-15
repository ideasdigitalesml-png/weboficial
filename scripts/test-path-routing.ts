// Covers the temporary /<slug> path-based access to a landing (an
// alternative to subdomain routing while the project doesn't have Vercel
// Pro's wildcard subdomain support). Requires the dev server running on
// DEV_SERVER_PORT, same as test-milestone3/4.
import { createLandingForUser } from "../src/lib/landings/create-landing";
import { isValidSlugFormat } from "../src/lib/landings/slug";
import {
  createTestUser,
  deleteTestUser,
  signInAs,
  getSeedIds,
  VALID_FORM_DATA,
  assert,
  createRunner,
} from "./test-helpers";

const DEV_SERVER_PORT = 3000;
const BASE_URL = `http://127.0.0.1:${DEV_SERVER_PORT}`;

async function main() {
  const { test, report } = createRunner();
  const { professionId, templateId } = await getSeedIds();
  const suffix = Date.now();

  await test("una landing se sirve por /<slug> en la ruta raíz", async () => {
    const email = `test-path-route-${suffix}@example.com`;
    const userId = await createTestUser(email);
    try {
      const client = await signInAs(email);
      const slug = `contador-path-${suffix}`;
      const created = await createLandingForUser(client, userId, {
        professionId,
        templateId,
        formData: VALID_FORM_DATA,
        desiredSlug: slug,
      });
      assert(created.ok, `no se pudo crear la landing: ${JSON.stringify(created)}`);
      if (!created.ok) return;

      const res = await fetch(`${BASE_URL}/${slug}`);
      assert(res.status === 200, `se esperaba 200, se obtuvo ${res.status}`);
      const body = await res.text();
      assert(
        body.includes(VALID_FORM_DATA.name),
        "la ruta /<slug> debe mostrar el nombre del form_data"
      );
    } finally {
      await deleteTestUser(userId);
    }
  });

  await test("las rutas reservadas nunca se tratan como slug de landing", async () => {
    // Real internal routes must keep resolving to themselves, not to a
    // phantom "landing" -- /dashboard is auth-gated, so an unauthenticated
    // request should redirect to /login rather than ever rendering as 200.
    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
    assert(
      res.status >= 300 && res.status < 400,
      `se esperaba un redirect (3xx) para /dashboard sin sesión, se obtuvo ${res.status}`
    );
    const location = res.headers.get("location") ?? "";
    assert(
      location.includes("/login"),
      `se esperaba redirect a /login, se obtuvo Location: ${location}`
    );
  });

  await test("las palabras reservadas nunca son un slug válido para crear una landing", async () => {
    for (const reserved of ["dashboard", "login", "onboarding", "auth", "api", "site"]) {
      assert(
        !isValidSlugFormat(reserved),
        `'${reserved}' no debería ser un slug válido (colisiona con una ruta interna)`
      );
    }
  });

  report();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
