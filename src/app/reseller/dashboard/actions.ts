"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RequestPayoutResult = { ok: true } | { ok: false; message: string };

// The heavy lifting (computing the amount from pending commissions,
// enforcing one pending request at a time, flipping those commissions to
// 'processing') all happens inside create_payout_request -- a SECURITY
// DEFINER RPC that resolves the reseller from auth.uid() itself, never a
// client-supplied id (see 0027_resellers.sql). This action is just the
// thin server-action wrapper Next requires plus friendlier error copy.
export async function requestPayoutAction(cbuAlias: string): Promise<RequestPayoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "No autenticado" };
  }

  const trimmed = cbuAlias.trim();
  if (!trimmed) {
    return { ok: false, message: "Ingresá tu CBU o alias" };
  }

  const { error } = await supabase.rpc("create_payout_request", {
    p_cbu_alias: trimmed,
  });

  if (error) {
    if (error.message.includes("already pending")) {
      return { ok: false, message: "Ya tenés una solicitud de pago pendiente." };
    }
    if (error.message.includes("no pending balance")) {
      return { ok: false, message: "No tenés saldo pendiente para cobrar." };
    }
    console.error("requestPayoutAction failed", error);
    return { ok: false, message: "No se pudo enviar la solicitud. Intentá de nuevo." };
  }

  revalidatePath("/reseller/dashboard");
  return { ok: true };
}
