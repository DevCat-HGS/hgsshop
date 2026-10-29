import { BOOT_DONE_EVENT } from "@/hooks/useReveal";

/**
 * Retira el loader de arranque (index.html) cuando la app ya pintó y las fuentes están listas.
 *
 * MIN_VISIBLE_MS evita un parpadeo en conexiones rápidas: da tiempo a que la figura se ensamble.
 * Se mide desde el inicio de la navegación, así que en conexiones lentas no añade espera alguna.
 * Subirlo retrasa el contenido real para todo el mundo; conviene no pasar de ~2 s.
 */
const MIN_VISIBLE_MS = 1300;
const FONT_WAIT_LIMIT_MS = 1500;
const FADE_MS = 450;

export function dismissBootLoader(): void {
  const loader = document.getElementById("boot-loader");
  if (!loader) return;

  const fontsReady = Promise.race([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, FONT_WAIT_LIMIT_MS)),
  ]);
  const minimumElapsed = new Promise((resolve) => setTimeout(resolve, Math.max(0, MIN_VISIBLE_MS - performance.now())));

  Promise.all([fontsReady, minimumElapsed]).then(() => {
    loader.classList.add("boot-loader--done");
    window.dispatchEvent(new Event(BOOT_DONE_EVENT));
    loader.setAttribute("aria-hidden", "true");
    setTimeout(() => loader.remove(), FADE_MS);
  });
}
