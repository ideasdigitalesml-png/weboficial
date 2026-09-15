import http from "node:http";
import { createLandingForUser } from "../src/lib/landings/create-landing";
import { extractSubdomain } from "../src/lib/tenancy/subdomain";
import {
  ROOT_DOMAIN,
  createTestUser,
  deleteTestUser,
  signInAs,
  getSeedIds,
  VALID_FORM_DATA,
  assert,
  createRunner,
} from "./test-helpers";

const DEV_SERVER_PORT = 3000;

// Plain http.request (not fetch) because the Fetch API spec forbids
// scripts from setting a custom "Host" header, and we need exactly that to
// simulate a tenant subdomain hitting the proxy without any real DNS/hosts
// file setup.
function requestWithHost(
  hostHeader: string,
  pathname = "/"
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: DEV_SERVER_PORT,
        path: pathname,
        method: "GET",
        headers: { Host: hostHeader },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  const { test, report } = createRunner();
  const { professionId, templateId } = await getSeedIds();
  const suffix = Date.now();

  await test("host reservado ('app') nunca se trata como landing de un tenant", async () => {
    assert(
      extractSubdomain(`app.${ROOT_DOMAIN}`, ROOT_DOMAIN) === null,
      "app.<root> debería resolver a null (host reservado)"
    );
    assert(
      extractSubdomain("app.lvh.me:3000", ROOT_DOMAIN) === null,
      "app.lvh.me debería resolver a null (host reservado)"
    );
    assert(
      extractSubdomain(`www.${ROOT_DOMAIN}`, ROOT_DOMAIN) === null,
      "www.<root> debe tratarse como dominio raíz, no como landing"
    );
    assert(
      extractSubdomain(ROOT_DOMAIN, ROOT_DOMAIN) === null,
      "el dominio raíz sin subdominio no debe reescribirse"
    );
    assert(
      extractSubdomain("localhost", ROOT_DOMAIN) === null,
      "localhost sin subdominio no debe reescribirse"
    );
    assert(
      extractSubdomain(`nicolasferrario.${ROOT_DOMAIN}`, ROOT_DOMAIN) ===
        "nicolasferrario",
      "un subdominio de tenant real debe extraerse correctamente"
    );
  });

  await test("una landing visible se sirve públicamente sin login", async () => {
    const email = `test-public-${suffix}@example.com`;
    const userId = await createTestUser(email);
    try {
      const client = await signInAs(email);
      const slug = `contador-public-${suffix}`;
      const result = await createLandingForUser(client, userId, {
        professionId,
        templateId,
        formData: VALID_FORM_DATA,
        desiredSlug: slug,
      });
      assert(
        result.ok,
        `no se pudo crear la landing de prueba: ${JSON.stringify(result)}`
      );

      const res = await requestWithHost(`${slug}.${ROOT_DOMAIN}`);

      assert(res.status === 200, `se esperaba 200, se obtuvo ${res.status}`);
      assert(
        res.body.includes(VALID_FORM_DATA.name),
        "la landing pública debe mostrar el nombre del form_data"
      );
    } finally {
      await deleteTestUser(userId);
    }
  });

  await test("un slug inexistente muestra 'no disponible' (404) sin dar pistas", async () => {
    const res = await requestWithHost(`no-existe-${suffix}.${ROOT_DOMAIN}`);
    assert(res.status === 404, `se esperaba 404, se obtuvo ${res.status}`);
  });

  report();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
