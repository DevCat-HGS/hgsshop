import { useEffect, useRef, type CSSProperties } from "react";
import type { Product } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { StatusBoard } from "@/components/home/StatusBoard";
import { DevPanelFrame, QuoteFrame, ReceivedFrame, SearchFrame } from "@/components/home/ReelFrames";
import { ArrowRightIcon } from "@/components/icons";

// Pasos de la tira: catálogo → solicitud de cotización → DevPanel. Cada uno ocupa una pantalla de scroll.
const STEPS = 3;
const HEADER_HEIGHT = 64;
// Alto de un fotograma: 35vw de ancho en 16:9. Los asomos del anterior y el siguiente miden 60 px + 24 de hueco.
const FRAME_HEIGHT = "19.6875vw";

/**
 * S1 · Portada. Dirección "product-performs", héroe "frase partida por un marco": la frase se abre a los
 * dos bordes y en el centro corre una tira de fragmentos reales de la plataforma. En escritorio el
 * escenario queda fijo durante tres pantallas y cada gesto de scroll avanza un fotograma (con un punto
 * de encaje por paso); la frase no se mueve. En móvil se muestra solo el estado del catálogo.
 */
export function Portada({ products, ideaCount }: { products: Product[]; ideaCount: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const reel = reelRef.current;
    if (!section || !reel) return;

    const desktop = window.matchMedia("(min-width: 1024px)");
    let frame = 0;

    // El progreso se escribe como variable CSS en la tira: sin re-renderizar React en cada scroll.
    const update = () => {
      frame = 0;
      if (!desktop.matches) return;
      const step = window.innerHeight - HEADER_HEIGHT;
      const scrolled = HEADER_HEIGHT - section.getBoundingClientRect().top;
      reel.style.setProperty("--reel", String(Math.min(STEPS - 1, Math.max(0, scrolled / step))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    desktop.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      desktop.removeEventListener("change", update);
    };
  }, []);

  const frames = [
    <SearchFrame key="buscar" />,
    <StatusBoard key="estado" products={products} ideaCount={ideaCount} compact />,
    <QuoteFrame key="cotizar" />,
    <DevPanelFrame key="devpanel" />,
    <ReceivedFrame key="recibido" />,
  ];

  return (
    <section ref={sectionRef} id="portada" aria-labelledby="portada-titulo" className="relative lg:h-[calc((100svh-4rem)*3)]">
      {/* Un punto de encaje por fotograma: cada gesto de scroll avanza la tira un paso. */}
      {Array.from({ length: STEPS }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 hidden h-0 snap-start lg:block"
          style={{ top: `calc((100svh - 4rem) * ${index})` }}
        />
      ))}

      <div className="flex min-h-[calc(100svh-4rem)] flex-col justify-between lg:sticky lg:top-16 lg:h-[calc(100svh-4rem)]">
        <Container className="relative flex flex-1 flex-col justify-center py-10 lg:py-0">
          <h1
            id="portada-titulo"
            className="font-display flex flex-col text-[11vw] text-text lg:flex-row lg:items-center lg:justify-between lg:text-[clamp(2.5rem,3.6vw,4rem)]"
          >
            <span data-reveal>Software que se</span>
            <span data-reveal className="self-end lg:self-auto">
              puede probar
            </span>
          </h1>

          <div data-reveal className="mt-8 aspect-[4/3] lg:hidden">
            <StatusBoard products={products} ideaCount={ideaCount} compact />
          </div>

          <div
            data-reveal
            className="absolute left-1/2 top-1/2 hidden w-[35vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden lg:block"
            style={{ height: `calc(${FRAME_HEIGHT} + 168px)` }}
          >
            <div
              ref={reelRef}
              data-reel
              className="flex flex-col gap-6 will-change-transform"
              style={
                {
                  "--reel": 0,
                  transform: `translateY(calc(84px - (var(--reel) + 1) * (${FRAME_HEIGHT} + 24px)))`,
                } as CSSProperties
              }
            >
              {frames.map((content, index) => (
                <div key={index} className="shrink-0" style={{ height: FRAME_HEIGHT }}>
                  {content}
                </div>
              ))}
            </div>
          </div>
        </Container>

        <Container className="flex flex-col gap-6 pb-12 sm:flex-row sm:items-end sm:justify-between lg:pb-16">
          <p data-reveal className="max-w-md text-lg text-pretty text-text">
            Aplicaciones para negocios, cada una con su etapa real. Las que tienen demo se usan aquí mismo; las demás, te
            las muestro o las construimos a tu medida.
          </p>
          <Button to="/productos" size="lg" className="self-start sm:self-auto">
            Ver el catálogo
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Button>
        </Container>
      </div>
    </section>
  );
}
