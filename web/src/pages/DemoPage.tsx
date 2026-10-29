import { Suspense, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { getProductBySlug } from "@/lib/catalog";
import { trackEvent } from "@/lib/analytics";
import type { Product } from "@/types/product";
import { inAppDemos } from "@/demos/registry";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LimitationsList } from "@/components/product/InfoList";
import { SpinnerIcon } from "@/components/icons";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function DemoPage() {
  const { slug = "" } = useParams();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getProductBySlug(slug).then((found) => {
      if (!cancelled) setProduct(found ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (product === null) return <NotFoundPage />;
  if (product === undefined) return null;

  return <DemoView product={product} />;
}

function DemoView({ product }: { product: Product }) {
  useDocumentHead({
    title: `Demo de ${product.name}`,
    description: `Prueba interactiva de ${product.name} con datos ficticios.`,
    path: `/demos/${product.slug}`,
    noindex: true,
  });

  const Demo = inAppDemos[product.slug];

  useEffect(() => {
    if (Demo) trackEvent("demo_opened", { product: product.slug });
  }, [Demo, product.slug]);

  return (
    <Container className="py-10">
      <Breadcrumbs
        items={[
          { label: "Productos", to: "/productos" },
          { label: product.name, to: `/productos/${product.slug}` },
          { label: "Demo" },
        ]}
      />

      <div
        role="note"
        className="mt-6 flex flex-col gap-1 rounded-sm bg-warning-muted px-4 py-3 text-[15px] sm:flex-row sm:items-center sm:gap-3"
      >
        <span className="font-semibold text-warning">ENTORNO DE DEMOSTRACIÓN</span>
        <span className="text-text-muted">Datos ficticios. Nada de lo que hagas aquí se guarda ni se envía a ningún servidor.</span>
      </div>

      <h1 className="font-display text-[length:var(--text-step-head)] text-text mt-8">Demo de {product.name}</h1>

      {product.demo && Demo ? (
        <>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">{product.demo.instructions}</p>
          <div data-ui className="mt-8 rounded-[6px] border border-border-strong bg-surface p-4 sm:p-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center gap-2 py-20 text-sm text-text-muted">
                  <SpinnerIcon className="size-4" aria-hidden="true" /> Cargando demo…
                </div>
              }
            >
              <Demo />
            </Suspense>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold text-text">Aislamiento</h2>
              <p className="mt-2 text-sm text-text-muted">{product.demo.isolation}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text">Limitaciones de la demo</h2>
              <div className="mt-2">
                <LimitationsList items={product.demo.limitations} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="Este producto todavía no tiene demo"
            description="Preferimos decirlo claramente antes que mostrar algo que aparente funcionar. Puedes pedir una sesión guiada para ver su estado real."
            action={
              <Button to={`/desarrollo-a-medida?producto=${product.slug}`} size="sm" className="mt-2">
                Solicitar sesión guiada
              </Button>
            }
          />
        </div>
      )}

      <div className="mt-12 flex flex-wrap gap-3">
        <Button to={`/desarrollo-a-medida?producto=${product.slug}`}>Me interesa: solicitar cotización</Button>
        <Button to={`/productos/${product.slug}`} variant="secondary">
          Volver al producto
        </Button>
      </div>
    </Container>
  );
}

export default DemoPage;
