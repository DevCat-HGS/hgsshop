import { useState } from "react";
import { downloadCsv } from "@/demos/kit/csv";
import { formatDate, formatDateLong, formatDateTime, formatMoney, formatTime, matches, relativeDays } from "@/demos/kit/format";
import { uid } from "@/demos/kit/storage";
import { Btn, ConfirmButton, Dialog, Empty, Field, FormError, inputClass, Panel, Pill, SearchField, Stat, Table } from "@/demos/kit/ui";
import { CHANNEL_LABEL, clientStats, percent, STATUS_LABEL, STATUS_TONE, type Appointment, type Channel, type Client, type Editor } from "./data";
import type { ClientiaStore } from "./store";

interface Props {
  store: ClientiaStore;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (editor: Editor) => void;
  notify: (msg: string) => void;
  /** Formulario de cliente abierto desde la acción de la cabecera. */
  creating: boolean;
  onCreatingChange: (open: boolean) => void;
}

export function Clients({ store, selectedId, onSelect, onEdit, notify, creating, onCreatingChange }: Props) {
  const { clients, appointments, now } = store;
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<"all" | Channel>("all");
  const [editing, setEditing] = useState<Client | null>(null);

  const selected = clients.find((c) => c.id === selectedId);

  function remove(client: Client) {
    store.setClients((list) => list.filter((c) => c.id !== client.id));
    store.setAppointments((list) => list.filter((a) => a.clientId !== client.id));
    onSelect(null);
    notify(`Cliente "${client.name}" eliminado`);
  }

  const form = (
    <ClientForm
      open={creating || editing !== null}
      client={editing}
      store={store}
      onClose={() => {
        setEditing(null);
        onCreatingChange(false);
      }}
      onSaved={(client, isNew) => {
        notify(isNew ? "Cliente creado" : "Cliente actualizado");
        if (isNew) onSelect(client.id);
      }}
    />
  );

  if (selected) {
    return (
      <>
        <ClientCard client={selected} store={store} onBack={() => onSelect(null)} onEdit={onEdit} onEditClient={() => setEditing(selected)} onDelete={() => remove(selected)} />
        {form}
      </>
    );
  }

  const visible = clients
    .filter((c) => (channel === "all" || c.channel === channel) && (!query || matches(`${c.name} ${c.phone} ${c.email}`, query)))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  function exportCsv() {
    downloadCsv(
      "clientia-clientes",
      ["Cliente", "Teléfono", "Correo", "Recordatorio", "Próxima cita", "Visitas", "Gasto total (COP)", "Inasistencias"],
      visible.map((c) => {
        const s = clientStats(c.id, appointments, now);
        const next = s.upcoming[0];
        return [c.name, c.phone, c.email, CHANNEL_LABEL[c.channel], next ? formatDateTime(next.start) : "", s.attended, Math.round(s.spent), s.noShows];
      }),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <SearchField value={query} onChange={setQuery} label="Buscar clientes" placeholder="Nombre, teléfono o correo…" />
        <Field label="Canal de recordatorio" className="w-full sm:w-48">
          {(id) => (
            <select id={id} className={inputClass} value={channel} onChange={(e) => setChannel(e.target.value as "all" | Channel)}>
              <option value="all">Todos</option>
              {(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABEL[c]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <p className="text-[13px] text-text-muted sm:ml-auto">
          {visible.length} de {clients.length} clientes
        </p>
        <Btn size="sm" onClick={exportCsv} disabled={visible.length === 0} aria-label="Exportar clientes a CSV">
          Exportar CSV
        </Btn>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-border bg-bg">
          <Empty>{clients.length ? "Ningún cliente coincide con la búsqueda." : "Todavía no hay clientes. Crea el primero."}</Empty>
        </div>
      ) : (
        <Table label="Clientes" head={["Cliente", "Teléfono", "Recordatorio", "Próxima cita", "Gasto total", "Inasistencia", "Acciones"]} minWidth="54rem">
          {visible.map((c) => {
            const s = clientStats(c.id, appointments, now);
            const next = s.upcoming[0];
            return (
              <tr key={c.id}>
                <th scope="row" className="font-normal">
                  <button type="button" onClick={() => onSelect(c.id)} className="text-left font-semibold text-text hover:text-brand">
                    {c.name}
                  </button>
                  {c.email && <span className="block text-[12px] text-text-subtle">{c.email}</span>}
                </th>
                <td className="whitespace-nowrap tabular-nums">{c.phone || "—"}</td>
                <td>
                  <Pill tone={c.channel === "none" ? "neutral" : "brand"}>{CHANNEL_LABEL[c.channel]}</Pill>
                </td>
                <td className="whitespace-nowrap">{next ? `${formatDate(next.start)}, ${formatTime(next.start)}` : <span className="text-text-subtle">Sin citas</span>}</td>
                <td className="tabular-nums">{formatMoney(s.spent)}</td>
                <td className={`tabular-nums ${s.noShowRate >= 0.25 ? "text-danger" : ""}`}>{s.attended + s.noShows ? percent(s.noShowRate) : "—"}</td>
                <td className="whitespace-nowrap">
                  <Btn size="sm" variant="ghost" onClick={() => setEditing(c)} aria-label={`Editar "${c.name}"`}>
                    Editar
                  </Btn>
                  <ConfirmButton
                    label="Eliminar"
                    ariaLabel={`Eliminar "${c.name}"`}
                    title="Eliminar cliente"
                    message={deleteMessage(c, appointments)}
                    onConfirm={() => remove(c)}
                  />
                </td>
              </tr>
            );
          })}
        </Table>
      )}
      {form}
    </div>
  );
}

function deleteMessage(client: Client, appointments: Appointment[]) {
  const count = appointments.filter((a) => a.clientId === client.id).length;
  return count
    ? `Se eliminará a ${client.name} junto con sus ${count} ${count === 1 ? "cita" : "citas"} (próximas e historial). Esta acción no se puede deshacer.`
    : `Se eliminará a ${client.name}. Esta acción no se puede deshacer.`;
}

function ClientCard({
  client,
  store,
  onBack,
  onEdit,
  onEditClient,
  onDelete,
}: {
  client: Client;
  store: ClientiaStore;
  onBack: () => void;
  onEdit: (editor: Editor) => void;
  onEditClient: () => void;
  onDelete: () => void;
}) {
  const { appointments, professionals, now } = store;
  const s = clientStats(client.id, appointments, now);
  const proName = (id: string) => professionals.find((p) => p.id === id)?.name ?? "Profesional eliminada";

  const row = (a: Appointment, past: boolean) => {
    const pending = past && a.status === "scheduled";
    return (
      <li key={a.id}>
        <button type="button" onClick={() => onEdit({ mode: "edit", id: a.id })} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-2 py-2 text-left hover:bg-surface-hover">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-text">{a.serviceName}</span>
            <span className="block text-[12px] text-text-muted">
              {formatDateLong(a.start)}, {formatTime(a.start)} · {proName(a.professionalId)}
            </span>
          </span>
          <span className="text-sm tabular-nums text-text-muted">{formatMoney(a.price)}</span>
          <Pill tone={pending ? "warning" : STATUS_TONE[a.status]}>{pending ? "Por marcar" : STATUS_LABEL[a.status]}</Pill>
        </button>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Btn size="sm" variant="ghost" onClick={onBack}>
          ‹ Volver a clientes
        </Btn>
      </div>
      <section aria-label={`Ficha de ${client.name}`} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-bg p-4">
          <div className="min-w-0">
            <h3 className="font-display text-xl text-text">{client.name}</h3>
            <p className="mt-1 text-sm text-text-muted">
              {[client.phone, client.email].filter(Boolean).join(" · ") || "Sin datos de contacto"}
            </p>
            <p className="mt-1 text-[13px] text-text-muted">
              Recordatorios: <span className="text-text">{CHANNEL_LABEL[client.channel]}</span>
              {s.lastVisit ? ` · Última visita ${relativeDays(s.lastVisit)}` : ""}
            </p>
            {client.notes && <p className="mt-2 max-w-prose rounded-md bg-surface px-3 py-2 text-sm text-text">{client.notes}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" size="sm" onClick={() => onEdit({ mode: "new", clientId: client.id })}>
              Agendar cita
            </Btn>
            <Btn size="sm" onClick={onEditClient} aria-label={`Editar "${client.name}"`}>
              Editar
            </Btn>
            <ConfirmButton label="Eliminar" ariaLabel={`Eliminar "${client.name}"`} title="Eliminar cliente" message={deleteMessage(client, appointments)} onConfirm={onDelete} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Gasto total" value={formatMoney(s.spent)} detail="Citas a las que asistió" />
          <Stat label="Visitas" value={s.attended} detail={`${s.upcoming.length} ${s.upcoming.length === 1 ? "cita próxima" : "citas próximas"}`} />
          <Stat label="Inasistencias" value={s.noShows} tone={s.noShows ? "warning" : undefined} />
          <Stat label="Tasa de inasistencia" value={s.attended + s.noShows ? percent(s.noShowRate) : "—"} tone={s.noShowRate >= 0.25 ? "danger" : undefined} />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
          <Panel title="Próximas citas">
            {s.upcoming.length ? <ul className="-m-2 flex flex-col">{s.upcoming.map((a) => row(a, false))}</ul> : <Empty>No tiene citas próximas.</Empty>}
          </Panel>
          <Panel title="Historial">
            {s.history.length ? <ul className="-m-2 flex flex-col">{s.history.map((a) => row(a, a.start <= now))}</ul> : <Empty>Todavía no tiene historial.</Empty>}
          </Panel>
        </div>
      </section>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ClientForm({
  open,
  client,
  store,
  onClose,
  onSaved,
}: {
  open: boolean;
  client: Client | null;
  store: ClientiaStore;
  onClose: () => void;
  onSaved: (client: Client, isNew: boolean) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={client ? "Editar cliente" : "Nuevo cliente"}>
      {open && <ClientFields key={client?.id ?? "nuevo"} client={client} store={store} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function ClientFields({ client, store, onClose, onSaved }: { client: Client | null; store: ClientiaStore; onClose: () => void; onSaved: (client: Client, isNew: boolean) => void }) {
  const [name, setName] = useState(client?.name ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [channel, setChannel] = useState<Channel>(client?.channel ?? "whatsapp");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [error, setError] = useState("");

  function save() {
    const digits = phone.replace(/\D/g, "");
    if (name.trim().length < 3) return setError("Escribe el nombre del cliente (mínimo 3 letras).");
    if (phone.trim() && (digits.length < 7 || digits.length > 15 || /[^\d\s+()-]/.test(phone))) return setError("El teléfono debe tener entre 7 y 15 dígitos.");
    if (email.trim() && !EMAIL_RE.test(email.trim())) return setError("El correo no es válido.");
    if (channel === "whatsapp" && !digits) return setError("Para recordar por WhatsApp hace falta un teléfono.");
    if (channel === "email" && !email.trim()) return setError("Para recordar por correo hace falta un correo.");
    if (digits && store.clients.some((c) => c.id !== client?.id && c.phone.replace(/\D/g, "") === digits)) return setError("Ya hay otro cliente con ese teléfono.");

    const saved: Client = { id: client?.id ?? uid("c"), name: name.trim(), phone: phone.trim(), email: email.trim(), channel, notes: notes.trim() };
    store.setClients((list) => (client ? list.map((c) => (c.id === client.id ? saved : c)) : [...list, saved]));
    onSaved(saved, !client);
    onClose();
  }

  return (
    <form
      noValidate
      aria-label={client ? "Editar cliente" : "Nuevo cliente"}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" className="sm:col-span-2">
          {(id) => <input id={id} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}
        </Field>
        <Field label="Teléfono">{(id) => <input id={id} className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="off" />}</Field>
        <Field label="Correo">{(id) => <input id={id} type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />}</Field>
        <Field label="Recordatorios por" className="sm:col-span-2">
          {(id) => (
            <select id={id} className={inputClass} value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Correo</option>
              <option value="none">Ninguno (no enviar recordatorios)</option>
            </select>
          )}
        </Field>
        <Field label="Notas" className="sm:col-span-2">
          {(id) => <textarea id={id} rows={3} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alergias, preferencias, tipo de piel…" />}
        </Field>
      </div>
      <div className="mt-3">
        <FormError>{error}</FormError>
      </div>
      <div className="-mx-5 mt-5 -mb-4 flex justify-end gap-2 border-t border-border px-5 py-3">
        <Btn variant="ghost" onClick={onClose}>
          Cancelar
        </Btn>
        <Btn variant="primary" type="submit">
          Guardar
        </Btn>
      </div>
    </form>
  );
}
