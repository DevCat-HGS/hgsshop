import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { ArrowRightIcon } from "@/components/icons";

const examples = ["Portal de clientes", "Integración con tu ERP", "Bot de reportes", "App para tu equipo de campo"];

export function CustomDevCta() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-brand/25 bg-surface/70 px-8 py-14 text-center backdrop-blur-sm sm:px-16">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-x-0 -bottom-40 mx-auto h-72 w-3/4 rounded-full bg-brand/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center">
            <Eyebrow>05 · A medida</Eyebrow>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-balance text-text sm:text-5xl">
              ¿Ninguno encaja? Lo construimos para tu caso
            </h2>
            <p className="mt-5 text-base text-pretty text-text-muted sm:text-lg">
              Aplicaciones, automatizaciones e integraciones a partir de tu problema real. Primero entiendo el alcance;
              después hablamos de precio y fechas.
            </p>
            <ul className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Ejemplos de proyectos">
              {examples.map((example) => (
                <li key={example} className="rounded-full border border-border-strong bg-bg/60 px-3 py-1 font-mono text-xs text-text-muted">
                  {example}
                </li>
              ))}
            </ul>
            <Button to="/desarrollo-a-medida" size="lg" className="mt-10">
              Contar mi proyecto
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
