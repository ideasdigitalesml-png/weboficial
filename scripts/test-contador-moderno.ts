import http from "node:http";
import { createLandingForUser } from "../src/lib/landings/create-landing";
import {
  admin,
  createTestUser,
  deleteTestUser,
  signInAs,
  getSeedIdsForTemplateSlug,
  assert,
  createRunner,
  ROOT_DOMAIN,
} from "./test-helpers";

const DEV_SERVER_PORT = 3000;

function getHtml(pathname: string, hostHeader: string): Promise<{ status: number; body: string }> {
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
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  const { test, report } = createRunner();
  const suffix = Date.now();
  const email = `test-contador-moderno-${suffix}@example.com`;
  const userId = await createTestUser(email);
  const slug = `contador-moderno-${suffix}`;

  await test("una landing con el template 'moderno' publica y sirve el diseño nuevo", async () => {
    const client = await signInAs(email);
    const { professionId, templateId } = await getSeedIdsForTemplateSlug("moderno");

    const result = await createLandingForUser(client, userId, {
      professionId,
      templateId,
      formData: {
        name: "Laura Sosa",
        matricula: "445566",
        jurisdiccion: "CPCE Santa Fe",
        phone: "+5493415551234",
        email: "laura@example.com",
        zona: "Rosario",
        modalidad: "remoto",
        servicios: ["monotributo", "balances", "asesoramiento_impositivo"],
        description: "Bio de prueba para el template moderno.",
      },
      desiredSlug: slug,
    });

    assert(result.ok, `se esperaba éxito, se obtuvo ${JSON.stringify(result)}`);
    if (!result.ok) return;

    await admin.from("landings").update({ status: "active" }).eq("id", result.landing.id);

    const res = await getHtml("/", `${slug}.${ROOT_DOMAIN}`);
    assert(res.status === 200, `se esperaba 200 para ${slug}.${ROOT_DOMAIN}, se obtuvo ${res.status}`);

    // Marcas exclusivas del diseño Moderno (no existen en Clásico).
    assert(res.body.includes("Laura Sosa"), "debe mostrar el nombre");
    assert(res.body.includes("Escribime por WhatsApp"), "debe tener el copy del CTA nuevo");
    assert(res.body.includes("Cómo trabajamos juntos"), "debe incluir la sección de proceso");
    assert(res.body.includes("Contacto inicial"), "debe incluir el paso 1 del proceso");
    assert(res.body.includes(`${slug}.weboficial.com.ar`), "el footer debe mostrar el subdominio real");
    assert(res.body.includes("#0B2545"), "debe usar el navy del template Moderno");
    assert(res.body.includes("#1A6B4A"), "debe usar el verde del template Moderno");
    assert(res.body.includes("Especialista en"), "debe incluir la trust bar");
    assert(res.body.includes("Balances y estados contables"), "la trust bar/servicios deben reflejar los servicios reales elegidos");
    assert(!res.body.includes("Lo que dicen mis clientes"), "no debe fabricar una sección de testimonios");
    assert(!res.body.includes("Clientes atendidos"), "no debe fabricar estadísticas");

    // No debe reusar el copy fijo del template Clásico ("Contador Público matriculado").
    assert(
      !res.body.includes("Contador Público matriculado"),
      "no debe mostrar el copy de perfil del template Clásico"
    );
  });

  await deleteTestUser(userId);
  report();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
