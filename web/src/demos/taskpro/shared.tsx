import type { ReactNode } from "react";

/** Estado vacío con la acción para empezar (crear o importar), en lugar de una tabla en blanco. */
export function EmptyState({ title, children, actions }: { title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong bg-bg px-4 py-8 text-center">
      <p className="text-base font-semibold text-text">{title}</p>
      {children && <div className="max-w-md text-sm text-text-muted">{children}</div>}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * Al imprimir solo queda el documento (`.tp-doc`), en colores claros y tamaño carta: en cada nivel se ocultan los
 * hermanos de la rama que lo contiene. Mismo patrón que los reportes de RoboAcademy.
 */
const PRINT_CSS = `
.tp-print-only { display: none; }
@media print {
  @page { size: letter; margin: 14mm; }
  *:has(.tp-doc) { display: block !important; height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; position: static !important; padding: 0 !important; border: 0 !important; background: #fff !important; }
  *:has(.tp-doc) > :not(:has(.tp-doc)):not(.tp-doc) { display: none !important; }
  .tp-doc { max-width: none !important; border: 0 !important; padding: 0 !important; background: #fff !important; color: #111 !important; font-size: 10.5pt; }
  .tp-doc * { color: #111 !important; border-color: #bbb !important; background: transparent !important; box-shadow: none !important; }
  .tp-doc .tp-muted { color: #555 !important; }
  .tp-doc .tp-stamp { color: #a11 !important; border-color: #a11 !important; }
  .tp-doc .tp-scroll { overflow: visible !important; }
  .tp-doc table { min-width: 0 !important; }
  .tp-doc section, .tp-doc tr { break-inside: avoid; }
  .tp-no-print { display: none !important; }
  .tp-print-only { display: block !important; }
}
`;

export function PrintStyle() {
  return <style>{PRINT_CSS}</style>;
}
