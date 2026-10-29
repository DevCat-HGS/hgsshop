import { useNavigate } from "react-router-dom";
import { ArrowRightIcon } from "@/components/icons";

/** A dónde volver cuando no hay historial previo dentro del sitio (se entró directo por un enlace). */
function fallbackFor(pathname: string): string {
  const demo = pathname.match(/^\/demos\/([^/]+)/);
  if (demo) return `/productos/${demo[1]}`;
  if (pathname.startsWith("/productos/")) return "/productos";
  return "/";
}

/**
 * Vuelve a donde estaba la persona: un paso atrás en el historial, que conserva la posición de scroll
 * (ScrollRestoration en router.tsx). Si se llegó directo a esta página, va a su página padre.
 */
export function BackButton() {
  const navigate = useNavigate();

  // Se lee al hacer clic, no al renderizar: mientras carga la página siguiente, el botón aún muestra la
  // anterior y sus datos estarían desfasados. react-router guarda en history.state.idx la posición
  // dentro de las páginas del sitio.
  function goBack() {
    const canGoBack = (window.history.state?.idx ?? 0) > 0;
    if (canGoBack) navigate(-1);
    else navigate(fallbackFor(window.location.pathname));
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="press group inline-flex items-center gap-2 rounded-sm py-2 pr-3 text-[15px] font-semibold text-text-muted transition-colors hover:text-text"
    >
      <ArrowRightIcon className="size-4 rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
      Volver
    </button>
  );
}
