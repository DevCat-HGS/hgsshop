import type { Product } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { CheckList } from "@/components/product/InfoList";
import { ArrowRightIcon } from "@/components/icons";

/** Destaca la primera demo interactiva del catálogo. Si ninguna existe, la sección no se muestra. */
export function DemoSpotlight({ products }: { products: Product[] }) {
  const product = products.find((p) => p.demo);
  if (!product?.demo) return null;

  const preview = [
    { title: "Definir modelo de datos", tag: "hecho" },
    { title: "Pantalla de carrito en móvil", tag: "en progreso" },
    { title: "Webhook de confirmación de pago", tag: "pendiente" },
  ];

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-depth/50 via-surface/80 to-surface/60 p-8 backdrop-blur-sm sm:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand/15 blur-3xl" aria-hidden="true" />

          <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow>03 · Pruébalo ahora</Eyebrow>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-text sm:text-4xl">
                {product.name} tiene una demo que puedes usar, no solo mirar
              </h2>
              <p className="mt-4 max-w-lg text-base text-text-muted">{product.demo.instructions}</p>
              <div className="mt-6">
                <CheckList items={[product.demo.isolation, "Sin registro, sin correo, sin tarjeta."]} />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button to={product.demo.url} size="lg">
                  Abrir la demo
                  <ArrowRightIcon className="size-4" aria-hidden="true" />
                </Button>
                <Button to={`/productos/${product.slug}`} variant="secondary" size="lg">
                  Ver el producto
                </Button>
              </div>
            </div>

            {/* Vista previa decorativa, rotulada: la interacción real ocurre en la demo. */}
            <div aria-hidden="true" className="rounded-2xl border border-border bg-bg/80 p-4 shadow-card">
              <div className="mb-4 flex items-center justify-between font-mono text-[11px] text-text-subtle">
                <span>{product.name.toLowerCase()} / tablero</span>
                <span className="rounded bg-warning-muted px-1.5 py-0.5 text-warning">demo</span>
              </div>
              <div className="flex flex-col gap-2">
                {preview.map((task, index) => (
                  <div key={task.title} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                    <span className={`text-sm ${index === 0 ? "text-text-subtle line-through" : "text-text"}`}>{task.title}</span>
                    <span
                      className={`font-mono text-[10px] uppercase ${
                        index === 0 ? "text-accent" : index === 1 ? "text-brand" : "text-text-subtle"
                      }`}
                    >
                      {task.tag}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-brand to-accent" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
