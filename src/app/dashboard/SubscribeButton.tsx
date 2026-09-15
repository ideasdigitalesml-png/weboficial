"use client";

import { useActionState } from "react";
import { createSubscriptionAction } from "./actions";

type ActionState = { ok: true } | { ok: false; message: string };

const initialState: ActionState = { ok: true };

export function SubscribeButton() {
  const [state, formAction, isPending] = useActionState<ActionState>(
    () => createSubscriptionAction(),
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-40"
      >
        {isPending ? "Redirigiendo..." : "Pagar y activar mi landing"}
      </button>
      {!state.ok && <p className="text-sm text-red-600">{state.message}</p>}
    </form>
  );
}
