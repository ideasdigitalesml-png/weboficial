"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { ROOT_DOMAIN } from "@/lib/root-domain";

export type CreateResellerResult = { ok: true } | { ok: false; message: string };

export async function createResellerAction(input: {
  email: string;
  name: string;
  whatsapp: string;
  referralCode: string;
}): Promise<CreateResellerResult> {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error } = await supabase.rpc("admin_create_reseller", {
    p_email: input.email.trim(),
    p_name: input.name.trim(),
    p_whatsapp: input.whatsapp.trim(),
    p_referral_code: input.referralCode.trim(),
  });

  if (error) {
    if (error.message.includes("no_account_for_email")) {
      return {
        ok: false,
        message: `Este email no tiene cuenta registrada. El revendedor debe crear una cuenta en ${ROOT_DOMAIN} primero.`,
      };
    }
    if (error.message.includes("resellers_referral_code_key")) {
      return { ok: false, message: "Ese código de referido ya está en uso." };
    }
    if (error.message.includes("resellers_user_id_key")) {
      return { ok: false, message: "Ese usuario ya es revendedor." };
    }
    console.error("createResellerAction failed", error);
    return { ok: false, message: "No se pudo crear el revendedor." };
  }

  revalidatePath("/admin/resellers");
  return { ok: true };
}

export async function setResellerStatusAction(
  resellerId: string,
  status: "active" | "inactive"
): Promise<void> {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error } = await supabase.rpc("admin_set_reseller_status", {
    p_reseller_id: resellerId,
    p_status: status,
  });
  if (error) {
    console.error("setResellerStatusAction failed", error);
    throw error;
  }

  revalidatePath("/admin/resellers");
}

export async function approvePayoutAction(payoutRequestId: string): Promise<void> {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error } = await supabase.rpc("approve_payout", {
    p_payout_request_id: payoutRequestId,
  });
  if (error) {
    console.error("approvePayoutAction failed", error);
    throw error;
  }

  revalidatePath("/admin/resellers");
}
