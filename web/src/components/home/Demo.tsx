import { Suspense } from "react";
import type { Product } from "@/types/product";
import { inAppDemos } from "@/demos/registry";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Slide } from "@/components/home/Slide";
import { SpinnerIcon } from "@/components/icons";

/**
 * S5 · Demo. La demo real de DevPanel, incrustada a tamaño de interfaz sobre un campo Ocean Blue: se
 * usa aquí mismo, sin registro. Si ningún producto tuviera demo, la sección no se muestra.
 */
export function Demo({ products }: { products: Product[] }) {
  const product = products.find((p) => p.demo && inAppDemos[p.slug]);
  const Board = product ? inAppDemos[product.slug] : undefined;
  if (!product?.demo || !Board) return null;

  return (
    <Slide id="demo" tone="depth" labelledBy="demo-titulo">
      <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-6">
          <h2 id="demo-titulo" className="font-display text-[length:var(--text-step-head)] text-text">
            {product.name} funciona aquí mismo
          </h2>
          <p className="max-w-md text-lg text-pretty text-text">
            Crea una tarea, márcala como hecha, cambia de proyecto. Todo ocurre en tu navegador: no se envía nada y al
            recargar vuelve a empezar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button to={product.demo.url} size="lg">
              Abrir la demo completa
            </Button>
            <Button to={`/productos/${product.slug}`} variant="ink" size="lg">
              Ver el producto
            </Button>
          </div>
        </div>

        <div data-ui className="rounded-[6px] border border-border-strong bg-bg p-4 sm:p-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center gap-2 py-24 text-[15px] text-text-muted">
                <SpinnerIcon className="size-4" aria-hidden="true" /> Cargando la demo…
              </div>
            }
          >
            <Board />
          </Suspense>
        </div>
      </Container>
    </Slide>
  );
}
