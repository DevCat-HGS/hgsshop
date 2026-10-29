import { useEffect } from "react";

const HEADER_HEIGHT = 64;

/**
 * Activa el modo diapositivas mientras la página que lo usa está montada: cada sección `snap-start`
 * encaja al hacer scroll y el footer (`snap-end`) pide un scroll más tras la última. Es CSS nativo
 * (scroll-snap): no se intercepta la rueda ni el teclado. Las reglas están en index.css y solo aplican
 * en pantallas grandes.
 *
 * Si en la pantalla actual alguna sección no cabe entera, el encaje obligatorio dejaría parte de su
 * contenido sin poder verse en reposo; en ese caso se usa encaje por proximidad (`slide-deck-soft`).
 */
export function useSlideDeck() {
  useEffect(() => {
    const root = document.documentElement;

    const evaluate = () => {
      const available = window.innerHeight - HEADER_HEIGHT;
      const slides = document.querySelectorAll<HTMLElement>("[data-slide]");
      const allFit = [...slides].every((slide) => slide.offsetHeight <= available + 1);
      root.classList.toggle("slide-deck", allFit);
      root.classList.toggle("slide-deck-soft", !allFit);
    };

    evaluate();
    const observer = new ResizeObserver(evaluate);
    document.querySelectorAll("[data-slide]").forEach((slide) => observer.observe(slide));
    window.addEventListener("resize", evaluate);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", evaluate);
      root.classList.remove("slide-deck", "slide-deck-soft");
    };
  }, []);
}
