import { Link } from "react-router-dom";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { ProductIcon } from "@/components/product/ProductIcon";
import { Slide } from "@/components/home/Slide";

/**
 * S3 · Categorías. Una franja de paneles de borde a borde, uno por oficio, cada uno con el isotipo y el
 * color de su producto principal. El panel enfocado o bajo el puntero se ensancha.
 */
export function Categorias({ categories, products }: { categories: Category[]; products: Product[] }) {
  return (
    <Slide id="categorias" labelledBy="categorias-titulo" className="!pb-0">
      <Container className="grid gap-4 lg:grid-cols-2 lg:items-end">
        <h2 id="categorias-titulo" data-reveal className="font-display text-[length:var(--text-step-head)] text-text">
          Empieza por tu oficio
        </h2>
        <p data-reveal className="max-w-lg text-lg text-pretty text-text lg:justify-self-end">
          Cada categoría reúne software para un tipo de trabajo que antes se hacía a mano, en papel o de memoria.
        </p>
      </Container>

      <ul className="mt-12 flex flex-1 flex-col gap-1 lg:min-h-[58svh] lg:flex-row">
        {categories.map((category) => {
          const own = products.filter((p) => p.categorySlug === category.slug);
          const count = own.length;
          // El producto que da la cara por la categoría: el más avanzado que ya existe, si no, la primera idea.
          const lead = own.find((p) => p.status !== "idea") ?? own[0];
          return (
            <li
              key={category.slug}
              className="group/panel relative flex min-h-36 transition-[flex-grow] duration-500 ease-[var(--ease-out)] lg:flex-1 lg:hover:flex-[1.8] lg:focus-within:flex-[1.8]"
            >
              {/* La entrada va en un envoltorio: el li ya anima su ensanchado (flex-grow). */}
              <div data-reveal className="flex flex-1">
                <Link to={`/productos?categoria=${category.slug}`} className="press relative flex flex-1 overflow-hidden focus-visible:outline-offset-[-3px]">
                  {lead && (
                    <span className="absolute inset-0 pb-16">
                      <ProductIcon slug={lead.slug} status={lead.status} size={88} className="size-full" />
                    </span>
                  )}
                  <span className="relative mt-auto flex w-full flex-col gap-1 bg-bg/85 px-5 py-4">
                    <span className="text-lg font-semibold leading-tight text-text">{category.name}</span>
                    <span className="text-[15px] text-text-muted">
                      {count} {count === 1 ? "producto" : "productos"}
                      {lead && <span className="hidden xl:inline"> · {lead.name}</span>}
                    </span>
                  </span>
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </Slide>
  );
}
