import { Suspense, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { getProductBySlug } from "@/lib/catalog";
import { trackEvent } from "@/lib/analytics";
import type { Product } from "@/types/product";
import { inAppDemos } from "@/demos/registry";
import { clearDemoData } from "@/demos/kit/storage";
import { Btn, ConfirmButton, Dialog } from "@/demos/kit/ui";
import { LogoMark } from "@/components/layout/Logo";
import { Container } from "@/components/ui/Container";
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

/**
 * La demo ocupa toda la pestaña, como la aplicación real. Una barra fina arriba recuerda que es un entorno de
 * prueba y da las salidas: volver al producto, cotizar, reiniciar los datos y leer los límites de la demo.
 */
function DemoView({ product }: { product: Product }) {
  useDocumentHead({
    title: `Demo de ${product.name}`,
    description: `Prueba interactiva de ${product.name} con datos ficticios.`,
    path: `/demos/${product.slug}`,
    noindex: true,
  });

  const App = inAppDemos[product.slug];
  // Cambiar la clave vuelve a montar la app, que relee el almacenamiento ya vacío y siembra los datos de ejemplo.
  const [generation, setGeneration] = useState(0);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    if (App) trackEvent("demo_opened", { product: product.slug });
  }, [App, product.slug]);

  if (!product.demo || !App) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Este producto todavía no tiene demo"
          description="Preferimos decirlo claramente antes que mostrar algo que aparente funcionar. Puedes pedir una sesión guiada para ver su estado real."
          action={
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Button to={`/desarrollo-a-medida?producto=${product.slug}`} size="sm">
                Solicitar sesión guiada
              </Button>
              <Button to={`/productos/${product.slug}`} variant="secondary" size="sm">
                Volver al producto
              </Button>
            </div>
          }
        />
      </Container>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <div role="note" aria-label="Entorno de demostración" className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface px-3 py-2 sm:px-4">
        <Link to={`/productos/${product.slug}`} className="flex items-center gap-2 rounded-sm text-sm font-semibold text-text-muted hover:text-text">
          <LogoMark className="size-5" />
          <span>
            <span className="sr-only">Volver a </span>
            {product.name}
          </span>
        </Link>
        <p className="min-w-0 flex-1 text-[13px] text-text-muted">
          <span className="font-semibold text-warning">Entorno de demostración</span>
          <span className="hidden sm:inline"> · Datos ficticios, guardados solo en este navegador.</span>
        </p>
        <div className="flex items-center gap-1">
          <Btn variant="ghost" size="sm" onClick={() => setAboutOpen(true)}>
            Acerca de la demo
          </Btn>
          <ConfirmButton
            label="Reiniciar datos"
            title="Reiniciar la demo"
            message="Se borran los cambios que hiciste y vuelven los datos de ejemplo. No afecta nada fuera de este navegador."
            confirmLabel="Reiniciar"
            onConfirm={() => {
              clearDemoData(product.slug);
              setGeneration((g) => g + 1);
            }}
          />
          <Button to={`/desarrollo-a-medida?producto=${product.slug}`} size="sm" className="ml-1 !py-1 !text-[13px]">
            Cotizar
          </Button>
        </div>
      </div>

      <h1 className="sr-only">Demo de {product.name}</h1>
      <main className="min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center gap-2 text-sm text-text-muted">
              <SpinnerIcon className="size-4" aria-hidden="true" /> Cargando demo…
            </div>
          }
        >
          <App key={generation} />
        </Suspense>
      </main>

      <Dialog open={aboutOpen} onClose={() => setAboutOpen(false)} title={`Acerca de la demo de ${product.name}`}>
        <div className="flex flex-col gap-5 text-sm">
          <p className="text-text">{product.demo.instructions}</p>
          <div>
            <h3 className="font-semibold text-text">Aislamiento</h3>
            <p className="mt-1 text-text-muted">{product.demo.isolation}</p>
          </div>
          <div>
            <h3 className="font-semibold text-text">Limitaciones de la demo</h3>
            <div className="mt-2">
              <LimitationsList items={product.demo.limitations} />
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default DemoPage;
