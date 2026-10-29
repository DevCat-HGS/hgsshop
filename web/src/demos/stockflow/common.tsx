import { useState, type ReactNode } from "react";
import { Btn, Dialog, Field, FormError, inputClass, Pill } from "@/demos/kit/ui";
import {
  denyReason,
  MOVE_PERMISSION,
  MOVEMENT_LABELS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  STOCK_LABELS,
  STOCK_TONES,
  stockStatus,
  type MovementType,
  type Permission,
  type Product,
} from "./data";
import type { StockFlow } from "./store";

/** Botón atado a un permiso: sin permiso queda desactivado y explica el motivo. */
export function PermBtn({ store, permission, children, ...props }: { store: StockFlow; permission: Permission } & Parameters<typeof Btn>[0]) {
  const allowed = store.can(permission);
  return (
    <Btn {...props} disabled={!allowed || props.disabled} title={allowed ? props.title : denyReason(store.role, permission)}>
      {children}
    </Btn>
  );
}

/** "a, b ni c" */
const joinNi = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} ni ${items[items.length - 1]}`);

/** Aviso corto de lo que el rol actual no puede hacer en esta pantalla. */
export function RoleNote({ store, permissions }: { store: StockFlow; permissions: Permission[] }) {
  const denied = permissions.filter((p) => !store.can(p));
  if (denied.length === 0) return null;
  return (
    <p className="mb-4 rounded-md border border-border bg-bg px-3 py-2 text-[13px] text-text-muted">
      Estás usando la demo como <span className="font-semibold text-text">{store.currentUser.name}</span> ({ROLE_LABELS[store.role]}). No puedes{" "}
      {joinNi(denied.map((p) => PERMISSION_LABELS[p].toLowerCase()))}.
    </p>
  );
}

export function StockPill({ product }: { product: Pick<Product, "stock" | "min"> }) {
  const status = stockStatus(product);
  return <Pill tone={STOCK_TONES[status]}>{STOCK_LABELS[status]}</Pill>;
}

/** Barra horizontal simple para reportes. */
export function Bar({ value, max, tone = "brand" }: { value: number; max: number; tone?: "brand" | "warning" }) {
  const pct = max > 0 && value > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded-sm bg-surface-hover" aria-hidden="true">
      <div className={`h-2 rounded-sm ${tone === "warning" ? "bg-warning" : "bg-brand"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Signed({ value }: { value: number }) {
  const tone = value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-text-muted";
  return <span className={`font-semibold tabular-nums ${tone}`}>{value > 0 ? `+${value}` : value === 0 ? "0" : `−${Math.abs(value)}`}</span>;
}

export interface MovementPreset {
  type?: MovementType;
  productId?: string;
  quantity?: number;
  note?: string;
}

const TYPES: MovementType[] = ["in", "out", "adjust"];
const TYPE_HINTS: Record<MovementType, string> = {
  in: "Compra o devolución: suma al stock.",
  out: "Venta o consumo: resta del stock, nunca por debajo de cero.",
  adjust: "Conteo físico: el stock queda en lo contado.",
};

/** Diálogo para registrar una entrada, salida o ajuste. El responsable es el usuario actual. */
export function MovementDialog({
  store,
  preset,
  onClose,
  onSaved,
}: {
  store: StockFlow;
  preset: MovementPreset | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const allowedTypes = TYPES.filter((t) => store.can(MOVE_PERMISSION[t]));
  const initialType = (p: MovementPreset | null) => (p?.type && allowedTypes.includes(p.type) ? p.type : (allowedTypes[0] ?? "in"));
  const [type, setType] = useState<MovementType>(initialType(preset));
  const [productId, setProductId] = useState(preset?.productId ?? "");
  const [quantity, setQuantity] = useState(preset?.quantity != null ? String(preset.quantity) : "");
  const [note, setNote] = useState(preset?.note ?? "");
  const [error, setError] = useState("");

  // Cada vez que se abre con otro preajuste, el formulario arranca de nuevo.
  const [lastPreset, setLastPreset] = useState(preset);
  if (preset !== lastPreset) {
    setLastPreset(preset);
    setType(initialType(preset));
    setProductId(preset?.productId ?? "");
    setQuantity(preset?.quantity != null ? String(preset.quantity) : "");
    setNote(preset?.note ?? "");
    setError("");
  }

  const active = store.products.filter((p) => !p.archived).sort((a, b) => a.name.localeCompare(b.name, "es"));
  const product = store.productById.get(productId);
  const qty = Number(quantity);
  const valid = quantity !== "" && Number.isInteger(qty) && qty >= 0;
  const result = product && valid ? (type === "in" ? product.stock + qty : type === "out" ? product.stock - qty : qty) : null;

  function submit() {
    if (quantity.trim() === "") {
      setError(type === "adjust" ? "Escribe la cantidad contada." : "Escribe la cantidad.");
      return;
    }
    const message = store.registerMovement({
      productId,
      type,
      quantity: qty,
      note,
    });
    if (message) {
      setError(message);
      return;
    }
    onSaved(`${MOVEMENT_LABELS[type]} registrada: ${product?.name}`);
    onClose();
  }

  return (
    <Dialog open={preset !== null} onClose={onClose} title="Registrar movimiento" onSubmit={submit} submitLabel="Registrar">
      <div className="flex flex-col gap-4">
        <fieldset>
          <legend className="mb-1 text-[13px] font-semibold text-text-muted">Tipo de movimiento</legend>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => {
              const allowed = store.can(MOVE_PERMISSION[t]);
              return (
                <label
                  key={t}
                  title={allowed ? undefined : denyReason(store.role, MOVE_PERMISSION[t])}
                  className={`flex items-center justify-center rounded-md border px-2 py-2 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
                    type === t ? "border-brand bg-brand-muted font-semibold text-text" : "border-border-strong text-text-muted"
                  } ${allowed ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                >
                  <input type="radio" name="sf-move-type" value={t} checked={type === t} disabled={!allowed} onChange={() => setType(t)} className="sr-only" />
                  {MOVEMENT_LABELS[t]}
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-[12px] text-text-subtle">{TYPE_HINTS[type]}</p>
          {allowedTypes.length < TYPES.length && (
            <p className="mt-1 text-[12px] text-text-subtle">
              Como {ROLE_LABELS[store.role]} solo puedes registrar: {allowedTypes.map((t) => MOVEMENT_LABELS[t].toLowerCase()).join(" y ")}.
            </p>
          )}
        </fieldset>

        <Field label="Producto">
          {(id) => (
            <select id={id} value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass}>
              <option value="">Elige un producto…</option>
              {active.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.stock} en stock)
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label={type === "adjust" ? "Cantidad contada" : "Cantidad"} hint={product ? `Unidad: ${product.unit}` : undefined}>
          {(id) => (
            <input
              id={id}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>

        <Field label="Nota" hint={type === "adjust" ? "Obligatoria si el conteo no coincide con el sistema." : "Opcional: proveedor, factura, motivo…"}>
          {(id) => <input id={id} value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} className={inputClass} />}
        </Field>

        {product && (
          <p className="rounded-md bg-bg px-3 py-2 text-sm text-text-muted tabular-nums">
            Stock actual: <span className="font-semibold text-text">{product.stock}</span>
            {result !== null && (
              <>
                {" "}
                · Quedará en: <span className={`font-semibold ${result < 0 ? "text-danger" : "text-text"}`}>{result}</span>
              </>
            )}
          </p>
        )}
        <p className="text-[12px] text-text-subtle">Responsable: {store.currentUser.name}</p>
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}

/** Estado vacío útil: qué falta y la acción para empezar. */
export function EmptyState({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong bg-bg px-5 py-10 text-center">
      <h3 className="text-base font-semibold text-text">{title}</h3>
      <div className="max-w-md text-sm text-text-muted">{children}</div>
      {actions && <div className="mt-1 flex flex-wrap justify-center gap-2">{actions}</div>}
    </section>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">{children}</div>;
}
