import { Suspense } from "react";
import type { Product } from "@/types/product";
import { inAppDemos } from "@/demos/registry";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { DemoButton } from "@/components/product/DemoButton";
import { Slide } from "@/components/home/Slide";
import { SpinnerIcon } from "@/components/icons";
import { ProductVideo } from "@/components/product/ProductVideo";
import { clipFor } from "@/components/product/productClips";

/**
 * S5 · Demo. La demo real de TaskPro, incrustada a tamaño de interfaz sobre un campo Ocean Blue: se
 * usa aquí mismo, sin registro. El texto describe ese tablero, así que la sección lo prefiere aunque haya
 * otras demos; si TaskPro dejara de tenerla, usa la primera disponible, y sin ninguna no se muestra.
 */
export function Demo({ products }: { products: Product[] }) {
  const withDemo = products.filter((p) => p.demo && inAppDemos[p.slug]);
  const product = withDemo.find((p) => p.slug === "taskpro") ?? withDemo[0];
  const Board = product ? inAppDemos[product.slug] : undefined;
  if (!product?.demo || !Board) return null;
  const clip = clipFor(product.slug);

  return (
    <Slide id="demo" tone="depth" labelledBy="demo-titulo">
      <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div data-reveal className="flex flex-col gap-6">
          <h2 id="demo-titulo" className="font-display text-[length:var(--text-step-head)] text-text">
            {product.name} funciona aquí mismo
          </h2>
          <p className="max-w-md text-lg text-pretty text-text">
            Es la aplicación completa: tablero, proyectos, notas y registro de tiempo. Lo que hagas se guarda solo en tu
            navegador y no se envía a ningún sitio.
          </p>
          <div className="flex flex-wrap gap-3">
            <DemoButton product={product} label="Abrir la demo completa" size="lg" />
            <Button to={`/productos/${product.slug}`} variant="ink" size="lg">
              Ver el producto
            </Button>
          </div>
        </div>

        {clip && <ProductVideo clip={clip} className="lg:hidden" />}

        {/* En pantallas pequeñas la aplicación queda apretada: si hay grabación se muestra esa y, en escritorio, la demo. */}
        <div data-reveal className={`h-[34rem] overflow-hidden rounded-[6px] border border-border-strong ${clip ? "hidden lg:block" : ""}`}>
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center gap-2 text-[15px] text-text-muted">
                <SpinnerIcon className="size-4" aria-hidden="true" /> Cargando la demo…
              </div>
            }
          >
            <Board embedded />
          </Suspense>
        </div>
      </Container>
    </Slide>
  );
}
