import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const i = line.indexOf("=");
    if (i === -1) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
export const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const ROOT_DOMAIN = env.NEXT_PUBLIC_ROOT_DOMAIN;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

export const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_PASSWORD = "Test1234!";

export async function createTestUser(email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("no user created");
  return data.user.id;
}

export async function deleteTestUser(userId: string): Promise<void> {
  await admin.from("landings").delete().eq("user_id", userId);
  await admin.auth.admin.deleteUser(userId);
}

export async function signInAs(email: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });
  if (error) throw error;
  return client;
}

export async function getSeedIds(): Promise<{
  professionId: string;
  templateId: string;
}> {
  const { data: profession, error: professionError } = await admin
    .from("professions")
    .select("id")
    .eq("slug", "contadores")
    .single();
  if (professionError || !profession) {
    throw new Error(
      "No se encontró la profesión seed 'contadores'. ¿Corriste 0003_seed.sql?"
    );
  }

  const { data: templates, error: templatesError } = await admin
    .from("templates")
    .select("id")
    .eq("profession_id", profession.id)
    .limit(1);
  if (templatesError || !templates || templates.length === 0) {
    throw new Error("No se encontraron templates seed para 'contadores'.");
  }

  return {
    professionId: profession.id as string,
    templateId: templates[0].id as string,
  };
}

export const VALID_FORM_DATA = {
  name: "Juan Pérez",
  matricula: "12345",
  jurisdiccion: "CPCE Buenos Aires",
  description: "Más de 10 años de experiencia asesorando pymes.",
  phone: "+5491155555555",
  email: "juan@example.com",
  profile_image: "https://i.pravatar.cc/300?img=11",
  servicios: ["monotributo", "iva"],
};

export function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

export function createRunner() {
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
      console.log(`  ok - ${name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL - ${name}`);
      console.error(err);
      failed++;
    }
  }

  function report(): void {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }

  return { test, report };
}
