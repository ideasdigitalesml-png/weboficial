import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | weboficial",
  description:
    "Política de Privacidad de weboficial.com.ar: qué datos recopilamos, para qué los usamos y cómo ejercer tus derechos.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-full bg-white px-6 py-16 sm:py-20">
      <div className="mx-auto flex w-full max-w-3xl flex-col">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">
          Política de Privacidad — weboficial.com.ar
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Última actualización: septiembre de 2026
        </p>

        <Section title="1. Responsable del tratamiento de datos">
          <p>
            El responsable del tratamiento de los datos personales
            recopilados a través de weboficial.com.ar es{" "}
            <strong>weboficial</strong> (en adelante &quot;weboficial&quot;,
            &quot;nosotros&quot; o &quot;nos&quot;), contactable en{" "}
            <a href="mailto:ideasdigitalesml@gmail.com" className="underline">
              ideasdigitalesml@gmail.com
            </a>
            .
          </p>
          <p>
            Esta Política de Privacidad está redactada en cumplimiento de la{" "}
            <strong>
              Ley N.° 25.326 de Protección de los Datos Personales
            </strong>{" "}
            de la República Argentina y sus normas reglamentarias.
          </p>
        </Section>

        <Section title="2. Qué datos recopilamos">
          <h3 className="text-base font-semibold text-navy">
            2.1 Datos que vos nos proporcionás
          </h3>
          <p>Al crear tu página profesional, recopilamos:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Datos de identidad:</strong> nombre completo, número y
              colegio de matrícula profesional
            </li>
            <li>
              <strong>Datos de contacto:</strong> teléfono, WhatsApp, email
              profesional, dirección, ciudad, provincia
            </li>
            <li>
              <strong>Datos profesionales:</strong> especialidad, servicios
              ofrecidos, descripción, universidad, año de graduación
            </li>
            <li>
              <strong>Imagen de perfil:</strong> foto que subís voluntariamente
            </li>
            <li>
              <strong>URL elegida (slug):</strong> el identificador de tu
              página en weboficial.com.ar
            </li>
          </ul>

          <h3 className="mt-2 text-base font-semibold text-navy">
            2.2 Datos generados automáticamente
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Datos de cuenta:</strong> email y nombre de tu cuenta de
              Google (obtenidos al iniciar sesión con Google OAuth)
            </li>
            <li>
              <strong>Datos de uso:</strong> fecha de alta, fecha de última
              edición, estado de la suscripción
            </li>
            <li>
              <strong>Datos técnicos:</strong> dirección IP, tipo de
              navegador y dispositivo, cookies de sesión
            </li>
          </ul>

          <h3 className="mt-2 text-base font-semibold text-navy">
            2.3 Datos de pago
          </h3>
          <p>
            Los pagos se procesan exclusivamente a través de{" "}
            <strong>Mercado Pago</strong>. weboficial{" "}
            <strong>no almacena</strong> datos de tarjetas, cuentas bancarias
            ni credenciales de pago. Mercado Pago actúa como procesador de
            pagos independiente; su tratamiento de datos está regido por su
            propia política de privacidad disponible en{" "}
            <a
              href="https://www.mercadopago.com.ar"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              mercadopago.com.ar
            </a>
            .
          </p>
        </Section>

        <Section title="3. Para qué usamos tus datos">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="py-2 pr-4 font-semibold text-navy">Finalidad</th>
                  <th className="py-2 font-semibold text-navy">Base legal</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border-subtle">
                  <td className="py-2 pr-4">Crear y publicar tu página profesional</td>
                  <td className="py-2">Ejecución del contrato</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="py-2 pr-4">Gestionar tu cuenta y suscripción</td>
                  <td className="py-2">Ejecución del contrato</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="py-2 pr-4">
                    Enviarte notificaciones sobre tu cuenta (estado del pago,
                    cambios en el servicio)
                  </td>
                  <td className="py-2">Ejecución del contrato / interés legítimo</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="py-2 pr-4">Mostrarte tu página publicada a visitantes</td>
                  <td className="py-2">Ejecución del contrato</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="py-2 pr-4">Mejorar el Servicio mediante análisis de uso agregado</td>
                  <td className="py-2">Interés legítimo</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Cumplir con obligaciones legales</td>
                  <td className="py-2">Obligación legal</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong>
              No usamos tus datos para publicidad de terceros ni los vendemos
              a nadie.
            </strong>
          </p>
        </Section>

        <Section title="4. Quién tiene acceso a tus datos">
          <p>Tus datos personales son accesibles únicamente por:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>El equipo de weboficial</strong>, en la medida
              necesaria para operar el Servicio
            </li>
            <li>
              <strong>Supabase</strong> (base de datos en la nube): almacena
              tu información de forma segura con cifrado en reposo. Más
              información en{" "}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                supabase.com/privacy
              </a>
            </li>
            <li>
              <strong>Vercel</strong> (infraestructura de hosting): aloja la
              plataforma. Más información en{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                vercel.com/legal/privacy-policy
              </a>
            </li>
            <li>
              <strong>Mercado Pago</strong> (procesador de pagos): recibe los
              datos necesarios para gestionar la suscripción
            </li>
            <li>
              <strong>Google</strong> (autenticación): gestiona el inicio de
              sesión. Más información en{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                policies.google.com/privacy
              </a>
            </li>
          </ul>
          <p>
            No compartimos tus datos con ningún otro tercero, salvo
            requerimiento legal expreso de autoridad competente.
          </p>
        </Section>

        <Section title="5. Tu página pública">
          <p>
            La información que cargás en tu página (nombre, matrícula,
            servicios, foto, datos de contacto) es{" "}
            <strong>pública por naturaleza</strong>: cualquier visitante de
            internet puede verla en{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-sm">
              tunombre.weboficial.com.ar
            </code>
            . Eso es el propósito del Servicio. Si querés modificar o
            eliminar esa información, podés hacerlo desde tu panel en
            cualquier momento.
          </p>
        </Section>

        <Section title="6. Cookies y tecnologías de seguimiento">
          <p>
            Utilizamos cookies necesarias para el funcionamiento del Servicio
            (sesión de usuario, autenticación).
          </p>
          <p>
            Podemos incorporar en el futuro herramientas de analítica (Google
            Analytics) y seguimiento publicitario (Meta Pixel) para medir el
            desempeño del sitio y mejorar las campañas. Cuando lo hagamos,
            actualizaremos esta Política e informaremos a los usuarios.
          </p>
          <p>
            Podés configurar tu navegador para rechazar cookies, aunque esto
            puede afectar la experiencia de uso de la plataforma.
          </p>
        </Section>

        <Section title="7. Retención de datos">
          <p>
            Conservamos tus datos mientras tu cuenta esté activa. Si cancelás
            la suscripción:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Tu página se da de baja al finalizar el período abonado</li>
            <li>
              Tus datos se conservan por hasta <strong>12 meses</strong>{" "}
              adicionales por razones de seguridad y obligaciones legales
            </li>
            <li>
              Podés solicitar la eliminación anticipada de tus datos
              enviando un email a{" "}
              <a
                href="mailto:ideasdigitalesml@gmail.com"
                className="underline"
              >
                ideasdigitalesml@gmail.com
              </a>
            </li>
          </ul>
        </Section>

        <Section title="8. Tus derechos (Ley 25.326)">
          <p>
            En cumplimiento de la Ley N.° 25.326, tenés derecho a:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Acceder</strong> a los datos personales que
              conservamos sobre vos
            </li>
            <li>
              <strong>Rectificar</strong> datos incorrectos o desactualizados
            </li>
            <li>
              <strong>Suprimir</strong> tus datos cuando ya no sean
              necesarios para la finalidad para la que fueron recopilados
            </li>
            <li>
              <strong>Oponerte</strong> al tratamiento de tus datos en
              ciertos supuestos
            </li>
            <li>
              <strong>Portabilidad</strong> de tus datos (a pedido, te
              enviamos la información que tenemos en formato legible)
            </li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos, envianos un email a{" "}
            <a href="mailto:ideasdigitalesml@gmail.com" className="underline">
              <strong>ideasdigitalesml@gmail.com</strong>
            </a>{" "}
            con el asunto &quot;Derechos sobre mis datos&quot; y tu nombre
            completo y email de cuenta. Responderemos en un plazo máximo de 5
            días hábiles.
          </p>
        </Section>

        <Section title="9. Seguridad">
          <p>
            Implementamos medidas técnicas y organizativas razonables para
            proteger tus datos:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Comunicaciones cifradas mediante HTTPS/TLS</li>
            <li>
              Base de datos protegida con Row Level Security (cada usuario
              solo accede a sus propios datos)
            </li>
            <li>Autenticación gestionada por Google (no almacenamos contraseñas)</li>
            <li>
              Acceso restringido al equipo de weboficial según principio de
              mínimo privilegio
            </li>
          </ul>
          <p>
            Ningún sistema es 100% seguro. En caso de detectar una brecha de
            seguridad que afecte tus datos, te notificaremos en un plazo
            razonable.
          </p>
        </Section>

        <Section title="10. Menores de edad">
          <p>
            El Servicio está dirigido exclusivamente a personas mayores de
            18 años con actividad profesional. No recopilamos
            intencionalmente datos de menores de edad.
          </p>
        </Section>

        <Section title="11. Cambios a esta Política">
          <p>
            Podemos actualizar esta Política en cualquier momento. Los
            cambios sustanciales se notificarán por email. La versión
            vigente siempre estará disponible en weboficial.com.ar/privacidad.
          </p>
        </Section>

        <Section title="12. Contacto" last>
          <p>Para consultas sobre privacidad y datos personales:</p>
          <p>
            📧{" "}
            <a href="mailto:ideasdigitalesml@gmail.com" className="underline">
              <strong>ideasdigitalesml@gmail.com</strong>
            </a>
          </p>
          <p>
            La <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>{" "}
            es el organismo de control en Argentina para el cumplimiento de
            la Ley 25.326. Podés realizar consultas y denuncias en{" "}
            <a
              href="https://www.argentina.gob.ar/aaip"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              www.argentina.gob.ar/aaip
            </a>
            .
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
