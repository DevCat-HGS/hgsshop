import { useId, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

export interface AccordionItemData {
  question: string;
  answer: string;
}

export function Accordion({ items }: { items: AccordionItemData[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div
            key={item.question}
            className={`rounded-xl border backdrop-blur-sm transition-colors duration-200 ${
              isOpen ? "border-border-strong bg-surface/80" : "border-border bg-surface/40 hover:bg-surface/70"
            }`}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left text-[15px] font-medium text-text"
              >
                {item.question}
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                    isOpen ? "rotate-180 border-brand/50 text-brand" : "border-border-strong text-text-subtle"
                  }`}
                >
                  <ChevronDownIcon className="size-3.5" aria-hidden="true" />
                </span>
              </button>
            </h3>
            {isOpen && (
              <div id={panelId} role="region" aria-labelledby={buttonId} className="px-5 pb-5 text-sm leading-relaxed text-pretty text-text-muted">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
