import type { ReactNode } from "react";

export type SlideTone = "ground" | "surface" | "depth" | "accent" | "paper";

// Cada diapositiva es un campo de color completo, de borde a borde: las secciones se distinguen por un
// escalón de tono, no por cajas ni líneas. "ground" deja ver el fondo atmosférico del sitio.
const tones: Record<SlideTone, string> = {
  ground: "bg-transparent text-text",
  surface: "bg-surface text-text",
  depth: "bg-depth text-text",
  accent: "bg-brand text-brand-contrast",
  // Papel: la franja clara que corta el azul (tokens en index.css, `.tone-paper`).
  paper: "tone-paper",
};

/**
 * Una sección de la portada a pantalla completa (menos la barra superior). En escritorio la portada
 * encaja cada diapositiva al hacer scroll (ver `useSlideDeck`); en móvil el scroll es libre.
 */
export function Slide({
  id,
  tone = "ground",
  labelledBy,
  className = "",
  children,
}: {
  id: string;
  tone?: SlideTone;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      data-slide
      className={`relative flex min-h-[calc(100svh-4rem)] snap-start flex-col justify-center py-20 lg:py-24 ${tones[tone]} ${className}`}
    >
      {children}
    </section>
  );
}
