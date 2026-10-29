import { useId, useState } from "react";
import { generalFaqs } from "@/data/faqs";
import { Container } from "@/components/ui/Container";
import { Slide } from "@/components/home/Slide";

/**
 * S8 · Preguntas. "Índice de preguntas, una respuesta": a la izquierda todas las preguntas; a la
 * derecha, la respuesta seleccionada en grande y fija mientras se recorre la lista. La selección sigue
 * al puntero, al clic y al foco del teclado. En móvil la respuesta se abre bajo su pregunta.
 */
export function Preguntas() {
  const [selected, setSelected] = useState(0);
  const baseId = useId();
  const answerId = `${baseId}-respuesta`;

  return (
    <Slide id="preguntas" tone="paper" labelledBy="preguntas-titulo">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div data-reveal className="lg:col-span-5">
          <h2 id="preguntas-titulo" className="font-display text-[length:var(--text-step-head)] text-text">
            Preguntas frecuentes
          </h2>
          <ul className="mt-10 flex flex-col gap-2">
            {generalFaqs.map((faq, index) => {
              const isSelected = index === selected;
              return (
                <li key={faq.question}>
                  <button
                    type="button"
                    aria-expanded={isSelected}
                    aria-controls={answerId}
                    onClick={() => setSelected(index)}
                    onMouseEnter={() => setSelected(index)}
                    onFocus={() => setSelected(index)}
                    className={`press flex w-full items-start gap-4 rounded-sm py-2.5 text-left text-lg transition-colors duration-150 ${
                      isSelected ? "font-semibold text-text" : "text-text-muted hover:text-text"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-2.5 size-2 shrink-0 rounded-full transition-colors duration-150 ${isSelected ? "bg-brand" : "bg-text-subtle"}`}
                    />
                    {faq.question}
                  </button>
                  {isSelected && <p className="pb-4 pl-6 text-[19px] leading-relaxed text-pretty text-text lg:hidden">{faq.answer}</p>}
                </li>
              );
            })}
          </ul>
        </div>

        <div data-reveal className="hidden lg:col-span-6 lg:col-start-7 lg:block">
          <p
            id={answerId}
            key={selected}
            aria-live="polite"
            className="animate-[fade-in_150ms_var(--ease-out)] sticky top-32 max-w-[30ch] text-[clamp(1.5rem,1.9vw,1.75rem)] leading-[1.3] text-pretty text-text"
          >
            {generalFaqs[selected].answer}
          </p>
        </div>
      </Container>
    </Slide>
  );
}
