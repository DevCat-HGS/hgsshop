import { Link } from "react-router-dom";
import type { Product } from "@/types/product";
import { ProductMark } from "@/components/product/ProductIcon";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Ideas en exploración: todavía no existen, así que no llevan foto ni demo. Van como filas compactas
 * bajo los productos reales para que el catálogo no las presente con el mismo peso. Toda la fila
 * lleva al detalle, como en ProductCard.
 */
export function IdeaList({ products, headingLevel = "h2" }: { products: Product[]; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <section aria-labelledby="ideas-titulo">
      <Heading id="ideas-titulo" className="font-display text-[length:var(--text-step-lead)] text-text">
        Ideas en exploración
      </Heading>
      <p className="mt-3 max-w-2xl text-base text-pretty text-text-muted">
        Todavía no existen. Si alguna resuelve un problema de tu negocio, dilo desde su página: las que más interés
        reciben pasan a prototipo primero.
      </p>
      <ul className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        {products.map((product) => (
          <li key={product.id}>
            <article className="press group relative flex items-start gap-5 rounded-sm bg-surface p-5 transition-colors duration-200 hover:bg-surface-hover">
              <ProductMark slug={product.slug} status={product.status} size={44} />
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-2xl text-text">
                  <Link
                    to={`/productos/${product.slug}`}
                    aria-label={`${product.name}: ver detalle`}
                    className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-brand"
                  >
                    {product.name}
                  </Link>
                </h3>
                <p className="mt-1.5 text-base text-pretty text-text">{product.shortDescription}</p>
              </div>
              <ArrowRightIcon
                className="mt-2 size-5 shrink-0 text-brand transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
