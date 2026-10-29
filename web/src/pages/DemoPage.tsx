import { Suspense, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { getProductBySlug } from "@/lib/catalog";
import { trackEvent } from "@/lib/analytics";
import type { Product } from "@/types/product";
import { inAppDemos } from "@/demos/registry";
import { clearDemoData, clearUiFlag, DEMO_CHANGE_EVENT, exportDemoData, importDemoData, readUiFlag, setUiFlag } from "@/demos/kit/storage";
import { tours } from "@/demos/kit/tours";
import { Btn, ConfirmButton, Dialog, FormError } from "@/demos/kit/ui";
import { LogoMark } from "@/components/layout/Logo";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LimitationsList } from "@/components/product/InfoList";
import { CloseIcon, SpinnerIcon } from "@/components/icons";
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
  const [dataOpen, setDataOpen] = useState(false);
  const tour = tours[product.slug] ?? [];
  // Recorrido: se abre solo en la primera visita a esta demo.
  const [tourStep, setTourStep] = useState<number | null>(() => (tour.length && !readUiFlag(`tour:${product.slug}`) ? 0 : null));
  const cta = useQuoteNudge(product.slug);

  useEffect(() => {
    if (App) trackEvent("demo_opened", { product: product.slug });
  }, [App, product.slug]);

  function closeTour(finished: boolean) {
    setUiFlag(`tour:${product.slug}`);
    setTourStep(null);
    if (finished) trackEvent("demo_tour_finished", { product: product.slug });
  }

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
      <div data-ui role="note" aria-label="Entorno de demostración" className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-surface px-3 py-2 sm:px-4">
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
          <Btn variant="ghost" size="sm" onClick={() => setDataOpen(true)}>
            Tus datos
          </Btn>
          <Button to={`/desarrollo-a-medida?producto=${product.slug}`} size="sm" className="ml-1 !py-1 !text-[13px]">
            Cotizar
          </Button>
        </div>
      </div>

      {cta.visible && (
        <div data-ui role="region" aria-label="Invitación a cotizar" className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-brand-muted px-3 py-2 sm:px-4">
          <p className="min-w-0 flex-1 text-[13px] text-text">
            <span className="font-semibold">¿Te sirve para tu negocio?</span> Lo adaptamos a tus datos y a tu forma de trabajar.
          </p>
          <Button
            to={`/desarrollo-a-medida?producto=${product.slug}`}
            size="sm"
            className="!py-1 !text-[13px]"
            onClick={() => trackEvent("demo_cta_clicked", { product: product.slug })}
          >
            Pedir una cotización
          </Button>
          <button type="button" onClick={cta.dismiss} aria-label="Cerrar invitación" className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text">
            <CloseIcon className="size-4" />
          </button>
        </div>
      )}

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
          {tour.length > 0 && (
            <Btn
              className="self-start"
              onClick={() => {
                setAboutOpen(false);
                setTourStep(0);
              }}
            >
              Ver el recorrido
            </Btn>
          )}
        </div>
      </Dialog>

      <DataDialog
        open={dataOpen}
        onClose={() => setDataOpen(false)}
        product={product}
        onChanged={() => {
          setDataOpen(false);
          setGeneration((g) => g + 1);
        }}
      />

      {tourStep !== null && tour[tourStep] && (
        <Dialog open onClose={() => closeTour(false)} title={tour[tourStep].title}>
          <p className="text-[13px] text-text-muted">
            Paso {tourStep + 1} de {tour.length}
          </p>
          <p className="mt-2 text-sm text-text">{tour[tourStep].body}</p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <Btn variant="ghost" onClick={() => closeTour(false)}>
              Saltar recorrido
            </Btn>
            <div className="flex gap-2">
              {tourStep > 0 && <Btn onClick={() => setTourStep(tourStep - 1)}>Atrás</Btn>}
              {tourStep < tour.length - 1 ? (
                <Btn variant="primary" onClick={() => setTourStep(tourStep + 1)}>
                  Continuar
                </Btn>
              ) : (
                <Btn variant="primary" onClick={() => closeTour(true)}>
                  Empezar a probar
                </Btn>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

/** Versión del formato de la copia de seguridad. */
const BACKUP_VERSION = 1;

/**
 * "Tus datos": volver a los datos de ejemplo, empezar vacío para cargar datos propios, y descargar o restaurar una
 * copia de seguridad en JSON. Todo en el navegador.
 */
function DataDialog({ open, onClose, product, onChanged }: { open: boolean; onClose: () => void; product: Product; onChanged: () => void }) {
  const [error, setError] = useState("");
  const slug = product.slug;

  function restart(blank: boolean) {
    if (blank) setUiFlag(`blank:${slug}`);
    else clearUiFlag(`blank:${slug}`);
    clearDemoData(slug);
    onChanged();
  }

  function download() {
    const backup = { app: "hgs-demo", product: slug, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data: exportDemoData(slug) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}-copia-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function restore(file: File | undefined) {
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (backup?.app !== "hgs-demo" || typeof backup.data !== "object" || backup.data === null) {
        setError("Ese archivo no es una copia de seguridad de una demo de HGS.");
        return;
      }
      if (backup.product !== slug) {
        setError(`Esa copia es de otro producto (${backup.product}); aquí solo se puede restaurar una copia de ${product.name}.`);
        return;
      }
      importDemoData(slug, backup.data);
      setError("");
      onChanged();
    } catch {
      setError("No se pudo leer el archivo. Debe ser el JSON que descargaste con \"Descargar copia\".");
    }
  }

  return (
    <Dialog open={open} onClose={() => { setError(""); onClose(); }} title="Tus datos en esta demo">
      <div className="flex flex-col gap-5 text-sm">
        <p className="text-text-muted">Lo que haces aquí se guarda solo en este navegador. Desde aquí lo controlas.</p>

        <section aria-label="Empezar de nuevo" className="flex flex-col gap-2">
          <h3 className="font-semibold text-text">Empezar de nuevo</h3>
          <div className="flex flex-wrap gap-2">
            <ConfirmButton
              label="Volver a los datos de ejemplo"
              title="Volver a los datos de ejemplo"
              message="Se borran los cambios que hiciste y vuelven los datos ficticios de la demo."
              confirmLabel="Usar datos de ejemplo"
              size="md"
              onConfirm={() => restart(false)}
            />
            <ConfirmButton
              label="Empezar vacío"
              title="Empezar vacío"
              message={`${product.name} queda sin registros, lista para que cargues los tuyos a mano o importándolos desde Excel. Se borran los datos actuales.`}
              confirmLabel="Empezar vacío"
              size="md"
              onConfirm={() => restart(true)}
            />
          </div>
        </section>

        <section aria-label="Copia de seguridad" className="flex flex-col gap-2">
          <h3 className="font-semibold text-text">Copia de seguridad</h3>
          <p className="text-text-muted">Descarga todo en un archivo y restáuralo después, en este u otro navegador.</p>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={download}>Descargar copia</Btn>
            <label className="inline-flex cursor-pointer items-center rounded-md bg-surface-hover px-3.5 py-2 text-sm font-semibold text-text hover:bg-depth focus-within:outline-2 focus-within:outline-brand">
              Restaurar copia
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(e) => {
                  void restore(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <FormError>{error}</FormError>
        </section>
      </div>
    </Dialog>
  );
}

/** Cambios guardados antes de invitar a cotizar: suficientes para que la persona ya haya probado algo de verdad. */
const NUDGE_AFTER = 5;

/**
 * Invitación a cotizar en el momento justo: tras unas cuantas acciones reales en la demo (cada cambio que la app
 * guarda), una sola vez por demo. No bloquea nada y se puede cerrar.
 */
function useQuoteNudge(slug: string) {
  const [visible, setVisible] = useState(false);
  const count = useRef(0);

  useEffect(() => {
    function onChange(event: Event) {
      if ((event as CustomEvent<{ slug: string }>).detail?.slug !== slug) return;
      count.current += 1;
      if ([1, NUDGE_AFTER, 20].includes(count.current)) trackEvent("demo_action", { product: slug, count: count.current });
      if (count.current === NUDGE_AFTER && !readUiFlag(`cta:${slug}`)) {
        setUiFlag(`cta:${slug}`);
        setVisible(true);
        trackEvent("demo_cta_shown", { product: slug });
      }
    }
    window.addEventListener(DEMO_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(DEMO_CHANGE_EVENT, onChange);
  }, [slug]);

  return { visible, dismiss: () => setVisible(false) };
}

export default DemoPage;
