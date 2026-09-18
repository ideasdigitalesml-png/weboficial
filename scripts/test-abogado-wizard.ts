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

const FORM_DATA = {
  name: "Marina Beltrán",
  matricula_numero: "78901",
  matricula_colegio: "Colegio de Abogados de La Plata",
  phone: "+5492215551234",
  email: "marina@example.com",
  direccion: "Calle 7 1234",
  ciudad: "La Plata",
  provincia: "Buenos Aires",
  servicios: ["familia", "sucesiones"],
  descripcion_corta: "Bio de prueba para los templates de abogado.",
  universidad: "UNLP",
  año_graduacion: "2010",
  asociacion_profesional: "Colegio de Abogados de La Plata",
};

async function main() {
  const { test, report } = createRunner();

  const cases: { templateSlug: string; label: string; extraMarker: string }[] = [
    { templateSlug: "moderno", label: "Moderno", extraMarker: "#C9A84C" },
    { templateSlug: "clasico", label: "Clásico", extraMarker: "ac-footer-line" },
    { templateSlug: "minimal", label: "Minimal", extraMarker: "am-footer-disclaimer" },
  ];

  for (const { templateSlug, label, extraMarker } of cases) {
    const suffix = `${Date.now()}-${templateSlug}`;
    const email = `test-abogado-${suffix}@example.com`;
    const userId = await createTestUser(email);
    const slug = `abogado-${suffix}`;

    await test(`una landing de abogado con el template '${templateSlug}' publica y sirve el diseño ${label}`, async () => {
      const client = await signInAs(email);
      const { professionId, templateId } = await getSeedIdsForTemplateSlug(templateSlug, "abogados");

      const result = await createLandingForUser(client, userId, {
        professionId,
        templateId,
        formData: FORM_DATA,
        desiredSlug: slug,
      });

      assert(result.ok, `se esperaba éxito, se obtuvo ${JSON.stringify(result)}`);
      if (!result.ok) return;

      await admin.from("landings").update({ status: "active" }).eq("id", result.landing.id);

      const res = await getHtml("/", `${slug}.${ROOT_DOMAIN}`);
      assert(res.status === 200, `se esperaba 200 para ${slug}.${ROOT_DOMAIN}, se obtuvo ${res.status}`);

      assert(res.body.includes("Marina Beltrán"), "debe mostrar el nombre");
      assert(res.body.includes("Derecho de Familia"), "debe reflejar las áreas de práctica reales elegidas");
      assert(res.body.includes("Cómo trabajo"), "debe incluir la sección de proceso genérica");
      assert(res.body.includes("Escribime por WhatsApp"), "debe incluir el CTA de WhatsApp");
      assert(res.body.includes(`${slug}.weboficial.com.ar`), "el footer debe mostrar el subdominio real");
      assert(res.body.includes(extraMarker), `debe incluir la marca específica del template ${label}`);

      assert(!res.body.includes("Lo que dicen mis clientes"), "no debe fabricar una sección de testimonios");
      assert(!res.body.includes("Clientes atendidos"), "no debe fabricar estadísticas");
      assert(!res.body.includes("años de experiencia"), "no debe fabricar años de experiencia");
      assert(!res.body.includes("casos resueltos"), "no debe fabricar casos resueltos");
    });

    await deleteTestUser(userId);
  }

  report();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
