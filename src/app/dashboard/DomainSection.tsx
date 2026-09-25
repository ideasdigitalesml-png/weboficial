"use client";

import { useState } from "react";
import { saveRegistrantContactAction } from "./actions";
import type { DomainCheckResult } from "@/app/api/domains/check/route";

export interface ExistingCustomDomain {
  domain: string;
  status: "pending_payment" | "pending_registration" | "active" | "failed" | "expired";
  failureReason: string | null;
}

const STATUS_LABELS: Record<ExistingCustomDomain["status"], string> = {
  pending_payment: "Pago pendiente",
  pending_registration: "Registrando...",
  active: "Activo",
  failed: "Error",
  expired: "Vencido",
};

const STATUS_BADGE: Record<ExistingCustomDomain["status"], string> = {
  pending_payment: "bg-amber-100 text-amber-700",
  pending_registration: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  expired: "bg-red-100 text-red-700",
};

const INPUT_CLASS =
  "min-h-12 rounded-lg border border-border-subtle bg-white px-3 py-2 text-navy placeholder:text-text-body/50 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30";
const LABEL_CLASS = "text-sm font-medium text-navy";
const PRIMARY_BUTTON =
  "inline-flex min-h-[52px] items-center justify-center rounded-full bg-sky px-5 text-base font-semibold text-white transition-colors hover:bg-sky-dark disabled:opacity-40";
const SECONDARY_BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-border-subtle px-4 text-sm font-medium text-navy transition-colors hover:border-navy/40 disabled:opacity-40";

type ContactFormState = {
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  addressLine1: string;
  city: string;
  state: string;
  countryCode: string;
  zipcode: string;
};

const EMPTY_CONTACT: ContactFormState = {
  fullName: "",
  email: "",
  phoneCountryCode: "54",
  phoneNumber: "",
  addressLine1: "",
  city: "",
  state: "",
  countryCode: "AR",
  zipcode: "",
};

export function DomainSection({
  existingDomain,
  hasRegistrantContact,
}: {
  existingDomain: ExistingCustomDomain | null;
  hasRegistrantContact: boolean;
}) {
  const [query, setQuery] = useState("");
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<DomainCheckResult[] | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [pendingPurchaseDomain, setPendingPurchaseDomain] = useState<string | null>(null);
  const [contactKnown, setContactKnown] = useState(hasRegistrantContact);
  const [contact, setContact] = useState<ContactFormState>(EMPTY_CONTACT);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  if (existingDomain) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-navy">Mi dominio</h2>
        <div className="flex flex-col gap-3 rounded-xl border border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-navy">{existingDomain.domain}</span>
            {existingDomain.status === "failed" && existingDomain.failureReason && (
              <p className="text-xs text-red-600">
                {existingDomain.failureReason} — escribinos a ideasdigitalesml@gmail.com para
                resolverlo.
              </p>
            )}
            {existingDomain.status === "pending_registration" && (
              <p className="text-xs text-text-body">
                Registrando tu dominio y activando el DNS. Puede tardar unos minutos.
              </p>
            )}
          </div>
          <span
            className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[existingDomain.status]}`}
          >
            {STATUS_LABELS[existingDomain.status]}
          </span>
        </div>
      </section>
    );
  }

  async function handleCheck() {
    setChecking(true);
    setCheckError(null);
    setResults(null);
    try {
      const res = await fetch(`/api/domains/check?domain=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        setCheckError(data.error ?? "No se pudo verificar la disponibilidad.");
        return;
      }
      setResults(data.results);
    } catch {
      setCheckError("No se pudo verificar la disponibilidad. Intentá de nuevo.");
    } finally {
      setChecking(false);
    }
  }

  function handleWantToBuy(domain: string) {
    setPurchaseError(null);
    setPendingPurchaseDomain(domain);
  }

  async function handleSaveContactAndContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingPurchaseDomain) return;
    setPurchasing(true);
    setPurchaseError(null);

    const result = await saveRegistrantContactAction(contact);
    if (!result.ok) {
      setPurchasing(false);
      setPurchaseError("No se pudieron guardar tus datos de contacto. Revisá los campos.");
      return;
    }
    setContactKnown(true);
    await doPurchase(pendingPurchaseDomain);
  }

  async function doPurchase(domain: string) {
    setPurchasing(true);
    setPurchaseError(null);
    try {
      const res = await fetch("/api/domains/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!data.ok) {
        setPurchasing(false);
        setPurchaseError(
          data.reason === "domain_taken"
            ? "Ese dominio ya no está disponible."
            : "No se pudo iniciar la compra. Intentá de nuevo."
        );
        return;
      }
      window.location.assign(data.initPoint);
    } catch {
      setPurchasing(false);
      setPurchaseError("No se pudo iniciar la compra. Intentá de nuevo.");
    }
  }

  function handleBuyClick(domain: string) {
    if (contactKnown) {
      doPurchase(domain);
    } else {
      handleWantToBuy(domain);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-navy">Mi dominio</h2>
      <div className="flex flex-col gap-4 rounded-xl border border-border-subtle p-4">
        <p className="text-sm text-text-body">
          Comprá un dominio propio (ej: tuempresa.com) para tu página.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="tuempresa"
            className={`${INPUT_CLASS} flex-1`}
          />
          <button
            onClick={handleCheck}
            disabled={checking || query.trim().length === 0}
            className={SECONDARY_BUTTON}
          >
            {checking ? "Verificando..." : "Verificar disponibilidad"}
          </button>
        </div>

        {checkError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {checkError}
          </p>
        )}

        {results && (
          <div className="flex flex-col gap-2">
            {results.map((r) => (
              <div
                key={r.tld}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2"
              >
                <span className="text-sm font-medium text-navy">{r.domain}</span>
                {r.available ? (
                  r.priceArs !== null ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-navy">
                        ${r.priceArs.toLocaleString("es-AR")} ARS/año
                      </span>
                      <button
                        onClick={() => handleBuyClick(r.domain)}
                        disabled={purchasing}
                        className={SECONDARY_BUTTON}
                      >
                        Comprar
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-text-body">
                      {r.priceUnavailableReason ?? "Precio no disponible"}
                    </span>
                  )
                ) : (
                  <span className="text-xs text-text-body">No disponible</span>
                )}
              </div>
            ))}
          </div>
        )}

        {purchaseError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {purchaseError}
          </p>
        )}

        {pendingPurchaseDomain && !contactKnown && (
          <form onSubmit={handleSaveContactAndContinue} className="flex flex-col gap-3 border-t border-border-subtle pt-4">
            <p className="text-sm font-medium text-navy">
              Datos del titular del dominio (requeridos para el registro)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS}>Nombre completo</label>
                <input
                  required
                  value={contact.fullName}
                  onChange={(e) => setContact((c) => ({ ...c, fullName: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS}>Email</label>
                <input
                  required
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS}>Cód. país tel.</label>
                <input
                  required
                  value={contact.phoneCountryCode}
                  onChange={(e) => setContact((c) => ({ ...c, phoneCountryCode: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS}>Teléfono</label>
                <input
                  required
                  value={contact.phoneNumber}
                  onChange={(e) => setContact((c) => ({ ...c, phoneNumber: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={LABEL_CLASS}>Dirección</label>
                <input
                  required
                  value={contact.addressLine1}
                  onChange={(e) => setContact((c) => ({ ...c, addressLine1: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS}>Ciudad</label>
                <input
                  required
                  value={contact.city}
                  onChange={(e) => setContact((c) => ({ ...c, city: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS}>Provincia</label>
                <input
                  required
                  value={contact.state}
                  onChange={(e) => setContact((c) => ({ ...c, state: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS}>País (ISO2)</label>
                <input
                  required
                  maxLength={2}
                  value={contact.countryCode}
                  onChange={(e) => setContact((c) => ({ ...c, countryCode: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS}>Código postal</label>
                <input
                  required
                  value={contact.zipcode}
                  onChange={(e) => setContact((c) => ({ ...c, zipcode: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <button type="submit" disabled={purchasing} className={PRIMARY_BUTTON}>
              {purchasing ? "Procesando..." : "Continuar a pagar"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
