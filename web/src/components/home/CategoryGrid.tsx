import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { visualFor } from "@/components/product/categoryVisuals";
import { ArrowRightIcon } from "@/components/icons";

export function CategoryGrid({ categories, products }: { categories: Category[]; products: Product[] }) {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="01 · Categorías"
          title="Empieza por el problema, no por la herramienta"
          description="Cada categoría agrupa soluciones para un tipo de trabajo. Entra por la que se parezca a tu día a día."
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {categories.map((category, index) => {
            const visual = visualFor(category.slug);
            const count = products.filter((p) => p.categorySlug === category.slug).length;
            // Fila superior de 3 tarjetas y fila inferior de 2 más anchas: rompe la rejilla uniforme.
            const span = index < 3 ? "lg:col-span-2" : "lg:col-span-3";

            return (
              <Link
                key={category.slug}
                to={`/productos?categoria=${category.slug}`}
                className={`group relative flex min-h-48 flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface/70 p-6 backdrop-blur-sm transition-colors duration-200 hover:border-[color:var(--hue)]/40 ${span}`}
                style={{ "--hue": visual.color } as CSSProperties}
              >
                <svg
                  viewBox="0 0 400 225"
                  className="pointer-events-none absolute -right-16 -top-6 h-44 w-auto opacity-30 transition-opacity duration-300 group-hover:opacity-60"
                  style={{ color: visual.color }}
                  aria-hidden="true"
                >
                  {visual.motif}
                </svg>

                <span className="relative font-mono text-[11px] uppercase tracking-wider" style={{ color: visual.color }}>
                  {count} {count === 1 ? "producto" : "productos"}
                </span>

                <div className="relative mt-10">
                  <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-text">
                    {category.name}
                    <ArrowRightIcon
                      className="size-4 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </h3>
                  <p className="mt-1.5 max-w-sm text-sm text-text-muted">{category.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
