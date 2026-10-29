import { Link } from "react-router-dom";
import type { Product } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FacetStage } from "@/components/product/FacetStage";
import { Slide } from "@/components/home/Slide";
import { ArrowRightIcon } from "@/components/icons";

/**
 * S4 · Productos. Índice tipográfico del catálogo: cada producto es una fila con su nombre a tamaño de
 * titular y su hexágono de etapa. Nada de rejilla de tarjetas: la escala hace el trabajo.
 */
export function Productos({ products }: { products: Product[] }) {
  return (
    <Slide id="productos" tone="surface" labelledBy="productos-titulo" className="lg:!py-14">
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div data-reveal className="flex flex-col gap-6 lg:self-start">
          <h2 id="productos-titulo" className="font-display text-[length:var(--text-step-head)] text-text">
            Lo que hay en el taller
          </h2>
          <p className="max-w-sm text-lg text-pretty text-text">
            El hexágono dice la etapa: un prototipo tiene dos facetas en su sitio; un producto disponible, las seis.
          </p>
          <Button to="/productos" variant="secondary" className="self-start">
            Abrir el catálogo
          </Button>
        </div>

        <ul className="flex flex-col gap-1">
          {products.map((product) => (
            <li key={product.id} data-reveal>
              <Link
                to={`/productos/${product.slug}`}
                className="press group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 rounded-sm bg-bg/40 px-6 py-5 transition-colors duration-200 hover:bg-bg sm:grid-cols-[minmax(0,1fr)_14rem_auto]"
              >
                <span className="min-w-0">
                  <span className="font-display block text-[clamp(1.75rem,min(3.4vw,5.6vh),3.25rem)] text-text">{product.name}</span>
                  <span className="mt-2 block text-base text-pretty text-text-muted">{product.shortDescription}</span>
                </span>
                <span className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                  <FacetStage status={product.status} className="size-10" />
                </span>
                <ArrowRightIcon
                  className="col-start-2 row-start-1 size-6 text-text-subtle transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand sm:col-start-auto sm:row-start-auto"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Slide>
  );
}
