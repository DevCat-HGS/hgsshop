import { useDocumentHead } from "@/hooks/useDocumentHead";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "@/components/forms/ContactForm";
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
        <h1 className="font-display text-[length:var(--text-step-head)] text-text">Hablemos</h1>
        <p className="mt-5 text-lg text-pretty text-text">
          Para consultas generales, preguntas sobre un producto o propuestas de colaboración. Si ya tienes un proyecto
          en mente, la página de desarrollo a medida te pide los datos que necesito para cotizarlo.
        </p>

        <dl className="mt-8 flex flex-col gap-5">
          <div>
            <dt className="text-[15px] font-semibold text-text-muted">Correo</dt>
            <dd className="mt-1">
              <a href={`mailto:${site.contact.email}`} className="text-sm text-text hover:underline">
                {site.contact.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-[15px] font-semibold text-text-muted">Portafolio</dt>
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

      <div className="rounded-sm bg-surface p-6 sm:p-8">
        <ContactForm />
      </div>
    </Container>
  );
}

export default ContactPage;
