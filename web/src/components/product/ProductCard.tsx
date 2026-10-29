import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { Product } from "@/types/product";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProductCoverArt } from "@/components/product/ProductCoverArt";
import { Lifecycle } from "@/components/product/Lifecycle";
import { visualFor } from "@/components/product/categoryVisuals";
import { ArrowRightIcon } from "@/components/icons";

export function ProductCard({ product }: { product: Product }) {
  const visual = visualFor(product.categorySlug);

  return (
    <Link
      to={`/productos/${product.slug}`}
      aria-label={`${product.name}: ver detalle`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[color:var(--hue)]/40"
      style={{ "--hue": visual.color } as CSSProperties}
    >
      <div className="relative border-b border-border">
        <ProductCoverArt categorySlug={product.categorySlug} showLabel={false} className="transition-transform duration-500 group-hover:scale-[1.03]" />
        <span
          className="absolute left-3 top-3 rounded-md border border-white/10 bg-bg/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider backdrop-blur-sm"
          style={{ color: visual.color }}
        >
          {visual.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight text-text">{product.name}</h3>
          <StatusBadge status={product.status} />
        </div>
        <p className="line-clamp-2 flex-1 text-sm text-pretty text-text-muted">{product.shortDescription}</p>

        <Lifecycle status={product.status} compact />

        <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="font-mono text-xs text-text-subtle">{product.demo ? "▸ Demo disponible" : "Sin demo aún"}</span>
          <span className="inline-flex items-center gap-1 font-medium text-text transition-colors group-hover:text-brand-soft">
            Ver detalle
            <ArrowRightIcon className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
