import { Container } from "@/components/ui/Container";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { generalFaqs } from "@/data/faqs";

export function HomeFaq() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <Eyebrow>06 · Preguntas</Eyebrow>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-4xl">Preguntas frecuentes</h2>
          <p className="mt-4 text-base text-text-muted">¿No está tu pregunta? Escríbeme y te respondo directamente.</p>
          <Button to="/contacto" variant="secondary" className="mt-6">
            Hacer una pregunta
          </Button>
        </div>
        <Accordion items={generalFaqs} />
      </Container>
    </section>
  );
}
