import { Wordmark } from "./Wordmark";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy px-6 py-10 text-white/70">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <Wordmark tone="white" className="text-lg" />
        <div className="flex flex-col gap-1 text-sm sm:items-end">
          <p>[WhatsApp/contacto a definir]</p>
          <p>© {year} weboficial</p>
        </div>
      </div>
    </footer>
  );
}
