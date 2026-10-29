import { Link } from "react-router-dom";
import type { Product } from "@/types/product";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { visualFor } from "@/components/product/categoryVisuals";
import { ArrowRightIcon } from "@/components/icons";

/**
 * El catálogo como tablero de estado, al estilo de un panel de despliegues. Se alimenta del catálogo
 * real: si un producto cambia de estado, el tablero lo refleja sin tocar este componente.
 */
export function StatusBoard({ products }: { products: Product[] }) {
  return (
    <div className="relative">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-brand/30 via-border to-transparent" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-2xl bg-surface/90 shadow-card backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
            </span>
            <span className="ml-2 font-mono text-xs text-text-subtle">catalogo / estado</span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-accent">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-accent" aria-hidden="true" />
            en vivo
          </span>
        </div>

        <ul className="divide-y divide-border">
          {products.map((product) => {
            const visual = visualFor(product.categorySlug);
            return (
              <li key={product.id}>
                <Link
                  to={`/productos/${product.slug}`}
                  className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-hover focus-visible:outline-offset-[-2px]"
                >
                  <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: visual.color }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text">{product.name}</span>
                    <span className="block truncate font-mono text-[11px] text-text-subtle">
                      {visual.label.toLowerCase()}
                      {product.demo ? " · demo disponible" : ""}
                    </span>
                  </span>
                  <StatusBadge status={product.status} />
                  <ArrowRightIcon
                    className="hidden size-3.5 shrink-0 text-text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-text sm:block"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-border bg-bg-raised/60 px-5 py-3 font-mono text-[11px] text-text-subtle">
          Ningún producto se muestra más avanzado de lo que está.
        </div>
      </div>
    </div>
  );
}
