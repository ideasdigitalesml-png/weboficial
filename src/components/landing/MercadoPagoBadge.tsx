// A generic credit-card icon doesn't read as "Mercado Pago" and undercuts
// the trust signal this line exists for. We don't have rights to reproduce
// their actual logo mark (the hand icon) as a hand-built SVG, so instead
// this names the brand outright in their own brand blue -- the same
// nominative-fair-use pattern as any "accepted payment methods" badge.
export function MercadoPagoBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f7ff] px-3 py-1 text-base font-bold text-[#009ee3]">
      Mercado Pago
    </span>
  );
}
