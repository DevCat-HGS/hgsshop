import type { ReactNode } from "react";
import { formatPhone, type Settings } from "./data";

/*
 * Documentos imprimibles (reporte para acudientes y recibo de caja). Al imprimir solo queda el documento: en cada
 * nivel se ocultan los hermanos de la rama que lo contiene, y el documento sale en colores claros y tamaño carta.
 */
export const PRINT_CSS = `
.ra-print-only { display: none; }
@media print {
  @page { size: letter; margin: 14mm; }
  *:has(.ra-doc) { display: block !important; height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; position: static !important; padding: 0 !important; margin: 0 !important; border: 0 !important; background: #fff !important; box-shadow: none !important; }
  *:has(.ra-doc) > :not(:has(.ra-doc)):not(.ra-doc) { display: none !important; }
  .ra-doc { max-width: none !important; border: 0 !important; padding: 0 !important; background: #fff !important; color: #111 !important; font-size: 11pt; }
  .ra-doc * { color: #111 !important; border-color: #ccc !important; background: transparent !important; box-shadow: none !important; }
  .ra-doc .ra-muted { color: #555 !important; }
  .ra-doc .ra-step-done { background: #2f7d4f !important; }
  .ra-doc .ra-step-current { background: #3fb27a !important; }
  .ra-doc .ra-step-todo { background: #ddd !important; }
  .ra-doc .ra-box { border: 1px solid #999 !important; }
  .ra-doc section { break-inside: avoid; }
  .ra-no-print { display: none !important; }
  .ra-print-only { display: block !important; }
  .ra-doc, .ra-doc * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

/** Encabezado con los datos de la academia (de Ajustes). */
export function DocHeader({ settings, kind, children }: { settings: Settings; kind: string; children?: ReactNode }) {
  const contact = [settings.address, settings.city].filter(Boolean).join(", ");
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
      <div className="min-w-0">
        <p className="font-display text-xl text-text">{settings.name}</p>
        <p className="ra-muted text-[12px] text-text-muted">
          {settings.nit && <>NIT {settings.nit}</>}
          {settings.nit && contact && " · "}
          {contact}
          {settings.phone && <> · Tel. {formatPhone(settings.phone)}</>}
        </p>
        <p className="ra-muted mt-2 text-[13px] font-semibold tracking-wide text-text-muted uppercase">{kind}</p>
      </div>
      {children}
    </header>
  );
}

/** Pie con el texto de Ajustes. */
export function DocFooter({ settings, extra }: { settings: Settings; extra?: string }) {
  return (
    <footer className="ra-muted border-t border-border pt-3 text-[12px] text-text-subtle">
      {settings.footer && <p className="whitespace-pre-wrap">{settings.footer}</p>}
      <p className={settings.footer ? "mt-1" : undefined}>
        {settings.name} · Documento generado con RoboAcademy.{extra ? ` ${extra}` : ""}
      </p>
    </footer>
  );
}
