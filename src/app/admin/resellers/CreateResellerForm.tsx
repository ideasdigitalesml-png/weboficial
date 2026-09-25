"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createResellerAction } from "./actions";

// Strips accents/punctuation down to the kind of short, all-caps slug the
// spec asks for (e.g. "Juan Pérez" -> "JUANPEREZ") -- just a starting
// suggestion, the admin can edit it freely before submitting.
function suggestReferralCode(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 16);
}

export function CreateResellerForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [codeEditedByHand, setCodeEditedByHand] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!codeEditedByHand) {
      setReferralCode(suggestReferralCode(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const result = await createResellerAction({ email, name, whatsapp, referralCode });

    setIsPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setEmail("");
    setName("");
    setWhatsapp("");
    setReferralCode("");
    setCodeEditedByHand(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
      <h2 className="text-sm font-semibold">Crear revendedor</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Email (Gmail)
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.145]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="rounded border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.145]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          WhatsApp
          <input
            type="text"
            required
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+5491122334455"
            className="rounded border border-black/[.08] px-3 py-2 text-sm dark:border-white/[.145]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Referral code
          <input
            type="text"
            required
            value={referralCode}
            onChange={(e) => {
              setCodeEditedByHand(true);
              setReferralCode(e.target.value.toUpperCase());
            }}
            className="rounded border border-black/[.08] px-3 py-2 text-sm uppercase dark:border-white/[.145]"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Creando..." : "Crear revendedor"}
      </button>
    </form>
  );
}
