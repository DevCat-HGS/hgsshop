import { useState } from "react";
import { Dialog, Field, FormError, inputClass, Pill, Table } from "@/demos/kit/ui";
import { ALL_PERMISSIONS, can, PERMISSION_LABELS, ROLE_LABELS, type Role } from "./data";
import { RoleNote } from "./common";
import type { StockFlow } from "./store";

const ROLES = Object.keys(ROLE_LABELS) as Role[];

export function Users({
  store,
  notify,
  creating,
  setCreating,
}: {
  store: StockFlow;
  notify: (m: string) => void;
  creating: boolean;
  setCreating: (v: boolean) => void;
}) {
  const manage = store.can("user.manage");

  function changeRole(id: string, role: Role) {
    const user = store.users.find((u) => u.id === id);
    if (!user) return;
    const error = store.saveUser(user.name, role, id);
    notify(error ?? `${user.name} ahora tiene el rol ${ROLE_LABELS[role]}`);
  }

  return (
    <div className="flex flex-col gap-5">
      <RoleNote store={store} permissions={["user.manage"]} />
      <Table label="Usuarios" head={["Nombre", "Rol", "Movimientos registrados", "Pedidos creados"]} minWidth="36rem">
        {store.users.map((u) => (
          <tr key={u.id}>
            <th scope="row" className="font-semibold text-text">
              {u.name} {u.id === store.currentUser.id && <Pill tone="brand">Tú</Pill>}
            </th>
            <td>
              {manage ? (
                <select
                  aria-label={`Rol de "${u.name}"`}
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value as Role)}
                  className={`${inputClass} w-48 py-1.5`}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              ) : (
                ROLE_LABELS[u.role]
              )}
            </td>
            <td className="tabular-nums">{store.movements.filter((m) => m.userId === u.id).length}</td>
            <td className="tabular-nums">{store.orders.filter((o) => o.createdBy === u.id).length}</td>
          </tr>
        ))}
      </Table>

      <section aria-labelledby="sf-perm-title">
        <h3 id="sf-perm-title" className="mb-2 text-sm font-semibold text-text">
          Qué puede hacer cada rol
        </h3>
        <Table label="Permisos por rol" head={["Permiso", ...ROLES.map((r) => ROLE_LABELS[r])]} minWidth="34rem">
          {ALL_PERMISSIONS.map((p) => (
            <tr key={p}>
              <th scope="row" className="font-normal text-text">
                {PERMISSION_LABELS[p]}
              </th>
              {ROLES.map((r) => (
                <td key={r}>{can(r, p) ? <Pill tone="success">Sí</Pill> : <span className="text-text-subtle">No</span>}</td>
              ))}
            </tr>
          ))}
        </Table>
        <p className="mt-2 text-[13px] text-text-subtle">Todos los roles pueden ver el panel, el inventario, el historial y los reportes.</p>
      </section>

      <NewUserDialog store={store} open={creating} onClose={() => setCreating(false)} notify={notify} />
    </div>
  );
}

function NewUserDialog({ store, open, onClose, notify }: { store: StockFlow; open: boolean; onClose: () => void; notify: (m: string) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("cashier");
  const [error, setError] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName("");
      setRole("cashier");
      setError("");
    }
  }

  function submit() {
    const result = store.saveUser(name, role);
    if (result) {
      setError(result);
      return;
    }
    notify(`Usuario ${name.trim()} creado`);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo usuario" onSubmit={submit} submitLabel="Crear usuario">
      <div className="flex flex-col gap-4">
        <Field label="Nombre completo">
          {(id) => <input id={id} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={inputClass} />}
        </Field>
        <Field label="Rol">
          {(id) => (
            <select id={id} value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputClass}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <p className="text-[12px] text-text-subtle">
          En la demo no se envían invitaciones: el usuario aparece de inmediato en el selector “Usar la demo como”.
        </p>
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}
