import { useState } from "react";
import { downloadCsv } from "@/demos/kit/csv";
import { matches } from "@/demos/kit/format";
import { Btn, ConfirmButton, Dialog, Empty, Field, FormError, inputClass, SearchField, Table } from "@/demos/kit/ui";
import { OPEN_PURCHASE, type Supplier } from "./data";
import { EmptyState, PermBtn, RoleNote, Toolbar } from "./common";
import type { StockFlow, SupplierDraft } from "./store";

/** null = cerrado; "new" = crear; un proveedor = editar. */
export type SupplierEditing = null | "new" | Supplier;

export function Suppliers({
  store,
  notify,
  editing,
  setEditing,
}: {
  store: StockFlow;
  notify: (m: string) => void;
  editing: SupplierEditing;
  setEditing: (e: SupplierEditing) => void;
}) {
  const [query, setQuery] = useState("");
  const manage = store.can("supplier.manage");
  const rows = store.suppliers
    .filter((s) => !query || matches(`${s.name} ${s.nit} ${s.contact} ${s.email}`, query))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  const productCount = (id: string) => store.products.filter((p) => !p.archived && p.supplierId === id).length;
  const openCount = (id: string) => store.purchases.filter((po) => po.supplierId === id && OPEN_PURCHASE.includes(po.status)).length;

  function exportCsv() {
    downloadCsv(
      "stockflow-proveedores",
      ["Proveedor", "NIT", "Contacto", "Teléfono", "Correo", "Plazo de entrega (días)", "Productos", "Órdenes abiertas"],
      rows.map((s) => [s.name, s.nit, s.contact, s.phone, s.email, s.leadDays, productCount(s.id), openCount(s.id)]),
    );
  }

  const dialog = <SupplierDialog store={store} editing={editing} onClose={() => setEditing(null)} notify={notify} />;

  if (store.suppliers.length === 0) {
    return (
      <div>
        <EmptyState
          title="Aún no tienes proveedores"
          actions={
            <PermBtn store={store} permission="supplier.manage" variant="primary" onClick={() => setEditing("new")}>
              Nuevo proveedor
            </PermBtn>
          }
        >
          Registra a quién le compras, con su NIT, contacto y plazo de entrega. Después asígnalo como proveedor habitual de cada producto para que la
          sugerencia de compra arme las órdenes por proveedor.
        </EmptyState>
        {dialog}
      </div>
    );
  }

  return (
    <div>
      <RoleNote store={store} permissions={["supplier.manage"]} />
      <Toolbar>
        <SearchField value={query} onChange={setQuery} label="Buscar proveedores" placeholder="Nombre, NIT o contacto…" />
        <p className="text-[13px] text-text-subtle sm:ml-auto sm:self-center">
          {rows.length} proveedor{rows.length === 1 ? "" : "es"}
        </p>
        <Btn size="sm" className="sm:self-center" aria-label="Exportar proveedores a CSV" disabled={rows.length === 0} onClick={exportCsv}>
          Exportar CSV
        </Btn>
      </Toolbar>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-bg">
          <Empty>Ningún proveedor coincide con la búsqueda.</Empty>
        </div>
      ) : (
        <Table
          label="Proveedores"
          head={[
            "Proveedor",
            "Contacto",
            "Plazo",
            "Productos",
            "Órdenes abiertas",
            <span key="acciones" className="relative">
              <span className="sr-only">Acciones</span>
            </span>,
          ]}
          minWidth="52rem"
        >
          {rows.map((s) => (
            <tr key={s.id}>
              <th scope="row" className="font-normal">
                <p className="font-semibold text-text">{s.name}</p>
                <p className="text-[12px] text-text-subtle">{s.nit ? `NIT ${s.nit}` : "Sin NIT"}</p>
              </th>
              <td>
                <p className="text-text">{s.contact || "—"}</p>
                <p className="text-[12px] text-text-subtle">{[s.phone, s.email].filter(Boolean).join(" · ") || "Sin datos de contacto"}</p>
              </td>
              <td className="whitespace-nowrap tabular-nums">
                {s.leadDays} día{s.leadDays === 1 ? "" : "s"}
              </td>
              <td className="tabular-nums">{productCount(s.id)}</td>
              <td className="tabular-nums">{openCount(s.id)}</td>
              <td>
                {manage && (
                  <div className="flex justify-end gap-1">
                    <Btn variant="ghost" size="sm" aria-label={`Editar proveedor "${s.name}"`} onClick={() => setEditing(s)}>
                      Editar
                    </Btn>
                    <DeleteSupplier store={store} supplier={s} notify={notify} />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
      {dialog}
    </div>
  );
}

function DeleteSupplier({ store, supplier, notify }: { store: StockFlow; supplier: Supplier; notify: (m: string) => void }) {
  const orders = store.purchases.filter((po) => po.supplierId === supplier.id).length;
  const products = store.products.filter((p) => p.supplierId === supplier.id).length;
  if (orders)
    return (
      <Btn
        variant="ghost"
        size="sm"
        disabled
        aria-label={`Borrar proveedor "${supplier.name}"`}
        title={`Tiene ${orders} orden${orders === 1 ? "" : "es"} de compra en el historial: no se puede borrar.`}
      >
        Borrar
      </Btn>
    );
  return (
    <ConfirmButton
      label="Borrar"
      ariaLabel={`Borrar proveedor "${supplier.name}"`}
      title="Borrar proveedor"
      confirmLabel="Borrar"
      message={
        products
          ? `Se borrará "${supplier.name}". ${products} producto${products === 1 ? "" : "s"} quedará${products === 1 ? "" : "n"} sin proveedor habitual.`
          : `Se borrará "${supplier.name}" de forma permanente.`
      }
      onConfirm={() => {
        const error = store.removeSupplier(supplier.id);
        notify(error ?? `Proveedor "${supplier.name}" borrado`);
      }}
    />
  );
}

interface FormState {
  name: string;
  nit: string;
  contact: string;
  phone: string;
  email: string;
  leadDays: string;
}

const toForm = (s: Supplier | null): FormState =>
  s
    ? { name: s.name, nit: s.nit, contact: s.contact, phone: s.phone, email: s.email, leadDays: String(s.leadDays) }
    : { name: "", nit: "", contact: "", phone: "", email: "", leadDays: "5" };

function SupplierDialog({ store, editing, onClose, notify }: { store: StockFlow; editing: SupplierEditing; onClose: () => void; notify: (m: string) => void }) {
  const supplier = editing && editing !== "new" ? editing : null;
  const [form, setForm] = useState<FormState>(() => toForm(supplier));
  const [error, setError] = useState("");
  const [last, setLast] = useState<SupplierEditing>(editing);
  if (editing !== last) {
    setLast(editing);
    setForm(toForm(supplier));
    setError("");
  }
  const set = (key: keyof FormState) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit() {
    const draft: SupplierDraft = { ...form, leadDays: form.leadDays.trim() === "" ? NaN : Number(form.leadDays) };
    const result = store.saveSupplier(draft, supplier?.id);
    if (result) {
      setError(result);
      return;
    }
    notify(supplier ? "Proveedor actualizado" : `Proveedor "${form.name.trim()}" creado`);
    onClose();
  }

  return (
    <Dialog
      open={editing !== null}
      onClose={onClose}
      title={supplier ? `Editar "${supplier.name}"` : "Nuevo proveedor"}
      onSubmit={submit}
      submitLabel={supplier ? "Guardar" : "Crear proveedor"}
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre o razón social" className="sm:col-span-2">
          {(id) => <input id={id} value={form.name} onChange={set("name")} maxLength={80} className={inputClass} />}
        </Field>
        <Field label="NIT" hint="Con dígito de verificación, p. ej. 900.123.456-7">
          {(id) => <input id={id} value={form.nit} onChange={set("nit")} maxLength={20} inputMode="numeric" className={inputClass} />}
        </Field>
        <Field label="Plazo de entrega (días)" hint="Días desde que envías la orden hasta que llega.">
          {(id) => (
            <input id={id} type="number" inputMode="numeric" min={0} step={1} value={form.leadDays} onChange={set("leadDays")} className={inputClass} />
          )}
        </Field>
        <Field label="Persona de contacto">
          {(id) => <input id={id} value={form.contact} onChange={set("contact")} maxLength={60} className={inputClass} />}
        </Field>
        <Field label="Teléfono">
          {(id) => <input id={id} type="tel" value={form.phone} onChange={set("phone")} maxLength={20} className={inputClass} />}
        </Field>
        <Field label="Correo" className="sm:col-span-2">
          {(id) => <input id={id} inputMode="email" autoComplete="off" value={form.email} onChange={set("email")} maxLength={80} className={inputClass} />}
        </Field>
        <div className="sm:col-span-2">
          <FormError>{error}</FormError>
        </div>
      </div>
    </Dialog>
  );
}
