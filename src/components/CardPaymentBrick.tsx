"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
}: {
  landingId: string;
  amount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
  const initedRef = useRef(false);

  useEffect(() => {
    if (mpInitialized || !publicKey || initedRef.current) return;
    initedRef.current = true;
    mpInitialized = true;
    initMercadoPago(publicKey, { locale: "es-AR" });
  }, [publicKey]);

  if (!publicKey) {
    return (
      <p className="text-sm text-red-600">
        Falta configurar NEXT_PUBLIC_MP_PUBLIC_KEY.
      </p>
    );
  }

  async function handleSubmit(formData: CardPaymentBrickFormData) {
    const payerEmail = formData.payer?.email;
    if (!formData.token || !payerEmail) {
      setError("Faltan datos de la tarjeta. Revisá el formulario e intentá de nuevo.");
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      const result = await createAuthorizedSubscriptionAction(
        landingId,
        formData.token,
        payerEmail
      );
      if (!result.ok) {
        setError(result.message);
        setIsProcessing(false);
        return;
      }
      // Mercado Pago notifies our webhook (subscription_preapproval) within
      // moments of the preapproval being created -- this page already knows
      // how to wait for that and redirect once the landing goes active.
      router.push("/dashboard/processing");
    } catch (err) {
      console.error("CardPaymentBrick submit failed", err);
      setError("No se pudo procesar el pago. Intentá de nuevo.");
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <CardPayment
        initialization={{ amount }}
        onSubmit={handleSubmit}
        onError={(brickError) => {
          console.error("CardPaymentBrick error", brickError);
          setError("Ocurrió un error con el formulario de pago. Revisá los datos de tu tarjeta.");
        }}
      />
      {isProcessing && (
        <p className="text-sm text-text-body">Procesando tu pago...</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
