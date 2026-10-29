import { useState } from "react";
import { downloadCsv } from "@/demos/kit/csv";
import { formatDate, formatDateTime, formatTime, fromDateInput } from "@/demos/kit/format";
import { Btn, Empty, inputClass, Pill, Table } from "@/demos/kit/ui";
import { MOVEMENT_LABELS, MOVEMENT_TONES, type MovementType } from "./data";
import { RoleNote, Signed, Toolbar } from "./common";
import type { StockFlow } from "./store";

const PAGE = 40;

export function Movements({ store }: { store: StockFlow }) {
  const [type, setType] = useState<"" | MovementType>("");
  const [productId, setProductId] = useState("");
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const fromTime = from ? fromDateInput(from) : 0;
  const rows = store.movements.filter(
    (m) => (!type || m.type === type) && (!productId || m.productId === productId) && (!userId || m.userId === userId) && m.at >= fromTime,
  );
  const products = [...store.products].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const filtered = Boolean(type || productId || userId || from);

  function exportCsv() {
    downloadCsv(
      "stockflow-movimientos",
      ["Fecha", "Producto", "SKU", "Tipo", "Cambio", "Cantidad contada", "Saldo", "Responsable", "Nota"],
      rows.map((m) => {
        const product = store.productById.get(m.productId);
        return [
          formatDateTime(m.at),
          product?.name ?? "Producto eliminado",
          product?.sku ?? "",
          MOVEMENT_LABELS[m.type],
          m.delta,
          m.type === "adjust" ? m.quantity : "",
          m.balance,
          store.userById.get(m.userId)?.name ?? "",
          m.note,
        ];
      }),
    );
  }

  return (
    <div>
      <RoleNote store={store} permissions={["move.in", "move.out", "move.adjust"]} />
      <Toolbar>
        <select aria-label="Filtrar por tipo" value={type} onChange={(e) => setType(e.target.value as "" | MovementType)} className={`${inputClass} sm:w-40`}>
          <option value="">Todos los tipos</option>
          <option value="in">Entradas</option>
          <option value="out">Salidas</option>
          <option value="adjust">Ajustes</option>
        </select>
        <select aria-label="Filtrar por producto" value={productId} onChange={(e) => setProductId(e.target.value)} className={`${inputClass} sm:w-64`}>
          <option value="">Todos los productos</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.archived ? " (archivado)" : ""}
            </option>
          ))}
        </select>
        <select aria-label="Filtrar por responsable" value={userId} onChange={(e) => setUserId(e.target.value)} className={`${inputClass} sm:w-52`}>
          <option value="">Todos los responsables</option>
          {store.users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <input type="date" aria-label="Desde la fecha" value={from} onChange={(e) => setFrom(e.target.value)} className={`${inputClass} sm:w-40`} />
        {filtered && (
          <Btn
            variant="ghost"
            onClick={() => {
              setType("");
              setProductId("");
              setUserId("");
              setFrom("");
            }}
          >
            Limpiar filtros
          </Btn>
        )}
        <p className="text-[13px] text-text-subtle sm:ml-auto sm:self-center">
          {rows.length} movimiento{rows.length === 1 ? "" : "s"}
        </p>
        <Btn size="sm" className="sm:self-center" aria-label="Exportar movimientos a CSV" disabled={rows.length === 0} onClick={exportCsv}>
          Exportar CSV
        </Btn>
      </Toolbar>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-bg">
          <Empty>No hay movimientos con esos filtros.</Empty>
        </div>
      ) : (
        <>
          <Table label="Historial de movimientos" head={["Fecha", "Producto", "Tipo", "Cantidad", "Saldo", "Responsable", "Nota"]} minWidth="56rem">
            {rows.slice(0, limit).map((m) => {
              const product = store.productById.get(m.productId);
              return (
                <tr key={m.id}>
                  <td className="whitespace-nowrap tabular-nums">
                    {formatDate(m.at)} <span className="text-text-subtle">{formatTime(m.at)}</span>
                  </td>
                  <th scope="row" className="font-normal text-text">
                    {product?.name ?? "Producto eliminado"}
                  </th>
                  <td>
                    <Pill tone={MOVEMENT_TONES[m.type]}>{MOVEMENT_LABELS[m.type]}</Pill>
                  </td>
                  <td>
                    <Signed value={m.delta} />
                    {m.type === "adjust" && <span className="ml-1 text-[12px] text-text-subtle">(contó {m.quantity})</span>}
                  </td>
                  <td className="font-semibold tabular-nums">{m.balance}</td>
                  <td className="whitespace-nowrap text-text-muted">{store.userById.get(m.userId)?.name ?? "—"}</td>
                  <td className="text-text-muted">{m.note || "—"}</td>
                </tr>
              );
            })}
          </Table>
          {rows.length > limit && (
            <div className="mt-3 flex justify-center">
              <Btn variant="ghost" onClick={() => setLimit((l) => l + PAGE)}>
                Ver {Math.min(PAGE, rows.length - limit)} más
              </Btn>
            </div>
          )}
        </>
      )}
    </div>
  );
}
