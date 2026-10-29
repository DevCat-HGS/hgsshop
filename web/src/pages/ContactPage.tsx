import { useDocumentHead } from "@/hooks/useDocumentHead";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "@/components/forms/ContactForm";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { site } from "@/config/site";

export function ContactPage() {
  useDocumentHead({
    title: "Contacto",
    description: `Escríbele a ${site.brand.name} para consultas sobre productos, colaboraciones o cualquier otra pregunta.`,
    path: "/contacto",
  });

  return (
    <Container className="grid grid-cols-1 gap-12 pb-16 pt-14 sm:pt-20 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <Eyebrow>Contacto</Eyebrow>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-text sm:text-5xl">Hablemos</h1>
        <p className="mt-4 text-base text-pretty text-text-muted">
          Para consultas generales, preguntas sobre un producto o propuestas de colaboración. Si ya tienes un proyecto
          en mente, la página de desarrollo a medida te pide los datos que necesito para cotizarlo.
        </p>

        <dl className="mt-8 flex flex-col gap-5">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-subtle">Correo</dt>
            <dd className="mt-1">
              <a href={`mailto:${site.contact.email}`} className="text-sm text-text hover:underline">
                {site.contact.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-subtle">Portafolio</dt>
            <dd className="mt-1">
              <a href={site.owner.portfolioUrl} target="_blank" rel="noreferrer" className="text-sm text-text hover:underline">
                {site.owner.portfolioUrl.replace("https://", "")}
              </a>
            </dd>
          </div>
        </dl>

        <Button to="/desarrollo-a-medida" variant="secondary" className="mt-8">
          Solicitar una cotización
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-surface/80 p-6 shadow-card backdrop-blur-sm sm:p-8">
        <ContactForm />
      </div>
    </Container>
  );
}

export default ContactPage;
