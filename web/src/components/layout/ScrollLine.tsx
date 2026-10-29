import { useEffect, useId, useRef, type CSSProperties } from "react";
import { Container } from "@/components/ui/Container";

// Trazo de docs/marca/recursos/trazo-prefooter.md (Uiverse). pathLength=1 permite dibujarlo con un solo número de 0 a 1.
const TRACE =
  "M-28.73 167.2c26.43 9.21 68.46-9.46 85.45-12.03 18.45-2.78 32.82 4.86 28.75 9.83-3.82 4.66-25.77-21.18-14.81-31.5 9.54-8.98 17.64 10.64 16.42 17.06-1.51-6.2 2.95-26.6 14.74-22.11 11.7 4.46-4.33 49.03-15.44 44.08-6.97-3.1 15.44-16.26 26.1-16 23.03.56 55.6 27.51 126.63 3.36";

// El trazo termina de dibujarse cuando la franja sube hasta este punto de la pantalla (0 = arriba).
const FINISH_AT = 0.35;
// Con offset 0 exacto el punto saltaría al inicio del trazo: se detiene justo antes del final.
const MAX_PROGRESS = 0.9995;

/**
 * Franja previa al footer: el trazo se dibuja a medida que la persona hace scroll, con un punto
 * luminoso en la punta. El progreso se escribe como variable CSS directamente en el elemento (sin
 * re-renderizar React) y solo se escucha el scroll mientras la franja está en pantalla. Con
 * movimiento reducido se muestra el trazo completo y quieto.
 */
export function ScrollLine() {
  const ref = useRef<HTMLDivElement>(null);
  const filterId = `${useId().replace(/:/g, "")}-glow`;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const setProgress = (value: number) => element.style.setProperty("--trace", String(value));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(MAX_PROGRESS);
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const { top } = element.getBoundingClientRect();
      const viewport = window.innerHeight;
      const raw = (viewport - top) / (viewport * (1 - FINISH_AT));
      setProgress(Math.min(MAX_PROGRESS, Math.max(0, raw)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener("scroll", onScroll, { passive: true });
        update();
      } else {
        window.removeEventListener("scroll", onScroll);
      }
    });
    observer.observe(element);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <Container className="pb-4 pt-16">
      <div
        ref={ref}
        className="relative overflow-hidden rounded-3xl border border-border bg-surface/50 px-6 py-8 backdrop-blur-sm sm:px-10"
        style={{ "--trace": 0 } as CSSProperties}
      >
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

        <div className="relative flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-text-subtle">
          <span>Tu problema</span>
          <span className="text-text-muted">Software que lo resuelve</span>
        </div>

        <svg viewBox="-5 -5 278 56" className="relative mt-4 h-auto w-full overflow-visible" aria-hidden="true" focusable="false">
          <defs>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.6" />
            </filter>
          </defs>
          <g transform="translate(29.1 -127.42)">
            {/* Recorrido completo, apenas visible: anticipa hacia dónde va el trazo. */}
            <path d={TRACE} pathLength={1} fill="none" stroke="#1a2742" strokeWidth={1.5} strokeLinejoin="round" />
            <path
              d={TRACE}
              pathLength={1}
              fill="none"
              stroke="#6ea8ff"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeDasharray="1"
              style={{ strokeDashoffset: "calc(1 - var(--trace))" }}
            />
            {/* Punta luminosa: un guion casi nulo con extremo redondo, desenfocado para dar brillo. */}
            <path
              d={TRACE}
              pathLength={1}
              fill="none"
              stroke="#48d6b0"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray="0.0001 0.9999"
              filter={`url(#${filterId})`}
              style={{ strokeDashoffset: "calc(1 - var(--trace))" }}
            />
            <path
              d={TRACE}
              pathLength={1}
              fill="none"
              stroke="#f3f7ff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="0.0001 0.9999"
              style={{ strokeDashoffset: "calc(1 - var(--trace))" }}
            />
          </g>
        </svg>
      </div>
    </Container>
  );
}
