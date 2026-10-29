import type { ProductStatus } from "@/types/product";
import { lifecycleStages } from "@/lib/format";

/**
 * Dónde está un producto en su camino a estar disponible. Hace visible lo que el catálogo promete:
 * que ningún producto aparenta estar más avanzado de lo que está.
 */
export function Lifecycle({ status, compact = false }: { status: ProductStatus; compact?: boolean }) {
  if (status === "quote_required") {
    return (
      <p className={`font-mono text-text-subtle ${compact ? "text-[11px]" : "text-xs"}`}>
        Servicio a medida · se define con cada cliente
      </p>
    );
  }

  const current = lifecycleStages.findIndex((stage) => stage.status === status);

  return (
    <div>
      <ol className="flex items-center gap-1.5" aria-label={`Etapa ${current + 1} de ${lifecycleStages.length}: ${lifecycleStages[current].label}`}>
        {lifecycleStages.map((stage, index) => (
          <li
            key={stage.status}
            className={`h-1 flex-1 rounded-full ${index < current ? "bg-brand/60" : index === current ? "bg-brand" : "bg-border-strong"}`}
          />
        ))}
      </ol>
      {!compact && (
        <div className="mt-2 flex justify-between font-mono text-[11px]" aria-hidden="true">
          {lifecycleStages.map((stage, index) => (
            <span key={stage.status} className={index === current ? "text-text" : "text-text-subtle"}>
              {stage.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
