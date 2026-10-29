import { useState } from "react";
import { downloadCsv } from "@/demos/kit/csv";
import { formatDate, formatDateTime, formatMoney, matches } from "@/demos/kit/format";
import { Btn, Dialog, Empty, Field, FormError, inputClass, Pill, SearchField, Table } from "@/demos/kit/ui";
import { ORDER_LABELS, ORDER_TONES, orderTotal, type Order, type OrderStatus } from "./data";
import { RoleNote, Toolbar } from "./common";
import type { StockFlow } from "./store";

/** null = cerrado; "new" = crear; un pedido = editar. */
export type OrderEditing = null | "new" | Order;

export function Orders({
  store,
  notify,
  editing,
  setEditing,
  viewingId,
  setViewingId,
  onRemission,
}: {
  store: StockFlow;
  notify: (m: string) => void;
  editing: OrderEditing;
  setEditing: (e: OrderEditing) => void;
  /** Pedido cuyo detalle está abierto. Vive en la raíz para que la búsqueda global pueda abrirlo. */
  viewingId: string | null;
  setViewingId: (id: string | null) => void;
  /** Abre la remisión imprimible de un pedido despachado. */
  onRemission: (orderId: string) => void;
}) {
  const [status, setStatus] = useState<"" | OrderStatus>("");
  const [query, setQuery] = useState("");

  const rows = store.orders
    .filter((o) => (!status || o.status === status) && (!query || matches(`${o.number} ${o.customer}`, query)))
    .sort((a, b) => b.createdAt - a.createdAt);
  const viewing = store.orders.find((o) => o.id === viewingId) ?? null;
  const counts = (s: OrderStatus) => store.orders.filter((o) => o.status === s).length;

  function exportCsv() {
    downloadCsv(
      "stockflow-pedidos",
      ["Pedido", "Cliente", "Estado", "Líneas", "Total (COP)", "Creado", "Creado por", "Cerrado", "Nota"],
      rows.map((o) => [
        o.number,
        o.customer,
        ORDER_LABELS[o.status],
        o.lines.length,
        orderTotal(o),
        formatDateTime(o.createdAt),
        store.userById.get(o.createdBy)?.name ?? "",
        o.closedAt ? formatDateTime(o.closedAt) : "",
        o.note,
      ]),
    );
  }

  return (
    <div>
      <RoleNote store={store} permissions={["order.manage"]} />
      <Toolbar>
        <SearchField value={query} onChange={setQuery} label="Buscar pedidos" placeholder="Cliente o número…" />
        <select
          aria-label="Filtrar por estado"
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | OrderStatus)}
          className={`${inputClass} sm:w-48`}
        >
          <option value="">Todos los estados ({store.orders.length})</option>
          {(Object.keys(ORDER_LABELS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {ORDER_LABELS[s]}s ({counts(s)})
            </option>
          ))}
        </select>
        <Btn size="sm" className="sm:ml-auto sm:self-center" aria-label="Exportar pedidos a CSV" disabled={rows.length === 0} onClick={exportCsv}>
          Exportar CSV
        </Btn>
      </Toolbar>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-bg">
          <Empty>No hay pedidos con esos filtros.</Empty>
        </div>
      ) : (
        <Table
          label="Pedidos"
          head={[
            "Pedido",
            "Cliente",
            "Fecha",
            "Productos",
            "Total",
            "Estado",
            <span key="acciones" className="relative">
              <span className="sr-only">Acciones</span>
            </span>,
          ]}
          minWidth="46rem"
        >
          {rows.map((o) => (
            <tr key={o.id}>
              <th scope="row" className="font-semibold whitespace-nowrap text-text">
                {o.number}
              </th>
              <td>{o.customer}</td>
              <td className="whitespace-nowrap tabular-nums text-text-muted">{formatDate(o.createdAt)}</td>
              <td className="tabular-nums text-text-muted">
                {o.lines.length} línea{o.lines.length === 1 ? "" : "s"}
              </td>
              <td className="font-semibold tabular-nums">{formatMoney(orderTotal(o))}</td>
              <td>
                <Pill tone={ORDER_TONES[o.status]}>{ORDER_LABELS[o.status]}</Pill>
              </td>
              <td className="text-right">
                <Btn variant="ghost" size="sm" aria-label={`Ver pedido ${o.number}`} onClick={() => setViewingId(o.id)}>
                  Ver
                </Btn>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <OrderDetail
        store={store}
        order={viewing}
        onClose={() => setViewingId(null)}
        notify={notify}
        onEdit={(o) => {
          setViewingId(null);
          setEditing(o);
        }}
        onRemission={(o) => {
          setViewingId(null);
          onRemission(o.id);
        }}
      />
      <OrderForm store={store} editing={editing} onClose={() => setEditing(null)} notify={notify} />
    </div>
  );
}

function OrderDetail({
  store,
  order,
  onClose,
  notify,
  onEdit,
  onRemission,
}: {
  store: StockFlow;
  order: Order | null;
  onClose: () => void;
  notify: (m: string) => void;
  onEdit: (o: Order) => void;
  onRemission: (o: Order) => void;
}) {
  const [error, setError] = useState("");
  const [lastId, setLastId] = useState(order?.id);
  if (order?.id !== lastId) {
    setLastId(order?.id);
    setError("");
  }
  const canManage = store.can("order.manage");

  function run(action: (id: string) => string | null, message: string) {
    if (!order) return;
    const result = action(order.id);
    if (result) setError(result);
    else {
      notify(message);
      onClose();
    }
  }

  return (
    <Dialog open={order !== null} onClose={onClose} title={order ? `Pedido ${order.number}` : "Pedido"} wide>
      {order && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <Pill tone={ORDER_TONES[order.status]}>{ORDER_LABELS[order.status]}</Pill>
            <span className="font-semibold text-text">{order.customer}</span>
            <span className="text-text-muted">
              Creado {formatDateTime(order.createdAt)} por {store.userById.get(order.createdBy)?.name ?? "—"}
            </span>
            {order.closedAt && (
              <span className="text-text-muted">
                {ORDER_LABELS[order.status]} {formatDateTime(order.closedAt)}
              </span>
            )}
          </div>
          {order.note && <p className="text-sm text-text-muted">Nota: {order.note}</p>}

          <Table label={`Productos del pedido ${order.number}`} head={["Producto", "Cantidad", "Disponible", "Precio", "Subtotal"]} minWidth="34rem">
            {order.lines.map((l) => {
              const p = store.productById.get(l.productId);
              const short = order.status === "pending" && (!p || p.archived || p.stock < l.quantity);
              return (
                <tr key={l.productId}>
                  <th scope="row" className="font-normal text-text">
                    {p?.name ?? "Producto eliminado"}
                  </th>
                  <td className="tabular-nums">{l.quantity}</td>
                  <td className={`tabular-nums ${short ? "font-semibold text-danger" : "text-text-muted"}`}>{p ? p.stock : 0}</td>
                  <td className="tabular-nums text-text-muted">{formatMoney(l.price)}</td>
                  <td className="tabular-nums">{formatMoney(l.price * l.quantity)}</td>
                </tr>
              );
            })}
          </Table>
          <p className="text-right text-base font-semibold tabular-nums">Total: {formatMoney(orderTotal(order))}</p>

          <FormError>{error}</FormError>

          {order.status === "dispatched" && order.remission && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
              <p className="mr-auto text-[13px] text-text-subtle">Despachado con la remisión {order.remission}.</p>
              <Btn variant="primary" onClick={() => onRemission(order)}>
                Ver remisión {order.remission}
              </Btn>
            </div>
          )}

          {order.status === "pending" && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              {!canManage && <p className="mr-auto self-center text-[13px] text-text-subtle">Tu rol no gestiona pedidos.</p>}
              <Btn variant="ghost" disabled={!canManage} onClick={() => run(store.cancelOrder, `Pedido ${order.number} cancelado`)}>
                Cancelar pedido
              </Btn>
              <Btn disabled={!canManage} onClick={() => onEdit(order)}>
                Editar
              </Btn>
              <Btn variant="primary" disabled={!canManage} onClick={() => run(store.dispatchOrder, `Pedido ${order.number} despachado`)}>
                Despachar
              </Btn>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

interface LineForm {
  key: number;
  productId: string;
  quantity: string;
}

let lineKey = 0;
const newLine = (productId = "", quantity = "1"): LineForm => ({
  key: ++lineKey,
  productId,
  quantity,
});

function OrderForm({ store, editing, onClose, notify }: { store: StockFlow; editing: OrderEditing; onClose: () => void; notify: (m: string) => void }) {
  const order = editing && editing !== "new" ? editing : null;
  const init = () => ({
    customer: order?.customer ?? "",
    note: order?.note ?? "",
    lines: order ? order.lines.map((l) => newLine(l.productId, String(l.quantity))) : [newLine()],
  });
  const [form, setForm] = useState(init);
  const [error, setError] = useState("");
  const [last, setLast] = useState<OrderEditing>(editing);
  if (editing !== last) {
    setLast(editing);
    setForm(init());
    setError("");
  }

  const products = store.products.filter((p) => !p.archived).sort((a, b) => a.name.localeCompare(b.name, "es"));
  const priceOf = (productId: string) => order?.lines.find((l) => l.productId === productId)?.price ?? store.productById.get(productId)?.price ?? 0;
  const total = form.lines.reduce((s, l) => s + priceOf(l.productId) * (Number(l.quantity) || 0), 0);

  const updateLine = (key: number, change: Partial<LineForm>) =>
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l) => (l.key === key ? { ...l, ...change } : l)),
    }));

  function submit() {
    const result = store.saveOrder(
      {
        customer: form.customer,
        note: form.note,
        lines: form.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity.trim() === "" ? NaN : Number(l.quantity),
        })),
      },
      order?.id,
    );
    if (result) {
      setError(result);
      return;
    }
    notify(order ? `Pedido ${order.number} actualizado` : "Pedido creado");
    onClose();
  }

  return (
    <Dialog
      open={editing !== null}
      onClose={onClose}
      title={order ? `Editar pedido ${order.number}` : "Nuevo pedido"}
      onSubmit={submit}
      submitLabel={order ? "Guardar" : "Crear pedido"}
      wide
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente">
            {(id) => (
              <input
                id={id}
                value={form.customer}
                onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
                maxLength={80}
                className={inputClass}
              />
            )}
          </Field>
          <Field label="Nota del pedido">
            {(id) => (
              <input id={id} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} maxLength={140} className={inputClass} />
            )}
          </Field>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-[13px] font-semibold text-text-muted">Productos</legend>
          {form.lines.map((l, i) => {
            const p = store.productById.get(l.productId);
            const qty = Number(l.quantity) || 0;
            return (
              <div key={l.key} className="grid grid-cols-[1fr_5rem_auto] items-end gap-2 rounded-md border border-border p-2 sm:border-0 sm:p-0">
                <Field label={`Producto ${i + 1}`}>
                  {(id) => (
                    <select id={id} value={l.productId} onChange={(e) => updateLine(l.key, { productId: e.target.value })} className={inputClass}>
                      <option value="">Elige un producto…</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name}
                        </option>
                      ))}
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
                <Btn
                  variant="ghost"
                  aria-label={`Quitar producto ${i + 1}`}
                  disabled={form.lines.length === 1}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      lines: f.lines.filter((x) => x.key !== l.key),
                    }))
                  }
                >
                  Quitar
                </Btn>
                {p && (
                  <p className="col-span-3 -mt-1 text-[12px] text-text-subtle tabular-nums">
                    {formatMoney(priceOf(p.id))} c/u · subtotal {formatMoney(priceOf(p.id) * qty)} ·{" "}
                    <span className={p.stock < qty ? "font-semibold text-warning" : ""}>
                      {p.stock < qty ? `solo hay ${p.stock} en stock: no se podrá despachar hasta reponer` : `${p.stock} en stock`}
                    </span>
                  </p>
                )}
              </div>
            );
          })}
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
