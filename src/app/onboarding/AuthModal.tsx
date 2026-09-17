"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

// Shown when an anonymous visitor clicks "Publicar mi página". This is an
// overlay, not a redirect -- the actual Google sign-in still involves a
// real navigation away and back (inherent to OAuth, there's no avoiding
// it), but nothing here does that until the visitor explicitly opts in by
// clicking the button. The draft they filled out survives that round trip
// in sessionStorage (see draft-storage.ts) and /onboarding/publishing
// picks up right where this left off.
export function AuthModal({
  onClose,
  nextPath,
}: {
  onClose: () => void;
  nextPath: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setIsPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (error) {
      setError("No se pudo iniciar el login. Intentá de nuevo.");
      setIsPending(false);
    }
    // No error: the browser is already navigating to Google, nothing left
    // to do here.
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="auth-modal-title" className="text-lg font-semibold text-navy">
          Ya casi está lista tu página
        </h2>
        <p className="mt-2 text-sm text-text-body">
          Iniciá sesión con Google para publicarla y pasar al pago. Tus datos
          ya quedaron guardados, no vas a tener que completarlos de nuevo.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isPending}
            className={PRIMARY_BUTTON}
          >
            {isPending ? "Redirigiendo..." : "Continuar con Google"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className={SECONDARY_BUTTON}
          >
            Seguir editando
          </button>
        </div>
      </div>
    </div>
  );
}
