import { useState } from "react";
import { formatDate, formatMoney, relativeDays } from "@/demos/kit/format";
import { Empty, Panel, Table } from "@/demos/kit/ui";
import { CATEGORIES, IDLE_DAYS, IDLE_MS } from "./data";
import { Bar } from "./common";
import type { StockFlow } from "./store";

export function Reports({ store }: { store: StockFlow }) {
  const [now] = useState(() => Date.now());
  const since = now - IDLE_MS;

  // Rotación: unidades que salieron por ventas o pedidos en los últimos 30 días.
  const sold = new Map<string, number>();
  for (const m of store.movements) if (m.type === "out" && m.at >= since) sold.set(m.productId, (sold.get(m.productId) ?? 0) + m.quantity);
  const rotation = store.products
    .filter((p) => !p.archived)
    .map((p) => ({ product: p, units: sold.get(p.id) ?? 0 }))
    .sort((a, b) => b.units - a.units || a.product.name.localeCompare(b.product.name, "es"));
  const maxUnits = Math.max(1, ...rotation.map((r) => r.units));

  // Sin movimiento: el último movimiento (de cualquier tipo) tiene más de 30 días.
  const lastMove = new Map<string, number>();
  for (const m of store.movements) if (m.at > (lastMove.get(m.productId) ?? 0)) lastMove.set(m.productId, m.at);
  const idle = store.products
    .filter((p) => !p.archived && p.stock > 0 && (lastMove.get(p.id) ?? 0) < since)
    .map((p) => ({
      product: p,
      last: lastMove.get(p.id),
      capital: p.stock * p.cost,
    }))
    .sort((a, b) => b.capital - a.capital);
  const idleCapital = idle.reduce((s, r) => s + r.capital, 0);

  const byCategory = CATEGORIES.map((c) => {
    const items = store.products.filter((p) => !p.archived && p.category === c);
    return {
      category: c,
      count: items.length,
      value: items.reduce((s, p) => s + p.stock * p.cost, 0),
    };
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.value - a.value);
  const maxCategory = Math.max(1, ...byCategory.map((c) => c.value));
  const totalValue = byCategory.reduce((s, c) => s + c.value, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title={`Rotación: unidades vendidas en los últimos ${IDLE_DAYS} días`}>
          <ol className="flex flex-col gap-2.5">
            {rotation.map(({ product, units }) => (
              <li key={product.id} className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,14rem)_1fr_4.5rem]">
                <span className="truncate text-sm text-text" title={product.name}>
                  {product.name}
                </span>
                <span className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                  <Bar value={units} max={maxUnits} />
                </span>
                <span className="col-start-2 row-start-1 text-right text-sm font-semibold tabular-nums sm:col-start-auto sm:row-start-auto">
                  {units} <span className="text-[12px] font-normal text-text-subtle">{product.unit}</span>
                </span>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Valor del inventario por categoría (a costo)">
          <ul className="flex flex-col gap-3">
            {byCategory.map((c) => (
              <li key={c.category} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-text">
                    {c.category}{" "}
                    <span className="text-[12px] text-text-subtle">
                      · {c.count} producto{c.count === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatMoney(c.value)}{" "}
                    <span className="text-[12px] font-normal text-text-subtle">{totalValue ? Math.round((c.value / totalValue) * 100) : 0} %</span>
                  </span>
                </div>
                <Bar value={c.value} max={maxCategory} />
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-border pt-3 text-right text-sm text-text-muted">
            Total: <span className="font-semibold text-text tabular-nums">{formatMoney(totalValue)}</span>
          </p>
        </Panel>
      </div>

      <Panel title={`Productos sin movimiento en más de ${IDLE_DAYS} días`}>
        {idle.length === 0 ? (
          <Empty>Todos los productos con stock se movieron en el último mes.</Empty>
        ) : (
          <>
            <p className="mb-3 text-sm text-text-muted">
              Capital inmovilizado: <span className="font-semibold text-warning tabular-nums">{formatMoney(idleCapital)}</span> en {idle.length} producto
              {idle.length === 1 ? "" : "s"}. Considera promociones o pedir menos en la próxima compra.
            </p>
            <Table label="Productos sin movimiento" head={["Producto", "Último movimiento", "Stock", "Capital inmovilizado"]} minWidth="34rem">
              {idle.map(({ product, last, capital }) => (
                <tr key={product.id}>
                  <th scope="row" className="font-normal text-text">
                    {product.name}
                  </th>
                  <td className="whitespace-nowrap text-text-muted tabular-nums">{last ? `${formatDate(last)} (${relativeDays(last)})` : "Nunca"}</td>
                  <td className="tabular-nums">
                    {product.stock} {product.unit}
                  </td>
                  <td className="font-semibold tabular-nums">{formatMoney(capital)}</td>
                </tr>
              ))}
            </Table>
          </>
        )}
      </Panel>
    </div>
  );
}
