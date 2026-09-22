import { buildWaLink } from "@/lib/whatsapp";

// Shared fixed WhatsApp button for every premium template. Always visible
// on mobile viewports (where a sticky nav CTA is usually hidden for space);
// desktopVisible controls whether it also stays on screen at wider widths,
// since some templates already surface a WhatsApp CTA in their nav/hero and
// don't need a second one competing for attention.
export function FloatingWhatsappButton({
  phone,
  accentColor,
  iconColor = "#FFFFFF",
  desktopVisible = true,
}: {
  phone?: string;
  accentColor: string;
  iconColor?: string;
  desktopVisible?: boolean;
}) {
  const waLink = phone ? buildWaLink(phone) : null;
  if (!waLink) return null;

  return (
    <a
      href={waLink}
      target="_blank"
      rel="noopener"
      aria-label="Contactar por WhatsApp"
      className={desktopVisible ? "" : "wo-wa-float-mobile-only"}
      style={{
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: 60,
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: accentColor,
        color: iconColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 24px rgba(0,0,0,.18)",
        transition: "transform .18s ease",
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="26" height="26">
        <path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.5-4.2A8 8 0 1 1 20 11.5Z" />
        <path d="M8.5 9.7c.3 2.6 2.2 4.5 4.8 4.8.6.1 1-.4.9-1l-.2-.9a.6.6 0 0 0-.5-.4l-1.2-.2a.6.6 0 0 1-.4-.3l-.6-1a.6.6 0 0 1 0-.6l.4-.9a.6.6 0 0 0-.1-.6l-.7-.9a.6.6 0 0 0-.7-.2c-.9.3-1.8 1-1.7 2.2Z" />
      </svg>
      {!desktopVisible && (
        <style>{`@media (min-width: 861px){ .wo-wa-float-mobile-only{ display: none !important; } }`}</style>
      )}
    </a>
  );
}
