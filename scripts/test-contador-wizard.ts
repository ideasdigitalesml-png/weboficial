import http from "node:http";
import { createLandingForUser } from "../src/lib/landings/create-landing";
import { getSuggestedContadorText } from "../src/lib/professions/contadores";
import { formatListWithAnd } from "../src/lib/format-list";
import {
  admin,
  createTestUser,
  deleteTestUser,
  signInAs,
  getSeedIds,
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
  const email = `test-contador-wizard-${suffix}@example.com`;
  const userId = await createTestUser(email);

  await test("formatListWithAnd usa 'y' antes del último elemento", async () => {
    assert(
      formatListWithAnd(["Monotributo", "IVA", "Balances"]) ===
        "Monotributo, IVA y Balances",
      "el separador final debe ser 'y', no una coma"
    );
  });

  await test("el texto sugerido incluye nombre, matrícula, jurisdicción y servicios formateados", async () => {
    const text = getSuggestedContadorText({
      nombre: "Ana Gómez",
      matricula: "998877",
      jurisdiccion: "CPCE CABA",
      servicios: ["monotributo", "iva", "balances"],
    });
    assert(text.includes("Ana Gómez"), "debe incluir el nombre");
    assert(text.includes("998877"), "debe incluir la matrícula");
    assert(text.includes("CPCE CABA"), "debe incluir la jurisdicción");
    assert(
      text.includes("Monotributo, IVA y Balances y estados contables"),
      `los servicios deben venir formateados con 'y', texto real: ${text}`
    );
  });

  await test("form_data inválido (whatsapp sin +, servicios vacíos) se rechaza", async () => {
    const client = await signInAs(email);
    const { professionId, templateId } = await getSeedIds();

    const result = await createLandingForUser(client, userId, {
      professionId,
      templateId,
      formData: {
        name: "Ana Gómez",
        matricula: "998877",
        jurisdiccion: "CPCE CABA",
        phone: "011 15-2233-4455", // not normalized -- the wizard's
        // buildWhatsappValue does that client-side, the server only
        // accepts the already-normalized E.164 form.
        servicios: [],
      },
      desiredSlug: `contador-wizard-invalid-${suffix}`,
    });

    assert(!result.ok && result.reason === "invalid_form_data", `se esperaba invalid_form_data, se obtuvo ${JSON.stringify(result)}`);
    if (!result.ok && result.reason === "invalid_form_data") {
      assert(!!result.errors.phone, "un whatsapp no normalizado debe fallar la validación");
      assert(!!result.errors.servicios, "servicios vacío debe fallar (mínimo 1)");
    }
  });

  await test("form_data válido con matricula/jurisdiccion/whatsapp/servicios se acepta y persiste", async () => {
    const client = await signInAs(email);
    const { professionId, templateId } = await getSeedIds();
    const slug = `contador-wizard-${suffix}`;

    const result = await createLandingForUser(client, userId, {
      professionId,
      templateId,
      formData: {
        name: "Ana Gómez",
        matricula: "998877",
        jurisdiccion: "CPCE CABA",
        phone: "+5491122334455",
        zona: "CABA",
        modalidad: "ambos",
        servicios: ["monotributo", "iva", "balances"],
        description:
          "Soy Ana Gómez, Contador Público matriculado (matrícula 998877, CPCE CABA). Me especializo en Monotributo, IVA y Balances y estados contables. Te ayudo a ordenar tus impuestos y tu contabilidad sin vueltas ni complicaciones, con respuestas claras y a tiempo.",
      },
      desiredSlug: slug,
    });

    assert(result.ok, `se esperaba éxito, se obtuvo ${JSON.stringify(result)}`);
    if (!result.ok) return;

    const { data: row } = await admin
      .from("landings")
      .select("form_data")
      .eq("id", result.landing.id)
      .single();
    assert(
      JSON.stringify(row?.form_data.servicios) === JSON.stringify(["monotributo", "iva", "balances"]),
      "servicios debe persistir como array en form_data"
    );
    assert(row?.form_data.phone === "+5491122334455", "phone debe persistir normalizado");

    await admin.from("landings").update({ status: "active" }).eq("id", result.landing.id);

    const res = await getHtml("/", `${slug}.${ROOT_DOMAIN}`);
    assert(res.status === 200, `se esperaba 200 para ${slug}.${ROOT_DOMAIN}, se obtuvo ${res.status}`);
    assert(res.body.includes("Ana G"), "la landing pública debe mostrar el nombre");
    assert(res.body.includes("998877"), "la landing pública debe mostrar la matrícula");
    assert(res.body.includes("CPCE CABA"), "la landing pública debe mostrar la jurisdicción");
    assert(res.body.includes("Contactar por WhatsApp"), "debe tener el CTA de WhatsApp");
    assert(
      res.body.includes("#0F7A5C"),
      "debe usar el acento emerald aprobado para la plantilla Clásico"
    );
    assert(res.body.includes("wa.me/5491122334455"), "el link de WhatsApp debe usar wa.me con el número normalizado");
    assert(res.body.includes("Monotributo"), "debe mostrar el chip de servicio Monotributo");
    assert(res.body.includes("Balances y estados contables"), "debe mostrar el chip de servicio Balances");
  });

  await deleteTestUser(userId);
  report();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
