import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones | weboficial",
  description:
    "Términos y Condiciones de uso del servicio weboficial.com.ar: plan, precio, pagos, cancelación y derechos del usuario.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-full bg-white px-6 py-16 sm:py-20">
      <div className="mx-auto flex w-full max-w-3xl flex-col">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">
          Términos y Condiciones de Uso — weboficial.com.ar
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Última actualización: septiembre de 2026
        </p>

        <Section title="1. Partes y aceptación">
          <p>
            Estos Términos y Condiciones (&quot;Términos&quot;) regulan el
            acceso y uso del servicio <strong>weboficial</strong> (&quot;el
            Servicio&quot;), operado por weboficial.com.ar
            (&quot;weboficial&quot;, &quot;nosotros&quot;, &quot;nos&quot;).
          </p>
          <p>
            Al crear una cuenta, completar el proceso de alta o abonar una
            suscripción, el usuario (&quot;Usuario&quot;, &quot;vos&quot;)
            acepta estos Términos en su totalidad. Si no estás de acuerdo con
            alguno de los puntos, no podés usar el Servicio.
          </p>
        </Section>

        <Section title="2. Descripción del Servicio">
          <p>
            weboficial es una plataforma digital que permite a profesionales
            independientes crear y publicar páginas web de presentación
            profesional. El Servicio incluye:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Acceso al asistente guiado de creación de páginas (wizard)</li>
            <li>
              Publicación de tu página en una URL del tipo{" "}
              <code className="rounded bg-surface-muted px-1.5 py-0.5 text-sm">
                tunombre.weboficial.com.ar
              </code>
            </li>
            <li>Alojamiento (hosting) de la página mientras la suscripción esté activa</li>
            <li>Acceso al panel de control para editar tu información en cualquier momento</li>
            <li>Selector de diseño y paleta de colores</li>
          </ul>
          <p>
            <strong>Importante:</strong> la URL provista es un subdominio de
            weboficial.com.ar (
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-sm">
              tunombre.weboficial.com.ar
            </code>
            ). El Servicio <strong>no incluye</strong> un dominio propio
            (&quot;.com.ar&quot;, &quot;.com&quot;, etc.).
          </p>
        </Section>

        <Section title="3. Condiciones de acceso">
          <p>Para usar el Servicio debés:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Ser mayor de 18 años o actuar con autorización de tu representante legal</li>
            <li>Ser profesional independiente o representante de un estudio o consultora</li>
            <li>Contar con una cuenta de Google activa (el acceso se realiza exclusivamente vía Google)</li>
            <li>Abonar el plan mensual vigente a través de Mercado Pago</li>
          </ul>
        </Section>

        <Section title="4. Plan y precio">
          <p>
            El Servicio se ofrece bajo un único plan mensual con las
            siguientes condiciones:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="py-2 pr-4 font-semibold text-navy">Concepto</th>
                  <th className="py-2 font-semibold text-navy">Detalle</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border-subtle">
                  <td className="py-2 pr-4">Precio</td>
                  <td className="py-2">$13.400 ARS por mes</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="py-2 pr-4">Facturación</td>
                  <td className="py-2">Mensual, en forma automática</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="py-2 pr-4">Medio de pago</td>
                  <td className="py-2">Mercado Pago (preaprobación / débito automático)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Renovación</td>
                  <td className="py-2">Automática al vencimiento de cada período</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Los precios pueden actualizarse. Te notificaremos con al menos 15
            días de anticipación antes de aplicar un cambio de precio. Si no
            cancelás antes de la nueva fecha de facturación, se entiende que
            aceptás el nuevo precio.
          </p>
        </Section>

        <Section title="5. Pago y facturación">
          <p>
            El cobro se realiza a través de Mercado Pago mediante el sistema
            de preaprobación (suscripción recurrente). Al completar el alta,
            autorizás el débito automático mensual.
          </p>
          <p>
            Si Mercado Pago rechaza un pago, te notificaremos por email.
            Disponés de hasta <strong>7 días corridos</strong> para
            regularizar el pago antes de que tu página sea suspendida
            temporalmente. Si el pago no se regulariza en ese plazo, la
            página se dará de baja.
          </p>
          <p>
            La emisión de comprobantes fiscales está sujeta a la situación
            impositiva de weboficial y se informará en el momento del alta o
            por email.
          </p>
        </Section>

        <Section title="6. Cancelación por parte del Usuario">
          <p>
            Podés cancelar tu suscripción en cualquier momento desde tu panel
            de control, sin expresar motivo y sin penalidades.
          </p>
          <p>
            <strong>Efectos de la cancelación:</strong>
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>El cobro se interrumpe a partir del siguiente ciclo de facturación.</li>
            <li>
              Tu página permanece <strong>activa hasta el último día del
              período ya abonado</strong>.
            </li>
            <li>Transcurrido ese período, la página se da de baja y deja de estar disponible públicamente.</li>
            <li>Podés volver a activar el Servicio en cualquier momento con una nueva suscripción.</li>
          </ul>
        </Section>

        <Section title="7. Derecho de arrepentimiento (Ley 24.240)">
          <p>
            En cumplimiento de la Ley de Defensa del Consumidor N.° 24.240 y
            sus modificatorias, el Usuario tiene derecho a revocar la
            aceptación del Servicio dentro de los{" "}
            <strong>10 (diez) días corridos</strong> desde la contratación,
            sin costo ni penalidad, siempre que el Servicio no haya sido
            utilizado en forma efectiva (es decir, que la página no haya sido
            activada y publicada).
          </p>
          <p>
            Para ejercer este derecho, enviá un email a{" "}
            <a href="mailto:ideasdigitalesml@gmail.com" className="underline">
              ideasdigitalesml@gmail.com
            </a>{" "}
            con el asunto &quot;Arrepentimiento&quot; indicando tu nombre y
            email de cuenta. Gestionaremos la baja y, si el cobro ya se
            realizó, coordinaremos el reintegro con Mercado Pago.
          </p>
        </Section>

        <Section title="8. Cancelación por parte de weboficial">
          <p>Nos reservamos el derecho de suspender o cancelar tu cuenta si:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Se verifican usos fraudulentos o violaciones a estos Términos</li>
            <li>La información de tu perfil profesional es manifiestamente falsa</li>
            <li>No se regulariza un pago vencido en el plazo indicado en la cláusula 5</li>
          </ul>
          <p>
            En casos de suspensión por incumplimiento, no corresponde
            reintegro por el período no consumido.
          </p>
        </Section>

        <Section title="9. Contenido y datos del Usuario">
          <p>
            Sos el único responsable de la información que cargás en tu
            página (nombre, matrícula, servicios, fotografía, descripción,
            datos de contacto). Garantizás que:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>La información es verídica y no vulnera derechos de terceros</li>
            <li>Tenés los derechos sobre las imágenes que subís</li>
            <li>No se incluye contenido ilegal, difamatorio ni engañoso</li>
          </ul>
          <p>
            weboficial no verifica ni valida la información ingresada,
            incluyendo matrículas o habilitaciones profesionales.
          </p>
        </Section>

        <Section title="10. Propiedad intelectual">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Tu contenido:</strong> el contenido que cargás (textos,
              fotos, datos) es tuyo. Al usar el Servicio, otorgás a
              weboficial una licencia no exclusiva para alojar, mostrar y
              reproducir ese contenido exclusivamente a los fines de prestar
              el Servicio.
            </li>
            <li>
              <strong>La plataforma:</strong> el software, diseño, código,
              plantillas y marca &quot;weboficial&quot; son propiedad
              exclusiva de weboficial.com.ar. No podés copiarlos,
              reproducirlos ni usarlos fuera del Servicio.
            </li>
          </ul>
        </Section>

        <Section title="11. Limitación de responsabilidad">
          <p>weboficial no se responsabiliza por:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Interrupciones del Servicio por causas ajenas a nuestra voluntad (fallas de infraestructura, fuerza mayor, etc.)</li>
            <li>Pérdida de clientes, oportunidades comerciales o ingresos derivados de un corte del Servicio</li>
            <li>Errores u omisiones en la información cargada por el Usuario</li>
            <li>Fallas en Mercado Pago como plataforma de pago (las disputas de cobro se gestionan directamente con Mercado Pago)</li>
          </ul>
          <p>
            En ningún caso nuestra responsabilidad total superará el
            equivalente a los últimos 3 (tres) meses de suscripción abonados
            por el Usuario.
          </p>
        </Section>

        <Section title="12. Modificaciones al Servicio y a estos Términos">
          <p>
            Podemos modificar el Servicio (funcionalidades, diseño,
            plantillas disponibles) o estos Términos en cualquier momento.
            Los cambios sustanciales se notificarán por email con al menos 15
            días de anticipación. El uso continuado del Servicio luego de la
            vigencia de los cambios implica la aceptación de los nuevos
            términos.
          </p>
        </Section>

        <Section title="13. Defensa del Consumidor">
          <p>
            En cumplimiento con la normativa argentina, informamos que podés
            realizar consultas y denuncias ante la{" "}
            <strong>Dirección Nacional de Defensa del Consumidor</strong> a
            través del sitio{" "}
            <a
              href="https://www.argentina.gob.ar/defensadelconsumidor"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              www.argentina.gob.ar/defensadelconsumidor
            </a>
            .
          </p>
        </Section>

        <Section title="14. Ley aplicable y jurisdicción">
          <p>
            Estos Términos se rigen por las leyes de la{" "}
            <strong>República Argentina</strong>. Cualquier conflicto que no
            pueda resolverse amigablemente será sometido a la jurisdicción de
            los <strong>Tribunales Ordinarios de la Ciudad Autónoma de
            Buenos Aires</strong>, con renuncia expresa a cualquier otro
            fuero o jurisdicción.
          </p>
        </Section>

        <Section title="15. Contacto" last>
          <p>Para cualquier consulta sobre estos Términos:</p>
          <p>
            📧{" "}
            <a href="mailto:ideasdigitalesml@gmail.com" className="underline">
              ideasdigitalesml@gmail.com
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  last = false,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section
      className={`flex flex-col gap-3 pt-8 text-base leading-relaxed text-slate-700 ${
        last ? "" : "border-b border-border-subtle pb-8"
      }`}
    >
      <h2 className="text-xl font-semibold text-navy">{title}</h2>
      {children}
    </section>
  );
}
