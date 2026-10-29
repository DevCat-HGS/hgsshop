import { Link } from "react-router-dom";
import type { Product } from "@/types/product";
import { ArchivePhoto } from "@/components/ui/ArchivePhoto";
import { FacetStage } from "@/components/product/FacetStage";
import { ProductCoverArt } from "@/components/product/ProductCoverArt";
import { DemoButton } from "@/components/product/DemoButton";
import { photoFor } from "@/components/product/categoryPhotos";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Toda la tarjeta lleva al detalle (el enlace del título se estira con `after:inset-0`), y el botón de demo
 * queda por encima con `relative`: así no se anida un enlace dentro de otro.
 */
export function ProductCard({ product }: { product: Product }) {
  const photo = photoFor(product.categorySlug);

  return (
    <article className="press group relative flex flex-col overflow-hidden rounded-sm bg-surface transition-colors duration-200 hover:bg-surface-hover">
      {photo ? (
        <ArchivePhoto photo={photo} className="aspect-[16/10]" imgClassName="transition-[opacity,transform] duration-500 group-hover:scale-[1.03] group-hover:opacity-100" />
      ) : (
        <ProductCoverArt categorySlug={product.categorySlug} showLabel={false} />
      )}

      <div className="flex flex-1 flex-col gap-4 p-6">
        <h3 className="font-display text-3xl text-text">
          <Link
            to={`/productos/${product.slug}`}
            aria-label={`${product.name}: ver detalle`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-brand"
          >
            {product.name}
          </Link>
        </h3>
        <p className="line-clamp-2 flex-1 text-base text-pretty text-text">{product.shortDescription}</p>
        <div className="flex items-end justify-between gap-4 pt-2">
          <FacetStage status={product.status} className="size-9" />
          <div className="flex items-center gap-4">
            <DemoButton product={product} className="relative z-10" />
            <span className="inline-flex items-center gap-1 text-[15px] font-semibold text-brand" aria-hidden="true">
              Ver
              <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
