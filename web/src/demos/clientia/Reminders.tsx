import { useRef, useState } from "react";
import { formatDate, formatDateTime, formatTime } from "@/demos/kit/format";
import { Btn, Dialog, Empty, Field, FormError, inputClass, Panel, Pill, Table } from "@/demos/kit/ui";
import { buildReminders, CHANNEL_LABEL, DEFAULT_TEMPLATE, LEAD_LABEL, renderTemplate, type Reminder, type ReminderLead, type ReminderSettings } from "./data";
import type { ClientiaStore } from "./store";

const VARIABLES = ["{cliente}", "{servicio}", "{fecha}", "{hora}", "{profesional}", "{negocio}"];
const STATE_LABEL: Record<Reminder["state"], string> = { scheduled: "Programado", sent: "Enviado (simulado)", skipped: "Omitido: sin canal" };

export function Reminders({ store, notify }: { store: ClientiaStore; notify: (msg: string) => void }) {
  const { reminders: settings, appointments, clients, professionals, now } = store;
  const [stateFilter, setStateFilter] = useState<"all" | Reminder["state"]>("all");
  const [preview, setPreview] = useState<Reminder | null>(null);

  const outbox = buildReminders(settings, appointments, clients, now);
  const visible = outbox.filter((r) => stateFilter === "all" || r.state === stateFilter);
  const count = (s: Reminder["state"]) => outbox.filter((r) => r.state === s).length;
  const proOf = (r: Reminder) => professionals.find((p) => p.id === r.appointment.professionalId);

  return (
    <div className="flex flex-col gap-4">
      <div role="note" className="rounded-lg border border-brand/40 bg-brand-muted px-4 py-3 text-sm text-text">
        <strong className="font-semibold">Simulación:</strong> en esta demo no se envía ningún mensaje real por WhatsApp ni por correo. La bandeja muestra lo que Clientia
        enviaría y marca como “enviado (simulado)” los recordatorios cuya hora ya pasó.
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 2xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <SettingsForm key={JSON.stringify(settings)} store={store} notify={notify} />

        <Panel
          title="Bandeja de salida"
          actions={
            <Field label="Estado" className="w-48">
              {(id) => (
                <select id={id} className={`${inputClass} py-1.5`} value={stateFilter} onChange={(e) => setStateFilter(e.target.value as typeof stateFilter)}>
                  <option value="all">Todos ({outbox.length})</option>
                  <option value="scheduled">Programados ({count("scheduled")})</option>
                  <option value="sent">Enviados, simulado ({count("sent")})</option>
                  <option value="skipped">Omitidos ({count("skipped")})</option>
                </select>
              )}
            </Field>
          }
        >
          {!settings.enabled ? (
            <Empty>Los recordatorios están desactivados. Actívalos en la configuración para generar la bandeja.</Empty>
          ) : visible.length === 0 ? (
            <Empty>No hay recordatorios en este estado.</Empty>
          ) : (
            <div className="-m-4">
              <Table label="Bandeja de salida de recordatorios" head={["Envío", "Cliente", "Canal", "Cita", "Estado", "Mensaje"]} minWidth="44rem">
                {visible.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap tabular-nums">
                      {formatDateTime(r.sendAt)}
                      <span className="block text-[12px] text-text-subtle">{r.lead} h antes</span>
                    </td>
                    <th scope="row" className="font-semibold text-text">
                      {r.client?.name ?? "Cliente eliminado"}
                    </th>
                    <td>{r.client ? CHANNEL_LABEL[r.client.channel] : "—"}</td>
                    <td className="whitespace-nowrap">
                      {formatDate(r.appointment.start)}, {formatTime(r.appointment.start)}
                      <span className="block text-[12px] text-text-subtle">{r.appointment.serviceName}</span>
                    </td>
                    <td>
                      <Pill tone={r.state === "sent" ? "success" : r.state === "scheduled" ? "brand" : "neutral"}>{STATE_LABEL[r.state]}</Pill>
                    </td>
                    <td>
                      <Btn size="sm" variant="ghost" onClick={() => setPreview(r)} aria-label={`Ver mensaje para ${r.client?.name ?? "cliente"} (${r.lead} h antes)`}>
                        Ver mensaje
                      </Btn>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </Panel>
      </div>

      <Dialog open={preview !== null} onClose={() => setPreview(null)} title="Vista previa del recordatorio">
        {preview && (
          <div className="flex flex-col gap-3 text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-text-muted">Para</dt>
              <dd className="text-text">
                {preview.client?.name}
                {preview.client?.channel === "whatsapp" && ` · WhatsApp ${preview.client.phone}`}
                {preview.client?.channel === "email" && ` · ${preview.client.email}`}
              </dd>
              <dt className="text-text-muted">Envío</dt>
              <dd className="text-text">
                {formatDateTime(preview.sendAt)} ({preview.lead} h antes)
              </dd>
              <dt className="text-text-muted">Estado</dt>
              <dd>
                <Pill tone={preview.state === "sent" ? "success" : preview.state === "scheduled" ? "brand" : "neutral"}>{STATE_LABEL[preview.state]}</Pill>
              </dd>
              {preview.client?.channel === "email" && (
                <>
                  <dt className="text-text-muted">Asunto</dt>
                  <dd className="text-text">Recordatorio de tu cita en {store.business.name}</dd>
                </>
              )}
            </dl>
            <p className="rounded-lg border border-border bg-bg px-4 py-3 whitespace-pre-wrap text-text">{renderTemplate(settings.template, preview.appointment, preview.client, proOf(preview), store.business.name)}</p>
            <p className="text-[12px] text-text-subtle">
              {preview.state === "skipped"
                ? "Este cliente eligió no recibir recordatorios, así que no se enviaría."
                : "Mensaje simulado: en la demo no sale nada de tu navegador."}
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function SettingsForm({ store, notify }: { store: ClientiaStore; notify: (msg: string) => void }) {
  const { reminders } = store;
  const [draft, setDraft] = useState<ReminderSettings>(reminders);
  const [error, setError] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(reminders);

  const sample = store.appointments.find((a) => a.status === "scheduled" && a.start > store.now);
  const sampleClient = store.clients.find((c) => c.id === sample?.clientId);
  const samplePro = store.professionals.find((p) => p.id === sample?.professionalId);

  function insert(variable: string) {
    const el = textRef.current;
    const at = el ? el.selectionStart : draft.template.length;
    const end = el ? el.selectionEnd : at;
    setDraft((d) => ({ ...d, template: d.template.slice(0, at) + variable + d.template.slice(end) }));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + variable.length, at + variable.length);
    });
  }

  function save() {
    const text = draft.template.trim();
    if (!text) return setError("La plantilla no puede quedar vacía.");
    if (text.length > 500) return setError("La plantilla es muy larga (máximo 500 caracteres).");
    const unknown = (text.match(/\{[^}]*\}/g) ?? []).find((v) => !VARIABLES.includes(v));
    if (unknown) return setError(`La variable ${unknown} no existe. Usa ${VARIABLES.join(", ")}.`);
    if (!text.includes("{fecha}") || !text.includes("{hora}")) return setError("Incluye {fecha} y {hora} para que el cliente sepa cuándo es su cita.");
    store.setReminders({ ...draft, template: text });
    notify("Configuración de recordatorios guardada");
  }

  return (
    <Panel title="Configuración">
      <form
        aria-label="Configuración de recordatorios"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex flex-col gap-4"
      >
        <label className="flex items-center gap-2 text-sm font-semibold text-text">
          <input type="checkbox" className="size-4 accent-brand" checked={draft.enabled} onChange={(e) => setDraft((d) => ({ ...d, enabled: e.target.checked }))} />
          Enviar recordatorios automáticos
        </label>

        <fieldset disabled={!draft.enabled} className="flex min-w-0 flex-col gap-4 disabled:opacity-60">
          <fieldset className="min-w-0">
            <legend className="text-[13px] font-semibold text-text-muted">Anticipación</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(["24", "3", "both"] as ReminderLead[]).map((lead) => (
                <label key={lead} className="flex items-center gap-2 rounded-md border border-border-strong px-3 py-1.5 text-sm text-text">
                  <input type="radio" name="anticipacion" className="accent-brand" checked={draft.lead === lead} onChange={() => setDraft((d) => ({ ...d, lead }))} />
                  {LEAD_LABEL[lead]}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Plantilla del mensaje" hint="Las variables se reemplazan con los datos de cada cita.">
            {(id) => (
              <textarea
                id={id}
                ref={textRef}
                rows={4}
                className={inputClass}
                value={draft.template}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, template: e.target.value }));
                  setError("");
                }}
              />
            )}
          </Field>
          <div className="-mt-2 flex flex-wrap items-center gap-1.5">
            {VARIABLES.map((v) => (
              <Btn key={v} size="sm" variant="secondary" onClick={() => insert(v)} aria-label={`Insertar ${v}`}>
                {v}
              </Btn>
            ))}
            <Btn size="sm" variant="ghost" onClick={() => setDraft((d) => ({ ...d, template: DEFAULT_TEMPLATE }))}>
              Plantilla original
            </Btn>
          </div>
        </fieldset>

        {sample && (
          <div>
            <p className="text-[13px] font-semibold text-text-muted">Vista previa con la próxima cita</p>
            <p className="mt-1.5 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm whitespace-pre-wrap text-text">{renderTemplate(draft.template, sample, sampleClient, samplePro, store.business.name)}</p>
          </div>
        )}

        <FormError>{error}</FormError>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {dirty && <span className="mr-auto text-[13px] text-warning">Hay cambios sin guardar.</span>}
          <Btn variant="ghost" disabled={!dirty} onClick={() => setDraft(reminders)}>
            Descartar
          </Btn>
          <Btn variant="primary" type="submit" disabled={!dirty}>
            Guardar configuración
          </Btn>
        </div>
      </form>
    </Panel>
  );
}
