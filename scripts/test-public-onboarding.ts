import http from "node:http";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createLandingForUser } from "../src/lib/landings/create-landing";
import {
  SUPABASE_URL,
  ANON_KEY,
  getSeedIds,
  assert,
  createRunner,
} from "./test-helpers";

const DEV_SERVER_PORT = 3000;

function getStatus(pathname: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: DEV_SERVER_PORT, path: pathname, method: "GET" },
      (res) => {
        res.resume();
        res.on("end", () => resolve(res.statusCode ?? 0));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

// A bare, cookie-less anon client -- simulates a visitor who has never
// logged in, same as the registration-flow refactor assumes for the
// public wizard.
function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function main() {
  const { test, report } = createRunner();
  const suffix = Date.now();

  await test("/onboarding responde 200 sin cookies de sesión (ya no exige login)", async () => {
    const status = await getStatus("/onboarding");
    assert(status === 200, `se esperaba 200, se obtuvo ${status}`);
  });

  await test("catálogo público: professions/templates/stock_images son legibles sin sesión", async () => {
    const client = anonClient();
    const { professionId } = await getSeedIds();

    const { data: profession, error: professionError } = await client
      .from("professions")
      .select("id")
      .eq("id", professionId)
      .maybeSingle();
    assert(!professionError && !!profession, `professions debe ser legible sin sesión: ${JSON.stringify(professionError)}`);

    const { data: templates, error: templatesError } = await client
      .from("templates")
      .select("id")
      .eq("profession_id", professionId);
    assert(!templatesError && (templates?.length ?? 0) > 0, `templates debe ser legible sin sesión: ${JSON.stringify(templatesError)}`);

    const { data: stockImages, error: stockError } = await client
      .from("stock_images")
      .select("id")
      .eq("category", "perfil")
      .limit(1);
    assert(!stockError && (stockImages?.length ?? 0) > 0, `stock_images debe ser legible sin sesión: ${JSON.stringify(stockError)}`);
  });

  await test("chequeo de disponibilidad de slug funciona sin sesión (RPC pública)", async () => {
    const client = anonClient();
    const candidate = `disponible-anon-${suffix}`;
    const { data: taken, error } = await client.rpc("is_slug_taken", {
      candidate,
    });
    assert(!error, `is_slug_taken debe ser ejecutable sin sesión: ${JSON.stringify(error)}`);
    assert(taken === false, "un slug nuevo no debería figurar como tomado");
  });

  await test("crear una landing SIGUE exigiendo sesión (RLS), aunque el wizard sea público", async () => {
    const client = anonClient();
    const { professionId, templateId } = await getSeedIds();

    // Sin sesión, auth.uid() es null en Postgres. Puede fallar en más de un
    // punto sin sesión válida (lectura de `plans`, todavía solo
    // "authenticated"; o, si llegara al insert, el `with check (auth.uid()
    // = user_id ...)` de landings_insert_own) -- no importa cuál dispare
    // primero, lo que hay que confirmar es que ninguno permite que la
    // landing quede creada.
    let succeeded = false;
    try {
      const result = await createLandingForUser(
        client,
        "00000000-0000-0000-0000-000000000000",
        {
          professionId,
          templateId,
          formData: {
            name: "Anon Test",
            matricula: "999",
            jurisdiccion: "CPCE Test",
            phone: "+5491100000001",
            servicios: ["monotributo"],
          },
          desiredSlug: `anon-should-fail-${suffix}`,
        }
      );
      succeeded = result.ok;
    } catch {
      succeeded = false;
    }
    assert(!succeeded, "no debería poder crearse una landing sin sesión");
  });

  report();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
