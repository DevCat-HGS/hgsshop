import type { ReactNode } from "react";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { Container } from "@/components/ui/Container";
import { site } from "@/config/site";

function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Container className="max-w-3xl py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-text">{title}</h1>
      <p className="mt-2 text-xs text-text-subtle">
        Borrador inicial: debe revisarse con asesoría legal según el país desde el que se opere antes del lanzamiento comercial.
      </p>
      <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-text-muted [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-text">
        {children}
      </div>
    </Container>
  );
}

export function PrivacyPage() {
  useDocumentHead({
    title: "Aviso de privacidad",
    description: `Qué datos recoge ${site.brand.name}, para qué y cómo puedes pedir que se eliminen.`,
    path: "/privacidad",
  });

  return (
    <LegalLayout title="Aviso de privacidad">
      <section>
        <h2>Responsable</h2>
        <p>
          {site.owner.name}, operando como {site.brand.name}. Contacto:{" "}
          <a href={`mailto:${site.contact.email}`} className="text-text underline">
            {site.contact.email}
          </a>
          .
        </p>
      </section>
      <section>
        <h2>Qué datos se recogen</h2>
        <p>
          Solo los que escribes en los formularios de contacto y de cotización: nombre, correo, empresa (opcional) y el
          contenido de tu mensaje o solicitud. La plataforma no usa cookies de seguimiento ni analítica de terceros en
          este momento.
        </p>
      </section>
      <section>
        <h2>Para qué se usan</h2>
        <p>Exclusivamente para responder a tu mensaje o preparar la propuesta que solicitaste. No se venden ni se ceden a terceros con fines comerciales.</p>
      </section>
      <section>
        <h2>Dónde se almacenan</h2>
        <p>
          Los envíos se reciben a través de Netlify Forms (Netlify, Inc.), el proveedor que aloja esta web, y se
          conservan mientras dure la conversación comercial o hasta que pidas su eliminación.
        </p>
      </section>
      <section>
        <h2>Tus derechos</h2>
        <p>Puedes pedir acceso, corrección o eliminación de tus datos escribiendo al correo de contacto.</p>
      </section>
    </LegalLayout>
  );
}

export function TermsPage() {
  useDocumentHead({
    title: "Términos del servicio",
    description: `Condiciones de uso del catálogo y de las demos de ${site.brand.name}.`,
    path: "/terminos",
  });

  return (
    <LegalLayout title="Términos del servicio">
      <section>
        <h2>Sobre el catálogo</h2>
        <p>
          Cada producto indica su estado (disponible, en desarrollo, prototipo o bajo cotización). La información de un
          producto no disponible describe su estado actual y no constituye una oferta de venta.
        </p>
      </section>
      <section>
        <h2>Sobre las demos</h2>
        <p>
          Las demos usan datos ficticios, están aisladas de cualquier dato real y pueden reiniciarse o cambiar sin
          aviso. No introduzcas información personal o sensible en ellas.
        </p>
      </section>
      <section>
        <h2>Cotizaciones y contratación</h2>
        <p>
          Enviar una solicitud no genera ningún compromiso ni cobro. Precios, plazos y alcance se acuerdan por escrito
          en una propuesta específica antes de iniciar cualquier trabajo. La plataforma no procesa pagos en este momento.
        </p>
      </section>
    </LegalLayout>
  );
}
