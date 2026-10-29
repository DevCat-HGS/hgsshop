import { useEffect, useState } from "react";

/** Mensaje breve tras una acción ("Producto guardado"). Desaparece solo y se anuncia a lectores de pantalla. */
export function useToast() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 3500);
    return () => window.clearTimeout(timer);
  }, [message]);

  const toast = (
    <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50">
      {message && <p className="rounded-md bg-text px-4 py-2.5 text-sm font-semibold text-bg shadow-[var(--shadow-float)]">{message}</p>}
    </div>
  );
  return { notify: setMessage, toast };
}
