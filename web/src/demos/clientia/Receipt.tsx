import type { ReactNode } from "react";
import { formatDateLong, formatDateTime, formatMoney, formatTime } from "@/demos/kit/format";
import { Btn, Pill } from "@/demos/kit/ui";
import { apptEnd, cancelSummary, durationLabel, receiptNumber, STATUS_LABEL, STATUS_TONE, type Appointment, type BookingRules, type BusinessSettings, type Client, type Professional } from "./data";

/*
 * Comprobante imprimible de una cita. Al imprimir solo queda el comprobante: en cada nivel se ocultan los hermanos
 * de la rama que lo contiene (también dentro de un diálogo), y sale en colores claros.
 */
const PRINT_CSS = `
@media print {
  @page { size: letter; margin: 14mm; }
  *:has(.cl-doc) { display: block !important; height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; position: static !important; padding: 0 !important; margin: 0 !important; border: 0 !important; background: #fff !important; box-shadow: none !important; width: auto !important; max-width: none !important; }
  *:has(.cl-doc) > :not(:has(.cl-doc)):not(.cl-doc) { display: none !important; }
  .cl-doc { max-width: none !important; border: 0 !important; padding: 0 !important; background: #fff !important; color: #111 !important; font-size: 11pt; }
  .cl-doc * { color: #111 !important; border-color: #bbb !important; background: transparent !important; box-shadow: none !important; }
  .cl-doc .cl-muted { color: #555 !important; }
  .cl-doc section { break-inside: avoid; }
  .cl-no-print { display: none !important; }
}
`;

/** Comprobante de la cita para el cliente, con los datos del negocio y la política de cancelación. */
export function Receipt({
  appt,
  client,
  pro,
  business,
  rules,
  actions,
}: {
  appt: Appointment;
  client: Client | undefined;
  pro: Professional | undefined;
  business: BusinessSettings;
  rules: BookingRules;
  /** Botones junto a "Imprimir" (volver, nueva reserva…). */
  actions?: ReactNode;
}) {
  const code = receiptNumber(appt);
  const statusText = appt.status === "scheduled" ? "Confirmada" : STATUS_LABEL[appt.status];
  return (
    <div className="flex flex-col gap-4">
      <style>{PRINT_CSS}</style>
      <div className="cl-no-print flex flex-wrap items-center justify-end gap-2">
        {actions}
        <Btn variant="primary" onClick={() => window.print()}>
          Imprimir comprobante
        </Btn>
      </div>
      <article aria-label={`Comprobante de la cita ${code}`} className="cl-doc mx-auto w-full max-w-xl rounded-lg border border-border bg-bg p-5 text-sm sm:p-7">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div className="min-w-0">
            <p className="font-display text-xl text-text">{business.name}</p>
            <p className="cl-muted text-[12px] text-text-muted">{[business.address, business.phone && `Tel. ${business.phone}`].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="text-right">
            <p className="cl-muted text-[12px] text-text-muted">Comprobante de reserva</p>
            <p className="text-lg font-semibold text-text tabular-nums">#{code}</p>
          </div>
        </header>

        <section aria-label="Estado" className="mt-4 flex flex-wrap items-center gap-2">
          <Pill tone={appt.status === "scheduled" ? "success" : STATUS_TONE[appt.status]}>{statusText}</Pill>
          <span className="cl-muted text-[13px] text-text-muted">
            {appt.status === "pending" ? "Te avisaremos cuando el negocio confirme tu cita." : appt.status === "scheduled" ? "Tu cita está confirmada. Te enviaremos un recordatorio." : ""}
          </span>
        </section>

        <dl className="mt-4 grid gap-x-6 gap-y-1.5">
          <Row label="Cliente" value={client ? `${client.name}${client.phone ? ` · ${client.phone}` : ""}` : "—"} />
          <Row label="Servicio" value={`${appt.serviceName} (${durationLabel(appt.duration)})`} />
          <Row label="Profesional" value={pro?.name ?? "—"} />
          <Row label="Fecha" value={formatDateLong(appt.start)} />
          <Row label="Hora" value={`${formatTime(appt.start)} a ${formatTime(apptEnd(appt))}`} />
          <Row label="Valor (se paga en el local)" value={formatMoney(appt.price)} />
        </dl>

        <section aria-label="Política de cancelación" className="mt-5 rounded-md border border-border px-4 py-3">
          <p className="font-semibold text-text">Si no puedes asistir</p>
          <p className="cl-muted mt-1 text-text-muted">
            {cancelSummary(rules)} Usa el código <span className="font-semibold text-text">#{code}</span> y tu teléfono en la página de reservas
            {business.phone ? `, o llámanos al ${business.phone}` : ""}.
          </p>
        </section>

        <p className="cl-muted mt-5 text-[12px] text-text-subtle">
          {appt.requestedAt ? `Reservada el ${formatDateTime(appt.requestedAt)}. ` : ""}Comprobante generado por Clientia.
        </p>
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-3 border-b border-border py-1.5">
      <dt className="cl-muted text-text-muted">{label}</dt>
      <dd className="text-right text-text">{value}</dd>
    </div>
  );
}
