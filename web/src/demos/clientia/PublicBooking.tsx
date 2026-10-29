import { useMemo, useState, type ReactNode } from "react";
import { formatDate, formatMoney, formatTime } from "@/demos/kit/format";
import { Btn, Field, FormError, inputClass } from "@/demos/kit/ui";
import {
  bookableSlots,
  bookingDays,
  bookOnline,
  cancelOnline,
  cancelSummary,
  durationLabel,
  receiptNumber,
  rulesSummary,
  WEEKDAYS,
  WEEKDAYS_SHORT,
  type Appointment,
} from "./data";
import { ClientiaLogo } from "./Logo";
import { Receipt } from "./Receipt";
import type { ClientiaStore } from "./store";

const ANY = "any";

/**
 * Página pública de reservas: lo que ve el cliente final al abrir el enlace del negocio. Ofrece solo las horas
 * realmente libres (horario, descansos, días de cada profesional, citas existentes y reglas de anticipación).
 */
export function PublicBooking({ store, notify }: { store: ClientiaStore; notify: (msg: string) => void }) {
  const { business, rules, services, professionals, schedule, appointments, clients, now } = store;
  const [serviceId, setServiceId] = useState("");
  const [proId, setProId] = useState(ANY);
  const [day, setDay] = useState<number | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<Appointment | null>(null);

  const service = services.find((s) => s.id === serviceId);
  const ctx = useMemo(() => ({ schedule, professionals, appointments, clients, now }), [schedule, professionals, appointments, clients, now]);

  // Días de la ventana de reserva con al menos una hora libre para el servicio y la profesional elegidos.
  const days = useMemo(() => {
    if (!service) return [];
    return bookingDays(schedule, rules, now).map((d) => ({ day: d, slots: bookableSlots(ctx, service, proId, d, rules, now) }));
  }, [ctx, service, proId, schedule, rules, now]);
  const current = days.find((d) => d.day === day) ?? days.find((d) => d.slots.length > 0);
  const slot = current?.slots.find((s) => s.start === start);
  const slotPro = slot && professionals.find((p) => p.id === slot.professionalId);

  function pickService(id: string) {
    setServiceId(id);
    setStart(null);
    setError("");
  }

  function submit() {
    if (!service) return setError("Elige un servicio.");
    if (!slot) return setError("Elige el día y la hora de tu cita.");
    const result = bookOnline({ clients, services, professionals, schedule, appointments, rules, now }, { serviceId, professionalId: proId, start: slot.start, name, phone });
    if ("error" in result) return setError(result.error);
    if (result.isNewClient) store.setClients((list) => [...list, result.client]);
    store.setAppointments((list) => [...list, result.appointment].sort((a, b) => a.start - b.start));
    setBooked(result.appointment);
    setError("");
    notify(result.appointment.status === "pending" ? "Reserva enviada: queda por confirmar" : "Reserva confirmada");
  }

  function reset() {
    setBooked(null);
    setServiceId("");
    setProId(ANY);
    setDay(null);
    setStart(null);
    setName("");
    setPhone("");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header className="flex items-start gap-3">
        <ClientiaLogo size={40} />
        <div className="min-w-0">
          <h3 className="font-display text-2xl text-text">{business.name}</h3>
          <p className="text-[13px] text-text-muted">{[business.address, business.phone && `Tel. ${business.phone}`].filter(Boolean).join(" · ")}</p>
        </div>
      </header>
      {business.welcome.trim() && <p className="rounded-lg border border-border bg-bg px-4 py-3 text-sm text-text">{business.welcome}</p>}

      {booked ? (
        <section aria-label="Reserva enviada" className="flex flex-col gap-3">
          <p aria-live="polite" className="text-sm font-semibold text-text">
            {booked.status === "pending"
              ? `¡Listo, ${name.trim().split(/\s+/)[0]}! Recibimos tu solicitud. ${business.name} la confirmará pronto.`
              : `¡Listo, ${name.trim().split(/\s+/)[0]}! Tu cita quedó confirmada.`}
          </p>
          <Receipt
            appt={appointments.find((a) => a.id === booked.id) ?? booked}
            client={clients.find((c) => c.id === booked.clientId) ?? { id: "", name: name.trim(), phone: phone.trim(), email: "", notes: "", channel: "whatsapp" }}
            pro={professionals.find((p) => p.id === booked.professionalId)}
            business={business}
            rules={rules}
            actions={
              <Btn variant="ghost" onClick={reset}>
                Hacer otra reserva
              </Btn>
            }
          />
        </section>
      ) : services.length === 0 || professionals.length === 0 ? (
        <p className="rounded-lg border border-border bg-bg px-4 py-8 text-center text-sm text-text-muted">
          {business.name} todavía no tiene servicios disponibles para reservar en línea.
        </p>
      ) : (
        <form
          noValidate
          aria-label="Reservar una cita"
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Step n={1} title="Servicio">
            <div role="group" aria-label="Servicio" className="grid gap-2 sm:grid-cols-2">
              {services.map((s) => (
                <Choice key={s.id} pressed={s.id === serviceId} onClick={() => pickService(s.id)} label={s.name}>
                  <span className="block font-semibold text-text">{s.name}</span>
                  <span className="block text-[12px] text-text-muted">
                    {durationLabel(s.duration)} · {formatMoney(s.price)}
                  </span>
                </Choice>
              ))}
            </div>
          </Step>

          {service && (
            <>
              <Step n={2} title="Profesional">
                <div role="group" aria-label="Profesional" className="flex flex-wrap gap-2">
                  {[{ id: ANY, name: "Cualquiera" }, ...professionals].map((p) => (
                    <Choice
                      key={p.id}
                      pressed={proId === p.id}
                      label={p.name}
                      onClick={() => {
                        setProId(p.id);
                        setStart(null);
                        setError("");
                      }}
                    >
                      <span className="font-semibold text-text">{p.name}</span>
                    </Choice>
                  ))}
                </div>
              </Step>

              <Step n={3} title="Día y hora">
                {days.every((d) => d.slots.length === 0) ? (
                  <p className="text-sm text-text-muted">No hay horas libres para este servicio en los próximos {rules.maxAdvanceDays} días. Prueba con otra profesional.</p>
                ) : (
                  <>
                    <div role="group" aria-label="Día" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                      {days.map(({ day: d, slots }) => {
                        const weekday = new Date(d).getDay();
                        return (
                          <button
                            key={d}
                            type="button"
                            disabled={slots.length === 0}
                            aria-pressed={current?.day === d}
                            aria-label={`${WEEKDAYS[weekday]} ${formatDate(d)}${slots.length ? "" : ", sin horas libres"}`}
                            onClick={() => {
                              setDay(d);
                              setStart(null);
                              setError("");
                            }}
                            className={`flex w-14 shrink-0 flex-col items-center rounded-md border px-1 py-1.5 text-[12px] disabled:cursor-not-allowed disabled:opacity-40 ${
                              current?.day === d ? "border-brand bg-brand-muted text-text" : "border-border bg-bg text-text-muted hover:border-border-strong"
                            }`}
                          >
                            <span>{WEEKDAYS_SHORT[weekday]}</span>
                            <span className="text-base font-semibold text-text tabular-nums">{new Date(d).getDate()}</span>
                          </button>
                        );
                      })}
                    </div>
                    {current && (
                      <div role="group" aria-label={`Horas libres del ${WEEKDAYS[new Date(current.day).getDay()].toLowerCase()} ${formatDate(current.day)}`} className="mt-3 flex flex-wrap gap-2">
                        {current.slots.map((s) => (
                          <button
                            key={s.start}
                            type="button"
                            aria-pressed={start === s.start}
                            onClick={() => {
                              setDay(current.day);
                              setStart(s.start);
                              setError("");
                            }}
                            className={`rounded-md border px-3 py-1.5 text-sm tabular-nums ${start === s.start ? "border-brand bg-brand text-brand-contrast" : "border-border bg-bg text-text hover:border-border-strong"}`}
                          >
                            {formatTime(s.start)}
                          </button>
                        ))}
                      </div>
                    )}
                    {slotPro && proId === ANY && <p className="mt-2 text-[13px] text-text-muted">Te atenderá {slotPro.name}.</p>}
                  </>
                )}
              </Step>

              <Step n={4} title="Tus datos">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nombre completo">
                    {(id) => <input id={id} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} />}
                  </Field>
                  <Field label="Teléfono (WhatsApp)">
                    {(id) => <input id={id} className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" maxLength={20} />}
                  </Field>
                </div>
              </Step>

              <FormError>{error}</FormError>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] text-text-muted">
                  {slot ? `${service.name} · ${formatDate(slot.start)}, ${formatTime(slot.start)} · ${formatMoney(service.price)}` : "Elige una hora para continuar."}
                </p>
                <Btn variant="primary" type="submit">
                  {rules.requireConfirmation ? "Solicitar cita" : "Reservar cita"}
                </Btn>
              </div>
            </>
          )}
        </form>
      )}

      <footer className="flex flex-col gap-1 border-t border-border pt-4 text-[12px] text-text-subtle">
        <p>
          {rulesSummary(rules)} {cancelSummary(rules)}
        </p>
        <CancelBooking store={store} notify={notify} />
      </footer>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-text">
        <span className="flex size-6 items-center justify-center rounded-full bg-brand-muted text-[12px] text-brand-soft">{n}</span>
        {title}
      </h4>
      {children}
    </section>
  );
}

function Choice({ pressed, onClick, label, children }: { pressed: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-left text-sm ${pressed ? "border-brand bg-brand-muted" : "border-border bg-bg hover:border-border-strong"}`}
    >
      {children}
    </button>
  );
}

/** Cancelar una reserva con el teléfono y el código del comprobante, dentro del plazo de las reglas. */
function CancelBooking({ store, notify }: { store: ClientiaStore; notify: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  if (!open) {
    return (
      <p>
        ¿Necesitas cancelar?{" "}
        <button type="button" className="font-semibold text-brand underline-offset-2 hover:underline" onClick={() => setOpen(true)}>
          Cancelar mi reserva
        </button>
      </p>
    );
  }

  function submit() {
    const result = cancelOnline(store, phone, code);
    if ("error" in result) return setError(result.error);
    store.setAppointments((list) => list.map((a) => (a.id === result.appointment.id ? result.appointment : a)));
    setError("");
    setDone(`Cancelamos tu reserva #${receiptNumber(result.appointment)} de ${result.appointment.serviceName.toLowerCase()} del ${formatDate(result.appointment.start)}.`);
    setPhone("");
    setCode("");
    notify("Reserva cancelada");
  }

  return (
    <form
      noValidate
      aria-label="Cancelar mi reserva"
      className="mt-2 flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <p className="font-semibold text-text">Cancelar mi reserva</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Teléfono con el que reservaste">
          {(id) => <input id={id} className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} />}
        </Field>
        <Field label="Código del comprobante" hint="Está en tu comprobante, p. ej. #4F2A91C0.">
          {(id) => <input id={id} className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" maxLength={12} />}
        </Field>
      </div>
      <FormError>{error}</FormError>
      {done && <p className="text-success">{done}</p>}
      <div className="flex justify-end gap-2">
        <Btn variant="ghost" onClick={() => setOpen(false)}>
          Cerrar
        </Btn>
        <Btn variant="danger" type="submit">
          Cancelar reserva
        </Btn>
      </div>
    </form>
  );
}
