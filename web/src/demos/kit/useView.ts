import { useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Pantalla actual de la demo. A pantalla completa vive en `?vista=` (se puede compartir, y Atrás vuelve a la
 * pantalla anterior); incrustada usa estado local para no ensuciar la URL de la portada.
 */
export function useView<V extends string>(views: readonly V[], fallback: V, embedded = false): [V, (view: V) => void] {
  const [params, setParams] = useSearchParams();
  const [local, setLocal] = useState<V>(fallback);
  if (embedded) return [local, setLocal];

  const raw = params.get("vista");
  const current = views.includes(raw as V) ? (raw as V) : fallback;
  return [
    current,
    (view) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (view === fallback) next.delete("vista");
        else next.set("vista", view);
        return next;
      }),
  ];
}
