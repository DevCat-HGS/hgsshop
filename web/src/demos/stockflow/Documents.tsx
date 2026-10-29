import type { ReactNode } from "react";
import { DAY_MS, formatMoney } from "@/demos/kit/format";
import { Btn } from "@/demos/kit/ui";
import { PURCHASE_LABELS, purchaseTotal, type Order, type PurchaseOrder, type Settings } from "./data";
import type { StockFlow } from "./store";

/*
 * Documentos imprimibles (orden de compra y remisión). Al imprimir solo queda el documento: en cada nivel se
 * ocultan los hermanos de la rama que lo contiene, en colores claros y tamaño carta.
 */
const PRINT_CSS = `
@media print {
  @page { size: letter; margin: 14mm; }
  *:has(.sf-doc) { display: block !important; height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; position: static !important; padding: 0 !important; margin: 0 !important; border: 0 !important; background: #fff !important; }
  *:has(.sf-doc) > :not(:has(.sf-doc)):not(.sf-doc) { display: none !important; }
  .sf-doc { max-width: none !important; border: 0 !important; padding: 0 !important; background: #fff !important; color: #111 !important; font-size: 10.5pt; }
  .sf-doc * { color: #111 !important; border-color: #bbb !important; background: transparent !important; box-shadow: none !important; }
  .sf-doc .sf-muted { color: #555 !important; }
  .sf-doc .sf-scroll { overflow: visible !important; }
  .sf-doc table { min-width: 0 !important; }
  .sf-doc thead th { background: #eee !important; }
  .sf-doc section, .sf-doc tr { break-inside: avoid; }
  .sf-no-print { display: none !important; }
  .sf-doc, .sf-doc * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

const longDate = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" });

/** Barra de acciones sobre el documento (no se imprime) y aviso si faltan datos del negocio. */
export function DocumentToolbar({
  settings,
  onBack,
  backLabel,
  canEditSettings,
  onOpenSettings,
  children,
}: {
  settings: Settings;
  onBack: () => void;
  backLabel: string;
  canEditSettings: boolean;
  onOpenSettings: () => void;
  children?: ReactNode;
}) {
  const missing = [!settings.nit && "NIT", !settings.address && "dirección", !settings.city && "ciudad", !settings.phone && "teléfono"].filter(Boolean);
  return (
    <div className="sf-no-print mb-4 flex flex-col gap-3">
      <style>{PRINT_CSS}</style>
      <div className="flex flex-wrap items-center gap-2">
        <Btn variant="ghost" onClick={onBack}>
          ← {backLabel}
        </Btn>
        <div className="flex flex-1 flex-wrap justify-end gap-2">
          {children}
          <Btn variant="primary" onClick={() => window.print()}>
            Imprimir
          </Btn>
        </div>
      </div>
      {missing.length > 0 && (
        <p className="rounded-md border border-warning/40 bg-warning-muted px-3 py-2 text-[13px] text-text">
          Faltan datos del negocio en el encabezado: {missing.join(", ")}.{" "}
          {canEditSettings ? (
            <button type="button" onClick={onOpenSettings} className="font-semibold text-text underline underline-offset-2">
              Completarlos en Ajustes
            </button>
          ) : (
            "Pide a Administración que los complete en Ajustes."
          )}
        </p>
      )}
    </div>
  );
}

function BusinessHeader({ settings, kind, number, date }: { settings: Settings; kind: string; number: string; date: number }) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="font-display text-xl text-text">{settings.name}</p>
        <p className="sf-muted text-[13px] text-text-muted">
          {settings.nit ? `NIT ${settings.nit}` : "NIT sin registrar"}
          {settings.address && <> · {settings.address}</>}
          {settings.city && <> · {settings.city}</>}
          {settings.phone && <> · Tel. {settings.phone}</>}
        </p>
      </div>
      <div className="shrink-0 sm:text-right">
        <p className="sf-muted text-[12px] font-semibold tracking-wide text-text-muted uppercase">{kind}</p>
        <p className="text-2xl font-semibold text-text tabular-nums">{number}</p>
        <p className="sf-muted text-[13px] text-text-muted">{longDate.format(date)}</p>
      </div>
    </header>
  );
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border py-1">
      <dt className="sf-muted shrink-0 text-text-muted">{label}</dt>
      <dd className="min-w-0 text-right break-words text-text">{children || "—"}</dd>
    </div>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1 pt-10">
      <div className="border-t border-border-strong" />
      <p className="sf-muted text-[12px] text-text-muted">{label}</p>
    </div>
  );
}

const docTable = "w-full text-left text-sm [&_td]:border-t [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_th]:px-2 [&_th]:py-1.5";

export function PurchaseOrderDocument({ store, po }: { store: StockFlow; po: PurchaseOrder }) {
  const { settings } = store;
  const supplier = store.supplierById.get(po.supplierId);
  const author = store.userById.get(po.createdBy)?.name ?? "—";
  const lead = supplier?.leadDays ?? 0;
  const expected = po.sentAt ? po.sentAt + lead * DAY_MS : null;
  const anyReceived = po.lines.some((l) => l.received > 0);
  const units = po.lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <article aria-label={`Orden de compra ${po.number}`} className="sf-doc mx-auto flex max-w-3xl flex-col gap-5 rounded-lg border border-border bg-bg p-4 text-sm sm:p-8">
      <BusinessHeader settings={settings} kind="Orden de compra" number={po.number} date={po.sentAt ?? po.createdAt} />
      {po.status === "draft" && (
        <p className="rounded-md border border-dashed border-border-strong px-3 py-2 text-center text-[13px] font-semibold text-text-muted">
          BORRADOR · todavía no se ha enviado al proveedor
        </p>
      )}
      {po.status === "cancelled" && (
        <p className="rounded-md border border-dashed border-border-strong px-3 py-2 text-center text-[13px] font-semibold text-text-muted">ORDEN CANCELADA</p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <section aria-label="Proveedor">
          <h4 className="mb-1 font-semibold text-text">Proveedor</h4>
          <dl>
            <Info label="Razón social">{supplier?.name ?? "Proveedor eliminado"}</Info>
            <Info label="NIT">{supplier?.nit}</Info>
            <Info label="Contacto">{supplier?.contact}</Info>
            <Info label="Teléfono">{supplier?.phone}</Info>
            <Info label="Correo">{supplier?.email}</Info>
          </dl>
        </section>
        <section aria-label="Condiciones">
          <h4 className="mb-1 font-semibold text-text">Condiciones</h4>
          <dl>
            <Info label="Estado">{PURCHASE_LABELS[po.status]}</Info>
            <Info label="Plazo de entrega">
              {lead} día{lead === 1 ? "" : "s"}
            </Info>
            <Info label="Entrega estimada">{expected ? longDate.format(expected) : "Al enviar la orden"}</Info>
            <Info label="Lugar de entrega">{[settings.address, settings.city].filter(Boolean).join(", ")}</Info>
            <Info label="Elaborada por">{author}</Info>
          </dl>
        </section>
      </div>

      <section aria-label="Productos">
        <div className="sf-scroll overflow-x-auto">
          <table aria-label={`Productos de la orden ${po.number}`} className={docTable} style={{ minWidth: anyReceived ? "38rem" : "32rem" }}>
            <thead className="text-[12px] text-text-muted">
              <tr>
                <th scope="col">SKU</th>
                <th scope="col">Producto</th>
                <th scope="col" className="text-right">
                  Cantidad
                </th>
                {anyReceived && (
                  <th scope="col" className="text-right">
                    Recibido
                  </th>
                )}
                <th scope="col" className="text-right">
                  Costo unit.
                </th>
                <th scope="col" className="text-right">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {po.lines.map((l) => {
                const p = store.productById.get(l.productId);
                return (
                  <tr key={l.productId}>
                    <td className="whitespace-nowrap tabular-nums">{p?.sku ?? "—"}</td>
                    <td>
                      {p?.name ?? "Producto eliminado"} <span className="sf-muted text-[12px] text-text-subtle">({p?.unit ?? "unidad"})</span>
                    </td>
                    <td className="text-right tabular-nums">{l.quantity}</td>
                    {anyReceived && <td className="text-right tabular-nums">{l.received}</td>}
                    <td className="text-right whitespace-nowrap tabular-nums">{formatMoney(l.cost)}</td>
                    <td className="text-right whitespace-nowrap tabular-nums">{formatMoney(l.cost * l.quantity)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-col items-end gap-0.5 tabular-nums">
          <p className="sf-muted text-[13px] text-text-muted">
            {po.lines.length} producto{po.lines.length === 1 ? "" : "s"} · {units} unidades
          </p>
          <p className="text-base font-semibold text-text">Total: {formatMoney(purchaseTotal(po))}</p>
          <p className="sf-muted text-[12px] text-text-subtle">Valores en pesos colombianos, antes de IVA.</p>
        </div>
      </section>

      {po.note && (
        <section aria-label="Observaciones">
          <h4 className="mb-1 font-semibold text-text">Observaciones</h4>
          <p className="whitespace-pre-wrap text-text">{po.note}</p>
        </section>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Signature label={`Autoriza: ${author}, ${settings.name}`} />
        <Signature label={`Acepta: ${supplier?.name ?? "Proveedor"}`} />
      </div>
      <footer className="sf-muted border-t border-border pt-3 text-[12px] text-text-subtle">
        Por favor cite el número {po.number} en la factura y en la remisión de entrega. Documento generado con StockFlow.
      </footer>
    </article>
  );
}

export function RemissionDocument({ store, order }: { store: StockFlow; order: Order }) {
  const { settings } = store;
  const dispatcherId = store.movements.find((m) => m.orderId === order.id)?.userId;
  const dispatcher = store.userById.get(dispatcherId ?? "")?.name ?? "—";
  const units = order.lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <article
      aria-label={`Remisión ${order.remission}`}
      className="sf-doc mx-auto flex max-w-3xl flex-col gap-5 rounded-lg border border-border bg-bg p-4 text-sm sm:p-8"
    >
      <BusinessHeader settings={settings} kind="Remisión de despacho" number={order.remission ?? "—"} date={order.closedAt ?? order.createdAt} />

      <div className="grid gap-5 sm:grid-cols-2">
        <section aria-label="Cliente">
          <h4 className="mb-1 font-semibold text-text">Cliente</h4>
          <dl>
            <Info label="Nombre">{order.customer}</Info>
            <Info label="Pedido">{order.number}</Info>
            <Info label="Indicaciones">{order.note}</Info>
          </dl>
        </section>
        <section aria-label="Despacho">
          <h4 className="mb-1 font-semibold text-text">Despacho</h4>
          <dl>
            <Info label="Fecha">{order.closedAt ? longDate.format(order.closedAt) : "—"}</Info>
            <Info label="Despachado por">{dispatcher}</Info>
            <Info label="Sale de">{[settings.address, settings.city].filter(Boolean).join(", ")}</Info>
          </dl>
        </section>
      </div>

      <section aria-label="Mercancía despachada">
        <div className="sf-scroll overflow-x-auto">
          <table aria-label={`Mercancía de la remisión ${order.remission}`} className={docTable} style={{ minWidth: "28rem" }}>
            <thead className="text-[12px] text-text-muted">
              <tr>
                <th scope="col">SKU</th>
                <th scope="col">Producto</th>
                <th scope="col">Unidad</th>
                <th scope="col" className="text-right">
                  Cantidad
                </th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((l) => {
                const p = store.productById.get(l.productId);
                return (
                  <tr key={l.productId}>
                    <td className="whitespace-nowrap tabular-nums">{p?.sku ?? "—"}</td>
                    <td>{p?.name ?? "Producto eliminado"}</td>
                    <td>{p?.unit ?? "unidad"}</td>
                    <td className="text-right tabular-nums">{l.quantity}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-right font-semibold text-text tabular-nums">
          Total: {units} unidades en {order.lines.length} referencia{order.lines.length === 1 ? "" : "s"}
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <Signature label={`Entrega: ${dispatcher}`} />
        <Signature label="Recibe a satisfacción: nombre, C.C. y fecha" />
      </div>
      <footer className="sf-muted border-t border-border pt-3 text-[12px] text-text-subtle">
        Este documento no es una factura de venta. Revise la mercancía al recibirla; los reclamos se atienden dentro de los 3 días siguientes. Documento
        generado con StockFlow.
      </footer>
    </article>
  );
}
