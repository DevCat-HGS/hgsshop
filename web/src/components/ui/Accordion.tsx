import { useId, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

export interface AccordionItemData {
  question: string;
  answer: string;
}

/** Preguntas en una columna: superficies separadas por tono, sin bordes. Para fichas y páginas interiores. */
export function Accordion({ items }: { items: AccordionItemData[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="flex flex-col gap-1">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div key={item.question} className={`rounded-sm transition-colors duration-200 ${isOpen ? "bg-surface-hover" : "bg-surface"}`}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 rounded-sm px-5 py-4 text-left text-base font-semibold text-text"
              >
                {item.question}
                <ChevronDownIcon
                  className={`size-4 shrink-0 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </h3>
            {isOpen && (
              <div id={panelId} role="region" aria-labelledby={buttonId} className="px-5 pb-5 text-base leading-relaxed text-pretty text-text">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
