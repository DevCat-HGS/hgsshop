import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export const BOOT_DONE_EVENT = "hgs:boot-done";
const STAGGER_MS = 70;

/**
 * Entrada escalonada de las partes de cada sección (`data-reveal`): suben unos píxeles con un fundido
 * la primera vez que entran en pantalla. La clase `reveal-ready` se pone antes del primer pintado y solo
 * desde JavaScript: si el script no corre, nada queda oculto. Mientras el loader de arranque está en
 * pantalla se espera a que se retire, para que la entrada de la portada se vea en vez de ocurrir debajo.
 * Las reglas (y la versión con movimiento reducido, solo fundido) están en index.css.
 */
export function useReveal() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-ready");

    const reveal = (element: Element) => element.classList.add("is-revealed");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    // Cada parte espera según su orden dentro de su sección: título, texto, fragmento…
    // Registro local a esta ejecución (no en el DOM): si React monta el efecto dos veces, la segunda
    // vuelve a observar todo en lugar de saltarse lo que la primera ya había marcado.
    const watched = new WeakSet<Element>();
    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-revealed)").forEach((element) => {
        if (watched.has(element)) return;
        watched.add(element);
        const group = element.closest("section, main") ?? document.body;
        const index = [...group.querySelectorAll("[data-reveal]")].indexOf(element);
        element.style.setProperty("--reveal-delay", `${Math.min(index, 8) * STAGGER_MS}ms`);
        observer.observe(element);
      });
    };

    // Las páginas se cargan bajo demanda: hay que observar también lo que aparece después.
    const mutations = new MutationObserver(scan);
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      scan();
      mutations.observe(document.body, { childList: true, subtree: true });
    };

    const loader = document.getElementById("boot-loader");
    // Con movimiento reducido el loader no se muestra (display: none): no hay nada que esperar.
    const loaderVisible = loader && !loader.classList.contains("boot-loader--done") && getComputedStyle(loader).display !== "none";
    if (loaderVisible) {
      window.addEventListener(BOOT_DONE_EVENT, start, { once: true });
    } else {
      start();
    }

    return () => {
      window.removeEventListener(BOOT_DONE_EVENT, start);
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);
}
