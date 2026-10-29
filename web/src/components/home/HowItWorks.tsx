import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = [
  {
    title: "Descubre",
    description: "Filtra el catálogo por categoría o etapa y entiende qué problema resuelve cada producto.",
  },
  {
    title: "Prueba",
    description: "Si hay demo, la abres desde la ficha del producto: datos ficticios, aislada de todo dato real.",
  },
  {
    title: "Conversamos",
    description: "Me cuentas tu caso. Te digo con honestidad si el producto encaja o si conviene algo a medida.",
  },
  {
    title: "Contratas",
    description: "Acordamos modelo (compra, suscripción o a medida), alcance y plazos por escrito antes de empezar.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="04 · Proceso"
          title="De la primera visita a la solución contratada"
          description="Sin carritos ni pagos sorpresa: todo pasa por una conversación sobre tu caso."
        />

        <ol className="relative mt-14 grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-6">
          <div
            className="absolute left-4 top-4 h-[calc(100%-2rem)] w-px bg-gradient-to-b from-brand/60 via-border-strong to-transparent md:left-4 md:right-4 md:top-4 md:h-px md:w-auto md:bg-gradient-to-r"
            aria-hidden="true"
          />
          {steps.map((step, index) => (
            <li key={step.title} className="relative flex gap-5 md:flex-col md:gap-0">
              <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-bg font-mono text-xs font-medium text-brand">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="md:mt-6 md:pr-4">
                <h3 className="text-base font-semibold text-text">{step.title}</h3>
                <p className="mt-2 text-sm text-pretty text-text-muted">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
