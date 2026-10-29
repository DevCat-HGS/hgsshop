import { Link } from "react-router-dom";
import type { Product } from "@/types/product";
import { statusLabels } from "@/lib/format";
import { FacetStage } from "@/components/product/FacetStage";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Fragmento real de la plataforma: el catálogo como tablero de estado. Se alimenta de los datos reales,
 * así que si un producto cambia de etapa el tablero lo refleja. Dentro de `data-ui` rigen las
 * convenciones de una interfaz (bordes de 1 px, textos a tamaño real).
 */
export function StatusBoard({ products, ideaCount = 0, compact = false }: { products: Product[]; ideaCount?: number; compact?: boolean }) {
  return (
    <div data-ui className="flex size-full flex-col overflow-hidden rounded-[6px] border border-border-strong bg-bg text-left">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-[13px]">
        <span className="font-semibold text-text">Catálogo · estado actual</span>
        <span className="flex items-center gap-1.5 text-accent">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          {products.length} productos{ideaCount > 0 ? ` · ${ideaCount} ideas` : ""}
        </span>
      </div>
      <ul /* taste-skill-ignore: dentro de un fragmento data-ui */ className="flex flex-1 flex-col divide-y divide-border">
        {products.map((product) => (
          <li key={product.id} className="flex flex-1">
            <Link
              to={`/productos/${product.slug}`}
              className={`group flex flex-1 items-center gap-3 px-4 transition-colors hover:bg-surface ${compact ? "py-2" : "py-3"}`}
            >
              <FacetStage status={product.status} className="size-6" label={false} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-text">{product.name}</span>
              <span className="text-[13px] text-text-muted">{statusLabels[product.status]}</span>
              <ArrowRightIcon className="size-3.5 shrink-0 text-text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-text" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
