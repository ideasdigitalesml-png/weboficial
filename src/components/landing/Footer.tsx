import { Wordmark } from "./Wordmark";

const CONTACT_EMAIL = "ideasdigitalesml@gmail.com";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy px-6 py-10 text-white/90">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <Wordmark tone="white" className="text-lg" />
        <div className="flex flex-col gap-1 text-sm sm:items-end">
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-white/90 hover:text-white">
            📧 {CONTACT_EMAIL}
          </a>
          <p className="text-white/80">© {year} weboficial</p>
        </div>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-5xl flex-col items-center gap-2 border-t border-white/15 pt-6 text-center">
        <p className="text-xs text-white/70">
          <a href="/terminos" className="hover:text-white">
            Términos y Condiciones
          </a>
          {" · "}
          <a href="/privacidad" className="hover:text-white">
            Política de Privacidad
          </a>
          {" · "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">
            Contacto: {CONTACT_EMAIL}
          </a>
        </p>
        <p className="text-[11px] text-white/60">
          En caso de reclamos podés contactar a Defensa del Consumidor:{" "}
          <a
            href="https://www.argentina.gob.ar/defensadelconsumidor"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-white/80"
          >
            argentina.gob.ar/defensadelconsumidor
          </a>
        </p>
      </div>
    </footer>
  );
}
