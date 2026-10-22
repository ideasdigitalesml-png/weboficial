"use client";

import { SECONDARY_BUTTON } from "./styles";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

// Shown when an anonymous visitor clicks "Publicar mi página". This is an
// overlay, not a redirect -- the actual Google sign-in still involves
// leaving this component's own render tree either way (a hard navigation
// to redirectTo on success, or a popup/FedCM prompt for the GIS flow), but
// nothing here does that until the visitor explicitly opts in via
// GoogleSignInButton. The draft they filled out survives in sessionStorage
// (see draft-storage.ts) and /onboarding/publishing (GoogleSignInButton's
// redirectTo target, see the wizards) picks up right where this left off.
export function AuthModal({
  onClose,
  nextPath,
}: {
  onClose: () => void;
  nextPath: string;
}) {
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
          Ingresá con Google para guardar tu página. Tus datos ya quedaron
          guardados, no vas a tener que completarlos de nuevo.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <GoogleSignInButton redirectTo={nextPath} oneTap />
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
            Seguir editando
          </button>
        </div>
      </div>
    </div>
  );
}
