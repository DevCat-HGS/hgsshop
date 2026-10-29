import { useState } from "react";
import { downloadCsv } from "@/demos/kit/csv";
import { formatDate, formatDateTime, formatMoney, matches } from "@/demos/kit/format";
import { Btn, ConfirmButton, Dialog, Empty, Field, FormError, inputClass, Pill, SearchField, Table } from "@/demos/kit/ui";
import {
  OPEN_PURCHASE,
  PURCHASE_LABELS,
  PURCHASE_TONES,
  purchaseSuggestion,
  purchaseTotal,
  weightedCost,
  type PurchaseOrder,
  type PurchaseStatus,
  type SuggestionRow,
} from "./data";
import { EmptyState, PermBtn, RoleNote, Toolbar } from "./common";
import { DocumentToolbar, PurchaseOrderDocument } from "./Documents";
import type { StockFlow } from "./store";

export type PurchaseTab = "sugerencia" | "ordenes";

/** null = cerrado; "new" = crear; una orden = editar su borrador. */
export type PurchaseEditing = null | "new" | PurchaseOrder;

const units = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));

export function Purchases({
  store,
  notify,
  tab,
  setTab,
  onOpen,
  onNewProduct,
  onSettings,
}: {
  store: StockFlow;
  notify: (m: string) => void;
  tab: PurchaseTab;
  setTab: (t: PurchaseTab) => void;
  onOpen: (id: string) => void;
  onNewProduct: () => void;
  onSettings: () => void;
}) {
  const tabs: { id: PurchaseTab; label: string }[] = [
    { id: "sugerencia", label: "Sugerencia de compra" },
    { id: "ordenes", label: "Órdenes de compra" },
  ];
  return (
    <div>
      <RoleNote store={store} permissions={["purchase.manage", "purchase.receive"]} />
      <div role="tablist" aria-label="Compras" className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`sf-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`sf-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm whitespace-nowrap ${
              tab === t.id ? "border-brand font-semibold text-text" : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`sf-panel-${tab}`} aria-labelledby={`sf-tab-${tab}`}>
        {tab === "sugerencia" ? (
          <Suggestion store={store} notify={notify} onOpen={onOpen} onNewProduct={onNewProduct} onSettings={onSettings} />
        ) : (
          <PurchaseList store={store} onOpen={onOpen} />
        )}
      </div>
    </div>
  );
}

function Suggestion({
  store,
  notify,
  onOpen,
  onNewProduct,
  onSettings,
}: {
  store: StockFlow;
  notify: (m: string) => void;
  onOpen: (id: string) => void;
  onNewProduct: () => void;
  onSettings: () => void;
}) {
  const [now] = useState(() => Date.now());
  const coverage = store.settings.coverageDays;
  const rows = purchaseSuggestion(store.products, store.movements, store.purchases, store.suppliers, coverage, now);

  const groups = new Map<string, SuggestionRow[]>();
  for (const r of rows) {
    const key = store.supplierById.has(r.product.supplierId) ? r.product.supplierId : "";
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const ordered = [...groups.entries()].sort(([a], [b]) => {
    if (!a) return 1;
    if (!b) return -1;
    return (store.supplierById.get(a)?.name ?? "").localeCompare(store.supplierById.get(b)?.name ?? "", "es");
  });

  function create(supplierId: string, items: SuggestionRow[]) {
    const { error, id } = store.savePurchase({
      supplierId,
      note: "",
      lines: items.map((r) => ({ productId: r.product.id, quantity: r.quantity, cost: r.product.cost })),
    });
    if (error || !id) {
      notify(error ?? "No se pudo crear la orden");
      return;
    }
    notify(`Orden de compra creada en borrador para ${store.supplierById.get(supplierId)?.name}`);
    onOpen(id);
  }

  function exportCsv() {
    downloadCsv(
      "stockflow-sugerencia-compra",
      ["Proveedor", "Producto", "SKU", "Stock", "Mínimo", "Consumo diario", "Plazo (días)", "Cobertura (días)", "Ya pedido", "Sugerido", "Costo estimado (COP)"],
      rows.map((r) => [
        store.supplierById.get(r.product.supplierId)?.name ?? "Sin proveedor",
        r.product.name,
        r.product.sku,
        r.product.stock,
        r.product.min,
        r.daily.toFixed(2).replace(".", ","),
        r.leadDays,
        coverage,
        r.onOrder,
        r.quantity,
        r.quantity * r.product.cost,
      ]),
    );
  }

  const explanation = (
    <p className="text-[13px] text-text-muted">
      Sugerido = consumo diario de los últimos 30 días × (plazo del proveedor + {coverage} días de cobertura) + mínimo − stock − lo ya pedido en órdenes
      abiertas.{" "}
      {store.can("settings.manage") ? (
        <button type="button" onClick={onSettings} className="font-semibold text-text underline underline-offset-2">
          Cambiar días de cobertura
        </button>
      ) : (
        "Los días de cobertura se cambian en Ajustes."
      )}
    </p>
  );

  if (store.products.filter((p) => !p.archived).length === 0)
    return (
      <EmptyState
        title="Aún no hay productos que reponer"
        actions={
          <PermBtn store={store} permission="product.edit" variant="primary" onClick={onNewProduct}>
            Nuevo producto
          </PermBtn>
        }
      >
        La sugerencia de compra se calcula con el consumo de cada producto, su mínimo y el plazo de su proveedor habitual. Crea o importa tus productos para
        empezar.
      </EmptyState>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        {explanation}
        <Btn size="sm" className="shrink-0" aria-label="Exportar sugerencia de compra a CSV" disabled={rows.length === 0} onClick={exportCsv}>
          Exportar CSV
        </Btn>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-bg">
          <Empty>Nada que comprar por ahora: el stock y lo ya pedido cubren el consumo esperado.</Empty>
        </div>
      ) : (
        ordered.map(([supplierId, items]) => {
          const supplier = store.supplierById.get(supplierId);
          const title = supplier?.name ?? "Sin proveedor habitual";
          const total = items.reduce((s, r) => s + r.quantity * r.product.cost, 0);
          return (
            <section key={supplierId || "none"} aria-label={`Sugerencia para ${title}`} className="rounded-lg border border-border bg-bg">
              <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-text">{title}</h3>
                  <p className="text-[12px] text-text-subtle tabular-nums">
                    {supplier
                      ? `Plazo ${supplier.leadDays} día${supplier.leadDays === 1 ? "" : "s"} · ${items.length} producto${items.length === 1 ? "" : "s"} · costo estimado ${formatMoney(total)}`
                      : "Asigna un proveedor habitual a estos productos (en Productos, Editar) para poder pedirlos."}
                  </p>
                </div>
                {supplier && (
                  <PermBtn
                    store={store}
                    permission="purchase.manage"
                    variant="primary"
                    size="sm"
                    aria-label={`Crear orden de compra para "${supplier.name}"`}
                    onClick={() => create(supplier.id, items)}
                  >
                    Crear orden de compra
                  </PermBtn>
                )}
              </div>
              <div className="overflow-x-auto">
                <table aria-label={`Productos sugeridos de ${title}`} className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="text-[13px] text-text-muted">
                    <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold">
                      <th scope="col">Producto</th>
                      <th scope="col">Stock</th>
                      <th scope="col">Mínimo</th>
                      <th scope="col">Consumo diario</th>
                      <th scope="col">Ya pedido</th>
                      <th scope="col">Sugerido</th>
                    </tr>
                  </thead>
                  <tbody className="[&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 [&>tr]:border-t [&>tr]:border-border">
                    {items.map((r) => (
                      <tr key={r.product.id}>
                        <th scope="row" className="font-normal text-text">
                          {r.product.name}
                          <span className="block text-[12px] text-text-subtle">{r.product.sku}</span>
                        </th>
                        <td className="tabular-nums">{r.product.stock}</td>
                        <td className="tabular-nums">{r.product.min}</td>
                        <td className="tabular-nums text-text-muted">{units(Math.round(r.daily * 10) / 10)} / día</td>
                        <td className="tabular-nums text-text-muted">{r.onOrder || "—"}</td>
                        <td className="font-semibold tabular-nums">
                          {r.quantity} <span className="text-[12px] font-normal text-text-subtle">{r.product.unit}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

function PurchaseList({ store, onOpen }: { store: StockFlow; onOpen: (id: string) => void }) {
  const [status, setStatus] = useState<"" | "open" | PurchaseStatus>("");
  const [query, setQuery] = useState("");
  const rows = store.purchases
    .filter((po) => !status || (status === "open" ? OPEN_PURCHASE.includes(po.status) : po.status === status))
    .filter((po) => !query || matches(`${po.number} ${store.supplierById.get(po.supplierId)?.name ?? ""}`, query))
    .sort((a, b) => b.createdAt - a.createdAt);

  function exportCsv() {
    downloadCsv(
      "stockflow-ordenes-compra",
      ["Orden", "Proveedor", "Estado", "Líneas", "Total (COP)", "Creada", "Enviada", "Cerrada", "Creada por"],
      rows.map((po) => [
        po.number,
        store.supplierById.get(po.supplierId)?.name ?? "",
        PURCHASE_LABELS[po.status],
        po.lines.length,
        purchaseTotal(po),
        formatDateTime(po.createdAt),
        po.sentAt ? formatDateTime(po.sentAt) : "",
        po.closedAt ? formatDateTime(po.closedAt) : "",
        store.userById.get(po.createdBy)?.name ?? "",
      ]),
    );
  }

  if (store.purchases.length === 0)
    return (
      <EmptyState title="Aún no hay órdenes de compra">
        Crea la primera desde la pestaña Sugerencia de compra (una por proveedor) o con el botón "Nueva orden de compra".
      </EmptyState>
    );

  return (
    <div>
      <Toolbar>
        <SearchField value={query} onChange={setQuery} label="Buscar órdenes de compra" placeholder="Número o proveedor…" />
        <select
          aria-label="Filtrar órdenes por estado"
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | "open" | PurchaseStatus)}
          className={`${inputClass} sm:w-52`}
        >
          <option value="">Todos los estados</option>
          <option value="open">Abiertas</option>
          {(Object.keys(PURCHASE_LABELS) as PurchaseStatus[]).map((s) => (
            <option key={s} value={s}>
              {PURCHASE_LABELS[s]}
            </option>
          ))}
        </select>
        <Btn size="sm" className="sm:ml-auto sm:self-center" aria-label="Exportar órdenes de compra a CSV" disabled={rows.length === 0} onClick={exportCsv}>
          Exportar CSV
        </Btn>
      </Toolbar>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-bg">
          <Empty>No hay órdenes con esos filtros.</Empty>
        </div>
      ) : (
        <Table
          label="Órdenes de compra"
          head={[
            "Orden",
            "Proveedor",
            "Fecha",
            "Productos",
            "Total",
            "Estado",
            <span key="acciones" className="relative">
              <span className="sr-only">Acciones</span>
            </span>,
          ]}
          minWidth="48rem"
        >
          {rows.map((po) => (
            <tr key={po.id}>
              <th scope="row" className="font-semibold whitespace-nowrap text-text tabular-nums">
                {po.number}
              </th>
              <td>{store.supplierById.get(po.supplierId)?.name ?? "Proveedor eliminado"}</td>
              <td className="whitespace-nowrap text-text-muted tabular-nums">{formatDate(po.sentAt ?? po.createdAt)}</td>
              <td className="text-text-muted tabular-nums">
                {po.lines.length} línea{po.lines.length === 1 ? "" : "s"}
              </td>
              <td className="font-semibold tabular-nums">{formatMoney(purchaseTotal(po))}</td>
              <td>
                <Pill tone={PURCHASE_TONES[po.status]}>{PURCHASE_LABELS[po.status]}</Pill>
              </td>
              <td className="text-right">
                <Btn variant="ghost" size="sm" aria-label={`Ver orden de compra ${po.number}`} onClick={() => onOpen(po.id)}>
                  Ver
                </Btn>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

/** Pantalla de una orden de compra: acciones según estado y rol, historial de recepciones y el documento imprimible. */
export function PurchaseDetail({
  store,
  po,
  notify,
  onBack,
  onEdit,
  onSettings,
}: {
  store: StockFlow;
  po: PurchaseOrder;
  notify: (m: string) => void;
  onBack: () => void;
  onEdit: (po: PurchaseOrder) => void;
  onSettings: () => void;
}) {
  const [receiving, setReceiving] = useState(false);
  const [error, setError] = useState("");
  const manage = store.can("purchase.manage");
  const receive = store.can("purchase.receive");
  const open = OPEN_PURCHASE.includes(po.status);

  function run(result: string | null, message: string) {
    if (result) setError(result);
    else {
      setError("");
      notify(message);
    }
  }

  return (
    <div>
      <DocumentToolbar
        settings={store.settings}
        onBack={onBack}
        backLabel="Órdenes de compra"
        canEditSettings={store.can("settings.manage")}
        onOpenSettings={onSettings}
      >
        {po.status === "draft" && manage && <Btn onClick={() => onEdit(po)}>Editar</Btn>}
        {open && manage && (
          <ConfirmButton
            label="Cancelar orden"
            size="md"
            title={`Cancelar ${po.number}`}
            confirmLabel="Cancelar orden"
            message={
              po.status === "partial"
                ? "Lo que ya se recibió queda en el inventario; el saldo pendiente deja de contar como pedido."
                : "La orden queda cancelada y deja de contar como pedido en la sugerencia de compra."
            }
            onConfirm={() => run(store.cancelPurchase(po.id), `Orden ${po.number} cancelada`)}
          />
        )}
        {po.status === "draft" && (
          <PermBtn store={store} permission="purchase.manage" variant="primary" onClick={() => run(store.sendPurchase(po.id), `Orden ${po.number} enviada al proveedor`)}>
            Marcar como enviada
          </PermBtn>
        )}
        {(po.status === "sent" || po.status === "partial") && (
          <PermBtn store={store} permission="purchase.receive" variant="primary" onClick={() => setReceiving(true)}>
            Recibir mercancía
          </PermBtn>
        )}
      </DocumentToolbar>
      <div className="sf-no-print mb-4 flex flex-col gap-2">
        <p className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          <Pill tone={PURCHASE_TONES[po.status]}>{PURCHASE_LABELS[po.status]}</Pill>
          {po.status === "draft" && (manage ? "Revisa cantidades y costos, imprímela o envíala por correo, y márcala como enviada." : "Administración debe enviarla.")}
          {(po.status === "sent" || po.status === "partial") &&
            (receive ? "Cuando llegue la mercancía, registra lo recibido por línea." : "Bodega registra la mercancía cuando llegue.")}
        </p>
        <FormError>{error}</FormError>
        {po.receipts.length > 0 && (
          <section aria-label="Recepciones" className="rounded-lg border border-border bg-bg p-3 text-sm">
            <h3 className="mb-1 font-semibold text-text">Recepciones</h3>
            <ul className="flex flex-col gap-1 text-text-muted">
              {po.receipts.map((r, i) => (
                <li key={i}>
                  {formatDateTime(r.at)} · {store.userById.get(r.userId)?.name ?? "—"}:{" "}
                  {r.lines.map((l) => `${l.quantity} × ${store.productById.get(l.productId)?.name ?? "producto"}`).join(", ")}
                  {r.note && ` (${r.note})`}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <PurchaseOrderDocument store={store} po={po} />
      <ReceiveDialog store={store} po={receiving ? po : null} onClose={() => setReceiving(false)} notify={notify} />
    </div>
  );
}

function ReceiveDialog({ store, po, onClose, notify }: { store: StockFlow; po: PurchaseOrder | null; onClose: () => void; notify: (m: string) => void }) {
  const init = () => Object.fromEntries((po?.lines ?? []).map((l) => [l.productId, String(l.quantity - l.received)]));
  const [qty, setQty] = useState<Record<string, string>>(init);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [last, setLast] = useState(po?.id);
  if (po?.id !== last) {
    setLast(po?.id);
    setQty(init());
    setNote("");
    setError("");
  }

  function submit() {
    if (!po) return;
    const quantities: Record<string, number> = {};
    for (const l of po.lines) {
      const raw = (qty[l.productId] ?? "").trim();
      quantities[l.productId] = raw === "" ? 0 : Number(raw);
    }
    const result = store.receivePurchase(po.id, quantities, note);
    if (result) {
      setError(result);
      return;
    }
    const total = Object.values(quantities).reduce((s, n) => s + n, 0);
    notify(`Recibidas ${total} unidades de ${po.number}`);
    onClose();
  }

  return (
    <Dialog open={po !== null} onClose={onClose} title={po ? `Recibir mercancía de ${po.number}` : "Recibir mercancía"} onSubmit={submit} submitLabel="Registrar recepción" wide>
      {po && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            Escribe lo que llegó de cada producto (0 si no llegó). Cada línea genera una entrada al inventario y actualiza el costo promedio ponderado.
          </p>
          <ul className="flex flex-col gap-3">
            {po.lines.map((l) => {
              const p = store.productById.get(l.productId);
              const remaining = l.quantity - l.received;
              const n = Number(qty[l.productId]);
              const preview = p && Number.isInteger(n) && n > 0 && n <= remaining ? weightedCost(p.stock, p.cost, n, l.cost) : null;
              return (
                <li key={l.productId} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_8rem] sm:items-end">
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-text">{p?.name ?? "Producto eliminado"}</p>
                    <p className="text-[12px] text-text-subtle tabular-nums">
                      Pedido {l.quantity} · recibido {l.received} · faltan {remaining} · {formatMoney(l.cost)} c/u
                    </p>
                    {p && (
                      <p className="text-[12px] text-text-subtle tabular-nums">
                        Stock {p.stock} · costo promedio {formatMoney(p.cost)}
                        {preview !== null && ` → ${formatMoney(preview)}`}
                      </p>
                    )}
                  </div>
                  <Field label={`Recibido de "${p?.name ?? "producto"}"`}>
                    {(id) => (
                      <input
                        id={id}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        disabled={remaining === 0}
                        value={qty[l.productId] ?? ""}
                        onChange={(e) => setQty((q) => ({ ...q, [l.productId]: e.target.value }))}
                        className={inputClass}
                      />
                    )}
                  </Field>
                </li>
              );
            })}
          </ul>
          <Field label="Factura o remisión del proveedor" hint="Opcional. Queda en la nota de cada entrada.">
            {(id) => <input id={id} value={note} onChange={(e) => setNote(e.target.value)} maxLength={60} className={inputClass} />}
          </Field>
          <p className="text-[12px] text-text-subtle">Recibe: {store.currentUser.name}</p>
          <FormError>{error}</FormError>
        </div>
      )}
    </Dialog>
  );
}

interface LineForm {
  key: number;
  productId: string;
  quantity: string;
  cost: string;
}

let lineKey = 0;
const newLine = (productId = "", quantity = "1", cost = ""): LineForm => ({ key: ++lineKey, productId, quantity, cost });

/** Crear una orden a mano o editar un borrador. */
export function PurchaseForm({
  store,
  editing,
  onClose,
  notify,
  onSaved,
}: {
  store: StockFlow;
  editing: PurchaseEditing;
  onClose: () => void;
  notify: (m: string) => void;
  onSaved: (id: string) => void;
}) {
  const po = editing && editing !== "new" ? editing : null;
  const init = () => ({
    supplierId: po?.supplierId ?? "",
    note: po?.note ?? "",
    lines: po ? po.lines.map((l) => newLine(l.productId, String(l.quantity), String(l.cost))) : [newLine()],
  });
  const [form, setForm] = useState(init);
  const [error, setError] = useState("");
  const [last, setLast] = useState<PurchaseEditing>(editing);
  if (editing !== last) {
    setLast(editing);
    setForm(init());
    setError("");
  }

  const products = store.products.filter((p) => !p.archived).sort((a, b) => a.name.localeCompare(b.name, "es"));
  const own = products.filter((p) => form.supplierId && p.supplierId === form.supplierId);
  const others = products.filter((p) => !form.supplierId || p.supplierId !== form.supplierId);
  const suppliers = [...store.suppliers].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const total = form.lines.reduce((s, l) => s + (Number(l.cost) || 0) * (Number(l.quantity) || 0), 0);

  const updateLine = (key: number, change: Partial<LineForm>) => setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.key === key ? { ...l, ...change } : l)) }));

  function submit() {
    const { error: result, id } = store.savePurchase(
      {
        supplierId: form.supplierId,
        note: form.note,
        lines: form.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity.trim() === "" ? NaN : Number(l.quantity),
          cost: l.cost.trim() === "" ? NaN : Number(l.cost),
        })),
      },
      po?.id,
    );
    if (result || !id) {
      setError(result ?? "No se pudo guardar la orden.");
      return;
    }
    notify(po ? `Orden ${po.number} actualizada` : "Orden de compra creada en borrador");
    onClose();
    onSaved(id);
  }

  const options = (list: typeof products) =>
    list.map((p) => (
      <option key={p.id} value={p.id}>
        {p.name} ({p.stock} en stock)
      </option>
    ));

  return (
    <Dialog
      open={editing !== null}
      onClose={onClose}
      title={po ? `Editar orden ${po.number}` : "Nueva orden de compra"}
      onSubmit={submit}
      submitLabel={po ? "Guardar" : "Crear borrador"}
      wide
    >
      <div className="flex flex-col gap-4">
        {suppliers.length === 0 && <p className="text-sm text-warning">Primero crea un proveedor en la pantalla Proveedores.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Proveedor">
            {(id) => (
              <select id={id} value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))} className={inputClass}>
                <option value="">Elige un proveedor…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Observaciones para el proveedor">
            {(id) => <input id={id} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} maxLength={160} className={inputClass} />}
          </Field>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-[13px] font-semibold text-text-muted">Productos</legend>
          {form.lines.map((l, i) => (
            <div key={l.key} className="grid grid-cols-2 items-end gap-2 rounded-md border border-border p-2 sm:grid-cols-[1fr_5.5rem_7.5rem_auto] sm:border-0 sm:p-0">
              <Field label={`Producto ${i + 1}`} className="col-span-2 sm:col-span-1">
                {(id) => (
                  <select
                    id={id}
                    value={l.productId}
                    onChange={(e) => {
                      const p = store.productById.get(e.target.value);
                      updateLine(l.key, { productId: e.target.value, cost: l.cost || (p ? String(p.cost) : "") });
                    }}
                    className={inputClass}
                  >
                    <option value="">Elige un producto…</option>
                    {own.length > 0 ? (
                      <>
                        <optgroup label="De este proveedor">{options(own)}</optgroup>
                        <optgroup label="Otros productos">{options(others)}</optgroup>
                      </>
                    ) : (
                      options(others)
                    )}
                  </select>
                )}
              </Field>
              <Field label={`Cantidad ${i + 1}`}>
                {(id) => (
                  <input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={l.quantity}
                    onChange={(e) => updateLine(l.key, { quantity: e.target.value })}
                    className={inputClass}
                  />
                )}
              </Field>
              <Field label={`Costo unitario ${i + 1}`}>
                {(id) => (
                  <input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={50}
                    value={l.cost}
                    onChange={(e) => updateLine(l.key, { cost: e.target.value })}
                    className={inputClass}
                  />
                )}
              </Field>
              <Btn
                variant="ghost"
                className="col-span-2 sm:col-span-1"
                aria-label={`Quitar producto ${i + 1}`}
                disabled={form.lines.length === 1}
                onClick={() => setForm((f) => ({ ...f, lines: f.lines.filter((x) => x.key !== l.key) }))}
              >
                Quitar
              </Btn>
            </div>
          ))}
          <div>
            <Btn size="sm" onClick={() => setForm((f) => ({ ...f, lines: [...f.lines, newLine()] }))}>
              Agregar producto
            </Btn>
          </div>
        </fieldset>
        <p className="text-right text-base font-semibold tabular-nums">Total: {formatMoney(total)}</p>
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}
