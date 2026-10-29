import { useState } from "react";
import { formatDateTime, formatMoney, startOfDay } from "@/demos/kit/format";
import { Btn, Empty, Panel, Pill, Stat } from "@/demos/kit/ui";
import { MOVEMENT_LABELS, MOVEMENT_TONES, orderTotal, stockStatus } from "./data";
import { PermBtn, Signed, StockPill, type MovementPreset } from "./common";
import type { StockFlow } from "./store";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function Dashboard({
  store,
  onMove,
  onOpen,
}: {
  store: StockFlow;
  onMove: (preset: MovementPreset) => void;
  onOpen: (view: "productos" | "movimientos" | "pedidos") => void;
}) {
  const active = store.products.filter((p) => !p.archived);
  const value = active.reduce((sum, p) => sum + p.stock * p.cost, 0);
  const needing = active.filter((p) => stockStatus(p) !== "ok").sort((a, b) => a.stock / Math.max(1, a.min) - b.stock / Math.max(1, b.min));
  const outCount = needing.filter((p) => p.stock <= 0).length;
  const [today] = useState(() => startOfDay(Date.now()));
  const todayMoves = store.movements.filter((m) => m.at >= today);
  const pending = store.orders.filter((o) => o.status === "pending");
  const recent = store.movements.slice(0, 8);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Valor del inventario (a costo)" value={formatMoney(value)} detail={`${active.length} productos activos`} />
        <Stat
          label="Bajo mínimo o agotados"
          value={needing.length}
          tone={needing.length ? "warning" : "success"}
          detail={outCount ? `${outCount} agotado${outCount === 1 ? "" : "s"}` : "Ninguno agotado"}
        />
        <Stat
          label="Movimientos de hoy"
          value={todayMoves.length}
          detail={`${plural(todayMoves.filter((m) => m.type === "in").length, "entrada")}, ${plural(todayMoves.filter((m) => m.type === "out").length, "salida")}`}
        />
        <Stat label="Pedidos pendientes" value={pending.length} detail={formatMoney(pending.reduce((s, o) => s + orderTotal(o), 0))} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel
          title="Necesitan reposición"
          actions={
            <Btn variant="ghost" size="sm" onClick={() => onOpen("productos")}>
              Ver productos
            </Btn>
          }
        >
          {needing.length === 0 ? (
            <Empty>Todo el inventario está por encima del mínimo.</Empty>
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {needing.map((p) => {
                const suggested = Math.max(1, p.min * 2 - p.stock);
                return (
                  <li key={p.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text">{p.name}</p>
                      <p className="text-[13px] text-text-muted tabular-nums">
                        Hay {p.stock} · mínimo {p.min} · sugerido pedir {suggested}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <StockPill product={p} />
                      <PermBtn
                        store={store}
                        permission="move.in"
                        size="sm"
                        onClick={() =>
                          onMove({
                            type: "in",
                            productId: p.id,
                            quantity: suggested,
                          })
                        }
                        aria-label={`Registrar entrada de "${p.name}"`}
                      >
                        Registrar entrada
                      </PermBtn>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="Últimos movimientos"
          actions={
            <Btn variant="ghost" size="sm" onClick={() => onOpen("movimientos")}>
              Ver historial
            </Btn>
          }
        >
          {recent.length === 0 ? (
            <Empty>Aún no hay movimientos.</Empty>
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {recent.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <Pill tone={MOVEMENT_TONES[m.type]}>{MOVEMENT_LABELS[m.type]}</Pill>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text">{store.productById.get(m.productId)?.name ?? "Producto eliminado"}</p>
                    <p className="truncate text-[12px] text-text-subtle">
                      {formatDateTime(m.at)} · {store.userById.get(m.userId)?.name ?? "—"}
                    </p>
                  </div>
                  <Signed value={m.delta} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
