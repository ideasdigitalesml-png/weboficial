"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import { createAuthorizedSubscriptionAction } from "@/app/dashboard/actions";

// The SDK's own onSubmit formData type (ICardPaymentFormData) isn't
// re-exported from the package root, so this is a minimal structural type
// covering only what's used here -- token + payer.email. Everything else
// the Brick's formData carries (installments, payment_method_id, issuer_id)
// is a Checkout API concept for one-off payments; a subscription
// preapproval doesn't take them (see createAuthorizedPreapproval in
// mercadopago/client.ts).
interface CardPaymentBrickFormData {
  token?: string;
  payer?: {
    email?: string;
  };
}

let mpInitialized = false;

export function CardPaymentBrick({
  landingId,
  amount,
  payerEmail,
}: {
  landingId: string;
  amount: number;
  payerEmail: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // Mercado Pago's own antifraude review flagged our earlier checkout for
  // "datos del pagador incompletos" -- security.js sets the device session
  // id it uses to fingerprint the browser, and per MP's own guidance it has
  // to be present and executed before the Brick initializes, not just
  // loaded in parallel with it. Gating render on this (rather than firing
  // both at once) is what actually guarantees the ordering.
  const [securityScriptReady, setSecurityScriptReady] = useState(false);
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

  if (!publicKey) {
    return (
      <p className="text-sm text-red-600">
        Falta configurar NEXT_PUBLIC_MP_PUBLIC_KEY.
      </p>
    );
  }

  if (!mpInitialized && securityScriptReady) {
    mpInitialized = true;
    initMercadoPago(publicKey, { locale: "es-AR" });
  }

  async function handleSubmit(formData: CardPaymentBrickFormData) {
    const submittedEmail = formData.payer?.email || payerEmail;
    if (!formData.token || !submittedEmail) {
      setError("Faltan datos de la tarjeta. Revisá el formulario e intentá de nuevo.");
      throw new Error("Faltan datos de la tarjeta");
    }
    setError(null);
    setIsProcessing(true);
    try {
      const result = await createAuthorizedSubscriptionAction(
        landingId,
        formData.token,
        submittedEmail
      );
      if (!result.ok) {
        setError(result.message);
        // Reject (not just return) so the Brick's own submit button resets
        // instead of staying disabled as if the payment had gone through --
        // this is what lets the customer correct the card and try again
        // without a page reload, while still only ever having one submit
        // in flight at a time.
        throw new Error(result.message);
      }
      // Mercado Pago notifies our webhook (subscription_preapproval) within
      // moments of the preapproval being created -- this page already knows
      // how to wait for that and redirect once the landing goes active.
      // The "source=brick" flag only changes the copy shown there (a first
      // charge on this flow can take up to ~1h per Mercado Pago's own docs
      // for authorized-payment subscriptions), not the polling logic.
      router.push("/dashboard/processing?source=brick");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Script
        src="https://www.mercadopago.com/v2/security.js"
        strategy="afterInteractive"
        onLoad={() => setSecurityScriptReady(true)}
        onError={() => {
          // Don't hard-block checkout over a fingerprinting script failing
          // to load (ad blockers, flaky network) -- worst case the
          // antifraude has slightly less signal, same as before this change.
          console.error("Failed to load Mercado Pago security.js");
          setSecurityScriptReady(true);
        }}
        // `view` isn't a next/script prop -- it's Mercado Pago's own
        // documented attribute on this exact script tag, passed through via
        // spread since ScriptProps doesn't declare it.
        {...{ view: "checkout" }}
      />
      {securityScriptReady ? (
        <CardPayment
          initialization={{
            amount,
            payer: {
              email: payerEmail,
              identification: { type: "DNI", number: "" },
            },
          }}
          onSubmit={handleSubmit}
          onError={(brickError) => {
            console.error("CardPaymentBrick error", brickError);
            setError("Ocurrió un error con el formulario de pago. Revisá los datos de tu tarjeta.");
          }}
        />
      ) : (
        <p className="text-sm text-text-body">Cargando formulario de pago...</p>
      )}
      {isProcessing && (
        <p className="text-sm text-text-body">Procesando tu pago...</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
