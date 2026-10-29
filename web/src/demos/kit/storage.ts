import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Las demos guardan sus datos solo en el navegador de quien las usa (localStorage), bajo el prefijo
 * `hgs-demo:<slug>:`. Nada sale del dispositivo. Si el almacenamiento no está disponible (modo privado,
 * cuota llena), la demo sigue funcionando en memoria y se reinicia al recargar.
 */
const PREFIX = "hgs-demo:";

/** Evento de ventana que se emite cada vez que una demo guarda un cambio hecho por quien la usa. */
export const DEMO_CHANGE_EVENT = "hgs-demo:change";

/**
 * Preferencias de la página de demo (recorrido visto, aviso cerrado). Prefijo aparte para que "Reiniciar
 * datos" no las borre: reiniciar no debe volver a mostrar el recorrido.
 */
export function readUiFlag(name: string) {
  try {
    return window.localStorage.getItem(`hgs-demo-ui:${name}`) === "1";
  } catch {
    return false;
  }
}

export function setUiFlag(name: string) {
  try {
    window.localStorage.setItem(`hgs-demo-ui:${name}`, "1");
  } catch {
    // Sin almacenamiento: se volverá a mostrar en la próxima visita.
  }
}

export function storageKey(slug: string, name: string) {
  return `${PREFIX}${slug}:${name}`;
}

function read<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

function write(key: string, json: string) {
  try {
    window.localStorage.setItem(key, json);
  } catch {
    // Sin almacenamiento: el estado sigue vivo en memoria.
  }
}

/** Borra todos los datos guardados de una demo; la página la vuelve a montar con los datos de ejemplo. */
export function clearDemoData(slug: string) {
  try {
    const prefix = `${PREFIX}${slug}:`;
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(prefix)) window.localStorage.removeItem(key);
    }
  } catch {
    // Nada que borrar.
  }
}

/**
 * Como `useState`, pero persistido. `seed` se llama solo la primera vez (o tras reiniciar la demo), así
 * que puede generar fechas relativas a hoy. Al cambiar la forma de los datos, sube la versión en `name`
 * (p. ej. "productos.v2") para no leer datos viejos incompatibles.
 */
export function usePersistentState<T>(slug: string, name: string, seed: () => T): [T, Dispatch<SetStateAction<T>>] {
  const key = storageKey(slug, name);
  const [state, setState] = useState<T>(() => read<T>(key) ?? seed());
  const lastWritten = useRef<string | null>(null);
  // También en el primer render: así los datos de ejemplo quedan fijados y sus fechas no se mueven.
  useEffect(() => {
    const json = JSON.stringify(state);
    // Se compara el contenido, no la referencia: StrictMode repite efectos y algunas apps normalizan su estado
    // al montar sin cambiar nada. Ninguna de esas escrituras es una acción de quien prueba la demo.
    if (json === lastWritten.current) return;
    write(key, json);
    if (lastWritten.current !== null) window.dispatchEvent(new CustomEvent(DEMO_CHANGE_EVENT, { detail: { slug } }));
    lastWritten.current = json;
  }, [key, slug, state]);

  return [state, setState];
}

/** Identificador corto y único dentro de la demo. */
export function uid(prefix = "id") {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

/** Devuelve una función estable que actualiza un elemento de una lista por `id`. */
export function useListUpdater<T extends { id: string }>(setList: Dispatch<SetStateAction<T[]>>) {
  return useCallback(
    (id: string, change: Partial<T> | ((item: T) => T)) =>
      setList((current) => current.map((item) => (item.id === id ? (typeof change === "function" ? change(item) : { ...item, ...change }) : item))),
    [setList],
  );
}
