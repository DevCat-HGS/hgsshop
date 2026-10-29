import type { ProductStatus } from "@/types/product";
import { lifecycleStages, statusDescriptions } from "@/lib/format";
import { FacetStage } from "@/components/product/FacetStage";

/**
 * Dónde está un producto en su camino a estar disponible: el hexágono a medio ensamblar y, debajo, las
 * tres etapas con la actual resaltada. Hace visible que ningún producto aparenta más de lo que es.
 */
export function Lifecycle({ status }: { status: ProductStatus }) {
  const current = lifecycleStages.findIndex((stage) => stage.status === status);

  return (
    <div className="flex flex-col gap-4">
      <FacetStage status={status} className="size-14" />
      <p className="text-base text-pretty text-text">{statusDescriptions[status]}</p>
      {status !== "quote_required" && (
        <ol className="flex flex-wrap gap-x-5 gap-y-1 text-[15px]" aria-label={`Etapa ${current + 1} de ${lifecycleStages.length}`}>
          {lifecycleStages.map((stage, index) => (
            <li key={stage.status} className={index === current ? "font-semibold text-text" : "text-text-muted"}>
              {stage.label}
              {index === current && <span className="sr-only"> (etapa actual)</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
