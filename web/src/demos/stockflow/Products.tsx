import { useState } from "react";
import { formatMoney, matches } from "@/demos/kit/format";
import { Btn, ConfirmButton, Dialog, Empty, Field, FormError, inputClass, Pill, SearchField, Table } from "@/demos/kit/ui";
import { CATEGORIES, stockStatus, UNITS, type Product, type StockStatus } from "./data";
import { PermBtn, RoleNote, StockPill, Toolbar, type MovementPreset } from "./common";
import type { ProductDraft, StockFlow } from "./store";

type StatusFilter = "all" | StockStatus | "archived";

/** null = cerrado; "new" = crear; un producto = editar. */
export type Editing = null | "new" | Product;

export function Products({
  store,
  notify,
  onMove,
  editing,
  setEditing,
}: {
  store: StockFlow;
  notify: (message: string) => void;
  onMove: (preset: MovementPreset) => void;
  editing: Editing;
  setEditing: (editing: Editing) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const rows = store.products
    .filter((p) => (status === "archived" ? p.archived : !p.archived && (status === "all" || stockStatus(p) === status)))
    .filter((p) => !category || p.category === category)
    .filter((p) => !query || matches(`${p.name} ${p.sku}`, query))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  const canMove = store.can("move.in") || store.can("move.out") || store.can("move.adjust");

  return (
    <div>
      <RoleNote store={store} permissions={["product.edit", "product.delete"]} />
      <Toolbar>
        <SearchField value={query} onChange={setQuery} label="Buscar productos" placeholder="Nombre o SKU…" />
        <select aria-label="Filtrar por categoría" value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} sm:w-44`}>
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select aria-label="Filtrar por estado" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={`${inputClass} sm:w-40`}>
          <option value="all">Todos los estados</option>
          <option value="ok">OK</option>
          <option value="low">Bajo mínimo</option>
          <option value="out">Agotado</option>
          <option value="archived">Archivados</option>
        </select>
        <p className="text-[13px] text-text-subtle sm:ml-auto sm:self-center">
          {rows.length} producto{rows.length === 1 ? "" : "s"}
        </p>
      </Toolbar>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-bg">
          <Empty>{status === "archived" ? "No hay productos archivados." : "Ningún producto coincide con la búsqueda."}</Empty>
        </div>
      ) : (
        <Table
          label="Productos"
          head={[
            "Producto",
            "Categoría",
            "Stock",
            "Mínimo",
            "Costo",
            "Precio",
            "Estado",
            <span key="acciones" className="relative">
              <span className="sr-only">Acciones</span>
            </span>,
          ]}
          minWidth="58rem"
        >
          {rows.map((p) => (
            <tr key={p.id}>
              <th scope="row" className="font-normal">
                <p className="font-semibold text-text">{p.name}</p>
                <p className="text-[12px] text-text-subtle">{p.sku}</p>
              </th>
              <td className="text-text-muted">{p.category}</td>
              <td className="tabular-nums whitespace-nowrap">
                <span className="font-semibold">{p.stock}</span> <span className="text-text-subtle">{p.unit}</span>
              </td>
              <td className="tabular-nums">{p.min}</td>
              <td className="tabular-nums">{formatMoney(p.cost)}</td>
              <td className="tabular-nums">{formatMoney(p.price)}</td>
              <td>{p.archived ? <Pill>Archivado</Pill> : <StockPill product={p} />}</td>
              <td>
                <div className="flex justify-end gap-1">
                  {p.archived ? (
                    store.can("product.delete") && (
                      <Btn
                        variant="ghost"
                        size="sm"
                        aria-label={`Restaurar "${p.name}"`}
                        onClick={() => {
                          store.restoreProduct(p.id);
                          notify(`"${p.name}" vuelve al inventario activo`);
                        }}
                      >
                        Restaurar
                      </Btn>
                    )
                  ) : (
                    <>
                      {canMove && (
                        <Btn variant="ghost" size="sm" aria-label={`Registrar movimiento de "${p.name}"`} onClick={() => onMove({ productId: p.id })}>
                          Movimiento
                        </Btn>
                      )}
                      {store.can("product.edit") && (
                        <Btn variant="ghost" size="sm" aria-label={`Editar "${p.name}"`} onClick={() => setEditing(p)}>
                          Editar
                        </Btn>
                      )}
                      {store.can("product.delete") && <DeleteProduct store={store} product={p} notify={notify} />}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <ProductDialog store={store} editing={editing} onClose={() => setEditing(null)} notify={notify} />
    </div>
  );
}

function DeleteProduct({ store, product, notify }: { store: StockFlow; product: Product; notify: (m: string) => void }) {
  const history = store.hasHistory(product.id);
  const moves = store.movements.filter((m) => m.productId === product.id).length;
  return (
    <ConfirmButton
      label={history ? "Archivar" : "Eliminar"}
      ariaLabel={`${history ? "Archivar" : "Eliminar"} "${product.name}"`}
      title={history ? "Archivar producto" : "Eliminar producto"}
      confirmLabel={history ? "Archivar" : "Eliminar"}
      message={
        history
          ? `"${product.name}" tiene ${moves} movimiento${moves === 1 ? "" : "s"} en el historial, así que no se borra: se archiva. Deja de aparecer en el inventario y en los pedidos nuevos, pero su historial se conserva y puedes restaurarlo.`
          : `"${product.name}" no tiene movimientos. Se eliminará de forma permanente.`
      }
      onConfirm={() => {
        const error = store.removeProduct(product.id);
        notify(error ?? (history ? `"${product.name}" archivado` : `"${product.name}" eliminado`));
      }}
    />
  );
}

interface FormState {
  name: string;
  sku: string;
  category: string;
  unit: string;
  cost: string;
  price: string;
  min: string;
  initialStock: string;
}

function toForm(p: Product | null): FormState {
  return p
    ? {
        name: p.name,
        sku: p.sku,
        category: p.category,
        unit: p.unit,
        cost: String(p.cost),
        price: String(p.price),
        min: String(p.min),
        initialStock: String(p.stock),
      }
    : {
        name: "",
        sku: "",
        category: "",
        unit: "unidad",
        cost: "",
        price: "",
        min: "5",
        initialStock: "0",
      };
}

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

function ProductDialog({ store, editing, onClose, notify }: { store: StockFlow; editing: Editing; onClose: () => void; notify: (m: string) => void }) {
  const product = editing && editing !== "new" ? editing : null;
  const [form, setForm] = useState<FormState>(() => toForm(product));
  const [error, setError] = useState("");
  const [last, setLast] = useState<Editing>(editing);
  if (editing !== last) {
    setLast(editing);
    setForm(toForm(product));
    setError("");
  }

  const set = (key: keyof FormState) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const cost = num(form.cost);
  const price = num(form.price);
  const margin = cost > 0 && price > 0 ? Math.round(((price - cost) / price) * 100) : null;

  function submit() {
    const draft: ProductDraft = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      unit: form.unit,
      cost,
      price,
      min: num(form.min),
      initialStock: num(form.initialStock),
    };
    const message = store.saveProduct(draft, product?.id);
    if (message) {
      setError(message);
      return;
    }
    notify(product ? "Producto actualizado" : "Producto creado");
    onClose();
  }

  return (
    <Dialog open={editing !== null} onClose={onClose} title={product ? `Editar "${product.name}"` : "Nuevo producto"} onSubmit={submit} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" className="sm:col-span-2">
          {(id) => <input id={id} value={form.name} onChange={set("name")} maxLength={80} className={inputClass} />}
        </Field>
        <Field label="SKU" hint="Código único, p. ej. TOR-0612">
          {(id) => <input id={id} value={form.sku} onChange={set("sku")} maxLength={20} className={`${inputClass} uppercase`} />}
        </Field>
        <Field label="Categoría">
          {(id) => (
            <select id={id} value={form.category} onChange={set("category")} className={inputClass}>
              <option value="">Elige una categoría…</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Unidad">
          {(id) => (
            <select id={id} value={form.unit} onChange={set("unit")} className={inputClass}>
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Stock mínimo" hint="Por debajo de esta cantidad, el producto aparece en alertas.">
          {(id) => <input id={id} type="number" inputMode="numeric" min={0} step={1} value={form.min} onChange={set("min")} className={inputClass} />}
        </Field>
        <Field label="Costo (COP)">
          {(id) => <input id={id} type="number" inputMode="numeric" min={0} step={50} value={form.cost} onChange={set("cost")} className={inputClass} />}
        </Field>
        <Field label="Precio de venta (COP)" hint={margin !== null ? `Margen: ${margin} %` : undefined}>
          {(id) => <input id={id} type="number" inputMode="numeric" min={0} step={50} value={form.price} onChange={set("price")} className={inputClass} />}
        </Field>
        {product ? (
          <p className="text-[13px] text-text-muted sm:col-span-2">
            Stock actual: <span className="font-semibold text-text tabular-nums">{product.stock}</span> {product.unit}. Para cambiarlo, registra una entrada,
            salida o ajuste: así queda en el historial.
          </p>
        ) : (
          <Field label="Stock inicial" hint="Solo al crear. Queda registrado como una entrada.">
            {(id) => (
              <input
                id={id}
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={form.initialStock}
                onChange={set("initialStock")}
                className={inputClass}
              />
            )}
          </Field>
        )}
        <div className="sm:col-span-2">
          <FormError>{error}</FormError>
        </div>
      </div>
    </Dialog>
  );
}

export function NewProductButton({ store, onClick }: { store: StockFlow; onClick: () => void }) {
  return (
    <PermBtn store={store} permission="product.edit" variant="primary" onClick={onClick}>
      Nuevo producto
    </PermBtn>
  );
}
