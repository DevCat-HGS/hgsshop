import { useState } from "react";
import { formatDateLong, formatMoney, formatTime, fromDateInput, toDateInput } from "@/demos/kit/format";
import { uid } from "@/demos/kit/storage";
import { Btn, ConfirmButton, Dialog, Field, FormError, inputClass, Pill } from "@/demos/kit/ui";
import {
  apptEnd,
  atMinutes,
  durationLabel,
  minutesLabel,
  minutesOfDay,
  STATUS_LABEL,
  STATUS_TONE,
  TIME_OPTIONS,
  validateSlot,
  type Appointment,
  type ApptStatus,
  type Editor,
} from "./data";
import { Receipt } from "./Receipt";
import { RejectDialog } from "./Requests";
import { confirmRequest, rejectRequest, type ClientiaStore } from "./store";

const NEW_CLIENT = "__nuevo";

/** Diálogo para crear, editar, reprogramar, cancelar o marcar la asistencia de una cita. */
export function AppointmentDialog({ store, editor, onClose, notify }: { store: ClientiaStore; editor: Editor | null; onClose: () => void; notify: (msg: string) => void }) {
  return (
    <Dialog open={editor !== null} onClose={onClose} title={editor?.mode === "edit" ? "Cita" : "Nueva cita"} wide>
      {editor && <AppointmentForm key={editor.mode === "edit" ? editor.id : `new-${editor.start ?? ""}`} store={store} editor={editor} onClose={onClose} notify={notify} />}
    </Dialog>
  );
}

/** Primera franja libre en los próximos 14 días, para proponer una hora al crear con el botón. */
function firstFreeSlot(store: ClientiaStore, professionalId: string, duration: number) {
  for (let d = 0; d < 14; d++) {
    for (const m of TIME_OPTIONS) {
      const start = atMinutes(store.now + d * 86_400_000, m);
      if (!validateSlot({ clientId: "", professionalId, start, duration }, store)) return start;
    }
  }
  return atMinutes(store.now, 9 * 60);
}

function AppointmentForm({ store, editor, onClose, notify }: { store: ClientiaStore; editor: Editor; onClose: () => void; notify: (msg: string) => void }) {
  const { clients, services, professionals, appointments, setAppointments, setClients, now } = store;
  const existing = editor.mode === "edit" ? appointments.find((a) => a.id === editor.id) : undefined;

  const [initial] = useState(() => {
    if (existing) return existing;
    const proId = (editor.mode === "new" && editor.professionalId) || professionals[0]?.id || "";
    const service = services[0];
    const start = (editor.mode === "new" && editor.start) || firstFreeSlot(store, proId, service?.duration ?? 30);
    return { clientId: (editor.mode === "new" && editor.clientId) || "", serviceId: service?.id ?? "", professionalId: proId, start, note: "" };
  });

  const [clientId, setClientId] = useState(initial.clientId);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [serviceId, setServiceId] = useState(services.some((s) => s.id === initial.serviceId) ? initial.serviceId : "");
  const [professionalId, setProfessionalId] = useState(initial.professionalId);
  const [date, setDate] = useState(toDateInput(initial.start));
  const [time, setTime] = useState(String(minutesOfDay(initial.start)));
  const [note, setNote] = useState(initial.note);
  const [error, setError] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Las solicitudes por confirmar se pueden mover de hora antes de confirmarlas; las ya marcadas, no.
  const locked = existing !== undefined && existing.status !== "scheduled" && existing.status !== "pending";
  const service = services.find((s) => s.id === serviceId);
  const duration = service?.duration ?? existing?.duration ?? 30;
  const isPast = existing !== undefined && existing.start <= now;

  function save() {
    if (clientId === NEW_CLIENT && !newName.trim()) return setError("Escribe el nombre del cliente nuevo.");
    if (!clientId) return setError("Elige un cliente.");
    if (!serviceId && !existing) return setError("Elige un servicio.");
    if (!professionalId) return setError("Elige una profesional.");
    if (!date) return setError("Elige una fecha.");

    const start = atMinutes(fromDateInput(date), Number(time));
    const finalClientId = clientId === NEW_CLIENT ? uid("c") : clientId;
    const changedSlot =
      !existing ||
      existing.start !== start ||
      existing.professionalId !== professionalId ||
      existing.clientId !== finalClientId ||
      (service !== undefined && existing.serviceId !== service.id);

    if (changedSlot && !locked) {
      const problem = validateSlot({ id: existing?.id, clientId: finalClientId, professionalId, start, duration }, store);
      if (problem) return setError(problem);
    }

    if (clientId === NEW_CLIENT) {
      setClients((list) => [...list, { id: finalClientId, name: newName.trim(), phone: newPhone.trim(), email: "", notes: "", channel: newPhone.trim() ? "whatsapp" : "none" }]);
    }

    const snapshot = service ? { serviceId: service.id, serviceName: service.name, duration: service.duration, price: service.price } : {};
    if (existing) {
      setAppointments((list) =>
        list.map((a) => (a.id === existing.id ? { ...a, ...snapshot, clientId: finalClientId, professionalId, start: locked ? a.start : start, note: note.trim() } : a)),
      );
      notify(existing.start !== start && !locked ? "Cita reprogramada" : "Cita actualizada");
    } else if (service) {
      const created: Appointment = {
        id: uid("a"),
        clientId: finalClientId,
        serviceId: service.id,
        serviceName: service.name,
        duration: service.duration,
        price: service.price,
        professionalId,
        start,
        note: note.trim(),
        status: "scheduled",
      };
      setAppointments((list) => [...list, created].sort((a, b) => a.start - b.start));
      notify("Cita agendada");
    }
    onClose();
  }

  function setStatus(status: ApptStatus) {
    if (!existing) return;
    if (status === "scheduled" && existing.status === "cancelled") {
      const problem = validateSlot({ ...existing }, store, { allowPast: existing.start <= now });
      if (problem) return setError(`No se puede reactivar: ${problem}`);
    }
    setAppointments((list) => list.map((a) => (a.id === existing.id ? { ...a, status } : a)));
    notify(
      status === "attended" ? "Asistencia registrada" : status === "no_show" ? "Inasistencia registrada" : status === "cancelled" ? "Cita cancelada" : "Cita reactivada",
    );
    onClose();
  }

  function confirmPending() {
    if (!existing) return;
    const problem = confirmRequest(store, existing);
    if (problem) return setError(problem);
    const c = clients.find((x) => x.id === existing.clientId);
    notify(c && c.channel !== "none" ? "Reserva confirmada: ya está en los recordatorios" : "Reserva confirmada");
    onClose();
  }

  const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const clientName = clients.find((c) => c.id === existing?.clientId)?.name ?? "este cliente";

  if (existing && showReceipt) {
    return (
      <Receipt
        appt={existing}
        client={clients.find((c) => c.id === existing.clientId)}
        pro={professionals.find((p) => p.id === existing.professionalId)}
        business={store.business}
        rules={store.rules}
        actions={
          <Btn variant="ghost" onClick={() => setShowReceipt(false)}>
            ← Volver a la cita
          </Btn>
        }
      />
    );
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        noValidate
        aria-label={existing ? "Editar cita" : "Nueva cita"}
      >
        {existing && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-border bg-bg px-3 py-2.5 text-sm">
            <Pill tone={STATUS_TONE[existing.status]}>{existing.status === "scheduled" && isPast ? "Por marcar" : STATUS_LABEL[existing.status]}</Pill>
            <span className="text-text-muted">
              {formatDateLong(existing.start)}, {formatTime(existing.start)} a {formatTime(apptEnd(existing))} · {formatMoney(existing.price)}
            </span>
          </div>
        )}
  
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente">
            {(id) => (
              <select id={id} className={inputClass} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Elige un cliente…</option>
                {sortedClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value={NEW_CLIENT}>+ Cliente nuevo</option>
              </select>
            )}
          </Field>
          <Field label="Servicio" hint={service ? `${durationLabel(service.duration)} · ${formatMoney(service.price)}` : existing ? `${existing.serviceName} (servicio eliminado)` : undefined}>
            {(id) => (
              <select id={id} className={inputClass} value={serviceId} disabled={locked} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">{existing && !service ? existing.serviceName : "Elige un servicio…"}</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({durationLabel(s.duration)})
                  </option>
                ))}
              </select>
            )}
          </Field>
  
          {clientId === NEW_CLIENT && (
            <>
              <Field label="Nombre del cliente nuevo">
                {(id) => <input id={id} className={inputClass} value={newName} onChange={(e) => setNewName(e.target.value)} autoComplete="off" />}
              </Field>
              <Field label="Teléfono del cliente nuevo" hint="Opcional. Con teléfono, recibe recordatorios por WhatsApp.">
                {(id) => <input id={id} className={inputClass} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} inputMode="tel" autoComplete="off" />}
              </Field>
            </>
          )}
  
          <Field label="Profesional">
            {(id) => (
              <select id={id} className={inputClass} value={professionalId} disabled={locked} onChange={(e) => setProfessionalId(e.target.value)}>
                <option value="">Elige una profesional…</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha">{(id) => <input id={id} type="date" className={inputClass} value={date} disabled={locked} onChange={(e) => setDate(e.target.value)} />}</Field>
            <Field label="Hora">
              {(id) => (
                <select id={id} className={inputClass} value={time} disabled={locked} onChange={(e) => setTime(e.target.value)}>
                  {TIME_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {minutesLabel(m)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <Field label="Nota" className="sm:col-span-2">
            {(id) => <textarea id={id} rows={2} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Indicaciones, preferencias, abonos…" />}
          </Field>
        </div>
  
        {locked && <p className="mt-3 text-[13px] text-text-subtle">La cita ya está marcada como “{STATUS_LABEL[existing.status].toLowerCase()}”: para reprogramarla, primero restablécela.</p>}
        <div className="mt-3">
          <FormError>{error}</FormError>
        </div>
  
        {existing && (
          <section aria-label="Estado de la cita" className="mt-4 rounded-md border border-border bg-bg p-3">
            <h3 className="text-[13px] font-semibold text-text-muted">Estado de la cita</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {existing.status === "pending" && (
                <>
                  <Btn size="sm" variant="primary" onClick={confirmPending}>
                    Confirmar reserva
                  </Btn>
                  <Btn size="sm" variant="danger" onClick={() => setRejecting(true)}>
                    Rechazar…
                  </Btn>
                </>
              )}
              {(existing.status === "pending" || existing.status === "scheduled") && (
                <Btn size="sm" variant="ghost" onClick={() => setShowReceipt(true)}>
                  Comprobante
                </Btn>
              )}
              {existing.status === "scheduled" && (
                <>
                  <Btn size="sm" onClick={() => setStatus("attended")} disabled={!isPast}>
                    Asistió
                  </Btn>
                  <Btn size="sm" onClick={() => setStatus("no_show")} disabled={!isPast}>
                    No asistió
                  </Btn>
                  <ConfirmButton
                    label="Cancelar cita"
                    title="Cancelar cita"
                    message={`La cita de ${clientName} queda cancelada y la franja se libera en la agenda.`}
                    confirmLabel="Cancelar cita"
                    onConfirm={() => setStatus("cancelled")}
                  />
                </>
              )}
              {(existing.status === "attended" || existing.status === "no_show") && (
                <Btn size="sm" variant="ghost" onClick={() => setStatus("scheduled")}>
                  Restablecer asistencia
                </Btn>
              )}
              {existing.status === "cancelled" && (
                <Btn size="sm" variant="ghost" onClick={() => setStatus("scheduled")}>
                  Reactivar cita
                </Btn>
              )}
            </div>
            {existing.status === "scheduled" && !isPast && <p className="mt-2 text-[12px] text-text-subtle">La asistencia se marca cuando llega la hora de la cita.</p>}
            {existing.status === "pending" && <p className="mt-2 text-[12px] text-text-subtle">Reserva hecha en línea por el cliente. Al confirmarla se programa su recordatorio.</p>}
            {existing.reason && <p className="mt-2 text-[13px] text-text">Motivo: {existing.reason}</p>}
          </section>
        )}
  
        <div className="-mx-5 mt-5 -mb-4 flex justify-end gap-2 border-t border-border px-5 py-3">
          <Btn variant="ghost" onClick={onClose}>
            Cerrar
          </Btn>
          <Btn variant="primary" type="submit">
            {existing ? "Guardar cambios" : "Agendar cita"}
          </Btn>
        </div>
      </form>
      {existing && (
        <RejectDialog
          appt={rejecting ? existing : null}
          clientName={clientName}
          onClose={() => setRejecting(false)}
          onReject={(reason) => {
            rejectRequest(store, existing.id, reason);
            notify("Solicitud rechazada: la franja quedó libre");
            onClose();
          }}
        />
      )}
    </>
  );
}
