import { useState } from "react";
import { downloadCsv } from "@/demos/kit/csv";
import { formatDate, formatDateLong, formatMoney, formatTime } from "@/demos/kit/format";
import { Btn, Dialog, Empty, Field, FormError, inputClass, Panel, Pill } from "@/demos/kit/ui";
import { agoLabel, apptEnd, durationLabel, STATUS_LABEL, type Appointment, type Editor } from "./data";
import { confirmRequest, rejectRequest, type ClientiaStore } from "./store";

const QUICK_REASONS = ["Ese horario ya no está disponible.", "La profesional no atenderá ese día.", "Necesitamos hablar contigo antes de agendar este servicio."];

/** Diálogo para rechazar una solicitud con un motivo obligatorio. */
export function RejectDialog({ appt, clientName, onClose, onReject }: { appt: Appointment | null; clientName: string; onClose: () => void; onReject: (reason: string) => void }) {
  return (
    <Dialog open={appt !== null} onClose={onClose} title="Rechazar solicitud">
      {appt && <RejectForm key={appt.id} appt={appt} clientName={clientName} onClose={onClose} onReject={onReject} />}
    </Dialog>
  );
}

function RejectForm({ appt, clientName, onClose, onReject }: { appt: Appointment; clientName: string; onClose: () => void; onReject: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const text = reason.trim();
    if (text.length < 5) return setError("Escribe el motivo del rechazo: el cliente lo verá.");
    if (text.length > 200) return setError("El motivo es muy largo (máximo 200 caracteres).");
    onReject(text);
    onClose();
  }

  return (
    <form
      noValidate
      aria-label="Rechazar solicitud"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-4 text-sm"
    >
      <p className="text-text-muted">
        {clientName} pidió {appt.serviceName.toLowerCase()} el {formatDateLong(appt.start)} a las {formatTime(appt.start)}. Al rechazarla, la franja vuelve a quedar libre.
      </p>
      <Field label="Motivo del rechazo">
        {(id) => (
          <textarea
            id={id}
            rows={3}
            className={inputClass}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError("");
            }}
          />
        )}
      </Field>
      <div className="-mt-2 flex flex-wrap gap-1.5">
        {QUICK_REASONS.map((r) => (
          <Btn key={r} size="sm" onClick={() => setReason(r)} aria-label={`Usar motivo: ${r}`}>
            {r}
          </Btn>
        ))}
      </div>
      <FormError>{error}</FormError>
      <div className="-mx-5 -mb-4 flex justify-end gap-2 border-t border-border px-5 py-3">
        <Btn variant="ghost" onClick={onClose}>
          Cancelar
        </Btn>
        <Btn variant="danger" type="submit">
          Rechazar solicitud
        </Btn>
      </div>
    </form>
  );
}

/** Bandeja de solicitudes: reservas en línea "Por confirmar" y las ya respondidas. */
export function Requests({
  store,
  notify,
  onEdit,
  onOpenClient,
  onGoBooking,
}: {
  store: ClientiaStore;
  notify: (msg: string) => void;
  onEdit: (editor: Editor) => void;
  onOpenClient: (id: string) => void;
  onGoBooking: () => void;
}) {
  const { appointments, clients, professionals, rules, now } = store;
  const [rejecting, setRejecting] = useState<Appointment | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);

  const pending = appointments.filter((a) => a.status === "pending").sort((a, b) => a.start - b.start);
  const answered = appointments
    .filter((a) => a.source === "online" && a.status !== "pending" && a.requestedAt)
    .sort((a, b) => (b.requestedAt ?? 0) - (a.requestedAt ?? 0))
    .slice(0, 8);
  const client = (id: string) => clients.find((c) => c.id === id);
  const proName = (id: string) => professionals.find((p) => p.id === id)?.name ?? "Profesional eliminada";

  function confirm(a: Appointment) {
    const problem = confirmRequest(store, a);
    if (problem) return setError({ id: a.id, message: problem });
    setError(null);
    const c = client(a.clientId);
    notify(c && c.channel !== "none" ? "Reserva confirmada: ya está en los recordatorios" : "Reserva confirmada");
  }

  function exportCsv() {
    const rows = [...pending, ...answered];
    downloadCsv(
      "clientia-solicitudes",
      ["Solicitada", "Cliente", "Teléfono", "Servicio", "Profesional", "Fecha", "Hora", "Estado", "Motivo"],
      rows.map((a) => [
        a.requestedAt ? `${formatDate(a.requestedAt)} ${formatTime(a.requestedAt)}` : "",
        client(a.clientId)?.name ?? "Cliente eliminado",
        client(a.clientId)?.phone ?? "",
        a.serviceName,
        proName(a.professionalId),
        formatDate(a.start),
        formatTime(a.start),
        STATUS_LABEL[a.status],
        a.reason ?? "",
      ]),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 text-sm text-text-muted">
          {rules.requireConfirmation
            ? "Las reservas que llegan por tu página entran aquí. Mientras esperan respuesta, su franja queda bloqueada en la agenda."
            : "Tus reservas en línea entran directo como programadas, sin pasar por esta bandeja. Puedes exigir confirmación en Reservas en línea › Reglas."}
        </p>
        <Btn size="sm" onClick={exportCsv} disabled={pending.length + answered.length === 0} aria-label="Exportar solicitudes a CSV">
          Exportar CSV
        </Btn>
      </div>

      <Panel title={`Por confirmar (${pending.length})`}>
        {pending.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-text-muted">No hay solicitudes por confirmar. Comparte tu página de reservas para recibir citas en línea.</p>
            <Btn variant="primary" onClick={onGoBooking}>
              Ver la página de reservas
            </Btn>
          </div>
        ) : (
          <ul className="-my-2 divide-y divide-border" aria-label="Solicitudes por confirmar">
            {pending.map((a) => {
              const c = client(a.clientId);
              const name = c?.name ?? "Cliente eliminado";
              const expired = a.start <= now;
              return (
                <li key={a.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => c && onOpenClient(c.id)} className="text-left text-sm font-semibold text-text hover:text-brand">
                        {name}
                      </button>
                      {expired ? <Pill tone="danger">Hora vencida</Pill> : <Pill tone="warning">Por confirmar</Pill>}
                    </p>
                    <p className="mt-0.5 text-sm text-text">
                      {a.serviceName} · {formatDateLong(a.start)}, {formatTime(a.start)} a {formatTime(apptEnd(a))}
                    </p>
                    <p className="text-[12px] text-text-muted">
                      {proName(a.professionalId)} · {durationLabel(a.duration)} · {formatMoney(a.price)}
                      {c?.phone ? ` · ${c.phone}` : ""}
                      {a.requestedAt ? ` · Solicitada ${agoLabel(a.requestedAt, now)}` : ""}
                    </p>
                    {error?.id === a.id && (
                      <p role="alert" className="mt-1 text-[13px] text-danger">
                        {error.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Btn size="sm" variant="primary" onClick={() => confirm(a)} disabled={expired} aria-label={`Confirmar la reserva de ${name}`}>
                      Confirmar
                    </Btn>
                    <Btn size="sm" variant="danger" onClick={() => setRejecting(a)} aria-label={`Rechazar la reserva de ${name}`}>
                      Rechazar
                    </Btn>
                    <Btn size="sm" variant="ghost" onClick={() => onEdit({ mode: "edit", id: a.id })} aria-label={`Ver la cita de ${name}`}>
                      Ver cita
                    </Btn>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Respondidas recientemente">
        {answered.length === 0 ? (
          <Empty>Aquí verás las reservas en línea ya confirmadas, rechazadas o canceladas.</Empty>
        ) : (
          <ul className="-my-2 divide-y divide-border" aria-label="Solicitudes respondidas">
            {answered.map((a) => (
              <li key={a.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text">{client(a.clientId)?.name ?? "Cliente eliminado"}</p>
                  <p className="text-[12px] text-text-muted">
                    {a.serviceName} · {formatDate(a.start)}, {formatTime(a.start)}
                  </p>
                  {a.reason && <p className="mt-1 text-[13px] text-text">Motivo: {a.reason}</p>}
                </div>
                <Pill tone={a.status === "rejected" || a.status === "cancelled" ? "neutral" : "success"}>{a.status === "scheduled" ? "Confirmada" : STATUS_LABEL[a.status]}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <RejectDialog
        appt={rejecting}
        clientName={rejecting ? (client(rejecting.clientId)?.name ?? "El cliente") : ""}
        onClose={() => setRejecting(null)}
        onReject={(reason) => {
          if (!rejecting) return;
          rejectRequest(store, rejecting.id, reason);
          notify("Solicitud rechazada: la franja quedó libre");
        }}
      />
    </div>
  );
}
