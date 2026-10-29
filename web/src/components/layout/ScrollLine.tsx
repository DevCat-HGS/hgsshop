import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";

// Trazo de docs/marca/recursos/trazo-prefooter.md (Uiverse). pathLength=1 permite dibujarlo con un solo número de 0 a 1.
const TRACE =
  "M-28.73 167.2c26.43 9.21 68.46-9.46 85.45-12.03 18.45-2.78 32.82 4.86 28.75 9.83-3.82 4.66-25.77-21.18-14.81-31.5 9.54-8.98 17.64 10.64 16.42 17.06-1.51-6.2 2.95-26.6 14.74-22.11 11.7 4.46-4.33 49.03-15.44 44.08-6.97-3.1 15.44-16.26 26.1-16 23.03.56 55.6 27.51 126.63 3.36";

/**
 * S9 · Cierre. Última diapositiva de la portada (solo aparece ahí); el footer pide un scroll más.
 * Al entrar la sección, el trazo se dibuja de izquierda a derecha con un punto luminoso en la punta, se
 * sostiene y vuelve a empezar (animación en index.css, `.trace-line` y `.trace-tip`). Solo corre con la
 * sección en pantalla; con movimiento reducido el trazo queda dibujado y quieto.
 */
export function ScrollLine() {
  const ref = useRef<HTMLElement>(null);
  const filterId = `${useId().replace(/:/g, "")}-glow`;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Quitar la clase al salir reinicia la animación: cada llegada a la sección la dibuja desde cero.
    const observer = new IntersectionObserver(([entry]) => element.classList.toggle("is-drawing", entry.isIntersecting), { threshold: 0.4 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="cierre"
      aria-labelledby="cierre-titulo"
      data-slide
      className="relative flex min-h-[calc(100svh-4rem)] snap-start flex-col justify-center py-20"
    >
      <Container>
        <h2 id="cierre-titulo" data-reveal className="font-display max-w-4xl text-[length:var(--text-step-head)] text-text">
          De tu problema al software que lo resuelve
        </h2>
        <div data-reveal className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-lg">
          <Link to="/desarrollo-a-medida" className="font-semibold text-brand underline-offset-4 hover:underline">
            Contar mi proyecto
          </Link>
          <Link to="/productos" className="font-semibold text-text underline-offset-4 hover:underline">
            Ver el catálogo
          </Link>
        </div>

        {/* La mitad del alto que antes: mismo trazo a la mitad de ancho, sin deformar el corazón. */}
        <svg viewBox="-5 -5 278 56" className="mx-auto mt-12 h-auto w-full max-w-[44rem] overflow-visible" aria-hidden="true" focusable="false">
          <defs>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.6" />
            </filter>
          </defs>
          <g transform="translate(29.1 -127.42)">
            {/* Recorrido completo, apenas visible: anticipa hacia dónde va el trazo. */}
            <path d={TRACE} pathLength={1} fill="none" stroke="#1a2742" strokeWidth={1.5} strokeLinejoin="round" />
            <path className="trace-line" d={TRACE} pathLength={1} fill="none" stroke="#6ea8ff" strokeWidth={1.5} strokeLinejoin="round" />
            {/* Punta luminosa: un guion casi nulo con extremo redondo, desenfocado para dar brillo. */}
            <path
              className="trace-tip"
              d={TRACE}
              pathLength={1}
              fill="none"
              stroke="#48d6b0"
              strokeWidth={5}
              strokeLinecap="round"
              filter={`url(#${filterId})`}
            />
            <path className="trace-tip" d={TRACE} pathLength={1} fill="none" stroke="#f3f7ff" strokeWidth={2} strokeLinecap="round" />
          </g>
        </svg>
      </Container>
    </section>
  );
}
