import { useState } from "react";
import { formatMoney, matches } from "@/demos/kit/format";
import { downloadCsv } from "@/demos/kit/csv";
import { uid } from "@/demos/kit/storage";
import { Btn, Dialog, Field, FormError, Pill, SearchField, inputClass } from "@/demos/kit/ui";
import { DOC_TYPES, docLabel, type Bill, type Client, type DocType, type Project, type TimeEntry } from "./data";
import { formatHours, outstanding, unbilledSummary } from "./billing";
import { EmptyState } from "./shared";
import { isEmail } from "./util";

export function ClientsView({
  clients,
  projects,
  entries,
  bills,
  onNew,
  onEdit,
  onDelete,
  onNewBill,
  onReport,
}: {
  clients: Client[];
  projects: Project[];
  entries: TimeEntry[];
  bills: Bill[];
  onNew: () => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onNewBill: (clientId: string) => void;
  onReport: (clientId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [blocked, setBlocked] = useState<{ client: Client; reason: string } | null>(null);
  const [confirming, setConfirming] = useState<Client | null>(null);

  const visible = clients
    .filter((c) => !query.trim() || matches(`${c.name} ${c.docNumber} ${c.contact} ${c.email} ${c.city}`, query))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  function askDelete(client: Client) {
    const own = projects.filter((p) => p.clientId === client.id).length;
    const billCount = bills.filter((b) => b.clientId === client.id).length;
    if (billCount) {
      setBlocked({ client, reason: `"${client.name}" tiene ${billCount} ${billCount === 1 ? "cuenta de cobro" : "cuentas de cobro"}. Son un registro contable, así que el cliente no se puede eliminar.` });
    } else if (own) {
      setBlocked({ client, reason: `"${client.name}" tiene ${own} ${own === 1 ? "proyecto" : "proyectos"}. Pásalos a otro cliente desde Proyectos (Editar) antes de eliminarlo.` });
    } else setConfirming(client);
  }

  function exportCsv() {
    downloadCsv(
      "taskpro-clientes",
      ["Nombre o razón social", "Tipo de documento", "Número de documento", "Contacto", "Correo", "Ciudad", "Proyectos"],
      visible.map((c) => [c.name, c.docType, c.docNumber, c.contact, c.email, c.city, projects.filter((p) => p.clientId === c.id).map((p) => p.name).join(", ")]),
    );
  }

  if (clients.length === 0)
    return (
      <EmptyState
        title="Aún no tienes clientes"
        actions={
          <Btn variant="primary" onClick={onNew}>
            Nuevo cliente
          </Btn>
        }
      >
        Registra a quién le trabajas: su NIT o cédula y el correo salen en las cuentas de cobro y en los informes. Cada proyecto pertenece a un
        cliente.
      </EmptyState>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchField label="Buscar clientes" placeholder="Nombre, NIT, contacto o ciudad…" value={query} onChange={setQuery} />
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Btn size="sm" onClick={exportCsv} disabled={visible.length === 0} aria-label="Exportar clientes a CSV">
            Exportar CSV
          </Btn>
          <Btn variant="primary" onClick={onNew}>
            Nuevo cliente
          </Btn>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="px-2 py-8 text-center text-sm text-text-muted">Ningún cliente coincide con "{query}".</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((client) => {
            const own = projects.filter((p) => p.clientId === client.id);
            const pending = unbilledSummary(entries, projects, new Set(own.map((p) => p.id)));
            const owed = outstanding(bills.filter((b) => b.clientId === client.id));
            const incomplete = !client.docNumber || !client.email;
            return (
              <li key={client.id} className="flex flex-col rounded-lg border border-border bg-bg">
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 text-base font-semibold break-words text-text">{client.name}</h3>
                    {incomplete && <Pill tone="warning">Datos incompletos</Pill>}
                  </div>
                  <p className="text-[13px] text-text-muted">{docLabel(client.docType, client.docNumber)}</p>
                  <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px]">
                    <dt className="text-text-subtle">Contacto</dt>
                    <dd className="text-text">{client.contact || "—"}</dd>
                    <dt className="text-text-subtle">Correo</dt>
                    <dd className="break-all text-text">{client.email || "—"}</dd>
                    <dt className="text-text-subtle">Ciudad</dt>
                    <dd className="text-text">{client.city || "—"}</dd>
                    <dt className="text-text-subtle">Proyectos</dt>
                    <dd className="text-text">{own.length ? own.map((p) => p.name).join(", ") : "Ninguno"}</dd>
                  </dl>
                  <p className="mt-1 text-[13px] text-text-muted tabular-nums">
                    Por cobrar: <span className="font-semibold text-text">{formatMoney(pending.value)}</span> ({formatHours(pending.minutes)})
                    {owed.count > 0 && <span className="text-warning"> · {formatMoney(owed.total)} enviados sin pagar</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 border-t border-border px-3 py-2">
                  <Btn variant="ghost" size="sm" onClick={() => onNewBill(client.id)} disabled={own.length === 0} aria-label={`Nueva cuenta de cobro para "${client.name}"`}>
                    Cobrar
                  </Btn>
                  <Btn variant="ghost" size="sm" onClick={() => onReport(client.id)} disabled={own.length === 0} aria-label={`Informe para "${client.name}"`}>
                    Informe
                  </Btn>
                  <Btn variant="ghost" size="sm" onClick={() => onEdit(client)} aria-label={`Editar "${client.name}"`}>
                    Editar
                  </Btn>
                  <Btn variant="ghost" size="sm" onClick={() => askDelete(client)} aria-label={`Eliminar "${client.name}"`}>
                    Eliminar
                  </Btn>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={blocked != null} onClose={() => setBlocked(null)} title="No se puede eliminar">
        <p className="text-sm text-text">{blocked?.reason}</p>
        <div className="mt-5 flex justify-end">
          <Btn variant="primary" onClick={() => setBlocked(null)}>
            Entendido
          </Btn>
        </div>
      </Dialog>
      <Dialog open={confirming != null} onClose={() => setConfirming(null)} title="Eliminar cliente">
        <p className="text-sm text-text">¿Eliminar a "{confirming?.name}"? No tiene proyectos ni cuentas de cobro.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => setConfirming(null)}>
            Cancelar
          </Btn>
          <Btn
            variant="danger"
            onClick={() => {
              if (confirming) onDelete(confirming);
              setConfirming(null);
            }}
          >
            Eliminar
          </Btn>
        </div>
      </Dialog>
    </div>
  );
}

/** Solo dígitos, puntos y un dígito de verificación opcional: "900.123.456-7", "1036987654". */
function validDocNumber(type: DocType, value: string) {
  if (type === "PP") return /^[A-Za-z0-9-]{5,20}$/.test(value);
  return /^\d{1,3}(\.?\d{3}){1,4}(-\d)?$/.test(value);
}

export function ClientDialog({ client, clients, onClose, onSave }: { client: Client | null; clients: Client[]; onClose: () => void; onSave: (client: Client) => void }) {
  const [name, setName] = useState(client?.name ?? "");
  const [docType, setDocType] = useState<DocType>(client?.docType ?? "NIT");
  const [docNumber, setDocNumber] = useState(client?.docNumber ?? "");
  const [contact, setContact] = useState(client?.contact ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [city, setCity] = useState(client?.city ?? "");
  const [error, setError] = useState("");

  function submit() {
    const cleanName = name.trim();
    const cleanDoc = docNumber.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName) return setError("Escribe el nombre o la razón social.");
    if (clients.some((c) => c.id !== client?.id && c.name.trim().toLowerCase() === cleanName.toLowerCase())) return setError("Ya existe un cliente con ese nombre.");
    if (!cleanDoc) return setError(docType === "NIT" ? "Escribe el NIT." : "Escribe el número de documento.");
    if (!validDocNumber(docType, cleanDoc)) return setError(docType === "PP" ? "El pasaporte solo lleva letras, números y guiones." : "El documento solo lleva números y puntos, con el dígito de verificación opcional tras un guion (p. ej. 900.123.456-7).");
    const digits = (s: string) => s.replace(/[^0-9A-Za-z]/g, "").toLowerCase();
    if (clients.some((c) => c.id !== client?.id && c.docNumber && digits(c.docNumber.split("-")[0]) === digits(cleanDoc.split("-")[0]))) return setError("Ya hay un cliente con ese número de documento.");
    if (cleanEmail && !isEmail(cleanEmail)) return setError("El correo no tiene una forma válida (nombre@dominio.co).");
    onSave({ id: client?.id ?? uid("c"), name: cleanName, docType, docNumber: cleanDoc, contact: contact.trim(), email: cleanEmail, city: city.trim(), createdAt: client?.createdAt ?? Date.now() });
  }

  return (
    <Dialog open onClose={onClose} title={client ? "Editar cliente" : "Nuevo cliente"} onSubmit={submit}>
      <div className="flex flex-col gap-4">
        <Field label="Nombre o razón social">{(id) => <input id={id} className={inputClass} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} autoFocus />}</Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tipo de documento">
            {(id) => (
              <select id={id} className={inputClass} value={docType} onChange={(e) => setDocType(e.target.value as DocType)}>
                {DOC_TYPES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="NIT o número de documento">
            {(id) => <input id={id} className={inputClass} value={docNumber} maxLength={20} placeholder={docType === "NIT" ? "900.123.456-7" : ""} onChange={(e) => setDocNumber(e.target.value)} />}
          </Field>
        </div>
        <Field label="Persona de contacto" hint="Opcional">
          {(id) => <input id={id} className={inputClass} value={contact} maxLength={80} onChange={(e) => setContact(e.target.value)} />}
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Correo" hint="Opcional; a donde envías las cuentas">
            {(id) => <input id={id} type="text" inputMode="email" autoComplete="off" className={inputClass} value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field label="Ciudad" hint="Opcional">
            {(id) => <input id={id} className={inputClass} value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} />}
          </Field>
        </div>
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}
