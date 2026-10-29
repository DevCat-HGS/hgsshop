import { formatDate, formatDateTime, formatMoney, formatTime, startOfDay } from "@/demos/kit/format";
import { Btn, Empty, Panel, Pill, Stat } from "@/demos/kit/ui";
import { addDays, apptEnd, availableMinutes, buildReminders, CHANNEL_LABEL, percent, STATUS_LABEL, STATUS_TONE, startOfWeek, WEEKDAYS_SHORT, type Appointment, type Editor } from "./data";
import type { ClientiaStore } from "./store";

type Go = (view: "agenda" | "recordatorios") => void;

export function Dashboard({ store, onEdit, onGo, onOpenClient }: { store: ClientiaStore; onEdit: (editor: Editor) => void; onGo: Go; onOpenClient: (id: string) => void }) {
  const { appointments, clients, professionals, schedule, reminders, now } = store;
  const today = startOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 7);
  const active = appointments.filter((a) => a.status !== "cancelled");

  const todays = active.filter((a) => startOfDay(a.start) === today).sort((a, b) => a.start - b.start);
  const week = active.filter((a) => a.start >= weekStart && a.start < weekEnd);

  // Ocupación: minutos agendados sobre minutos disponibles de cada profesional, de lunes a sábado.
  const perDay = Array.from({ length: 6 }, (_, i) => {
    const day = addDays(weekStart, i);
    const available = professionals.reduce((sum, p) => sum + availableMinutes(schedule, p, day), 0);
    const booked = week.filter((a) => a.status !== "no_show" && startOfDay(a.start) === day).reduce((sum, a) => sum + a.duration, 0);
    return { day, available, booked };
  });
  const totalAvailable = perDay.reduce((s, d) => s + d.available, 0);
  const totalBooked = perDay.reduce((s, d) => s + d.booked, 0);
  const occupancy = totalAvailable ? Math.min(1, totalBooked / totalAvailable) : 0;

  const monthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime();
  const monthMarked = appointments.filter((a) => a.start >= monthStart && a.start <= now && (a.status === "attended" || a.status === "no_show"));
  const monthNoShows = monthMarked.filter((a) => a.status === "no_show").length;

  const weekIncome = week.filter((a) => a.status !== "no_show").reduce((s, a) => s + a.price, 0);
  const weekCollected = week.filter((a) => a.status === "attended").reduce((s, a) => s + a.price, 0);

  const pending = appointments.filter((a) => a.status === "scheduled" && a.start <= now).sort((a, b) => b.start - a.start);
  const nextReminders = buildReminders(reminders, appointments, clients, now)
    .filter((r) => r.state === "scheduled")
    .slice(0, 5);

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Cliente eliminado";
  const proName = (id: string) => professionals.find((p) => p.id === id)?.name ?? "—";

  const apptRow = (a: Appointment, withDate = false) => {
    const isPending = a.status === "scheduled" && a.start <= now;
    return (
      <li key={a.id}>
        <button type="button" onClick={() => onEdit({ mode: "edit", id: a.id })} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-2 py-2 text-left hover:bg-surface-hover">
          <span className="w-24 shrink-0 text-sm text-text tabular-nums">
            {withDate ? formatDate(a.start) : `${formatTime(a.start)}`}
            <span className="block text-[12px] text-text-subtle">{withDate ? formatTime(a.start) : `a ${formatTime(apptEnd(a))}`}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-text">{clientName(a.clientId)}</span>
            <span className="block truncate text-[12px] text-text-muted">
              {a.serviceName} · {proName(a.professionalId)}
            </span>
          </span>
          <Pill tone={isPending ? "warning" : STATUS_TONE[a.status]}>{isPending ? "Por marcar" : a.start > now ? "Agendada" : STATUS_LABEL[a.status]}</Pill>
        </button>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Citas de hoy" value={todays.length} detail={`${todays.filter((a) => a.start > now).length} por atender`} />
        <Stat label="Ocupación de la semana" value={percent(occupancy)} detail={`${Math.round(totalBooked / 60)} h de ${Math.round(totalAvailable / 60)} h disponibles`} />
        <Stat label="Inasistencias del mes" value={monthNoShows} tone={monthNoShows ? "warning" : undefined} detail={monthMarked.length ? `${percent(monthNoShows / monthMarked.length)} de ${monthMarked.length} citas` : "Sin citas marcadas"} />
        <Stat label="Ingresos estimados de la semana" value={formatMoney(weekIncome)} detail={`${formatMoney(weekCollected)} ya atendidos`} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        <Panel
          title="Citas de hoy"
          actions={
            <Btn size="sm" variant="ghost" onClick={() => onGo("agenda")}>
              Ver agenda
            </Btn>
          }
        >
          {todays.length ? <ul className="-m-2 flex flex-col">{todays.map((a) => apptRow(a))}</ul> : <Empty>No hay citas para hoy.</Empty>}
        </Panel>

        <Panel
          title="Próximos recordatorios"
          actions={
            <Btn size="sm" variant="ghost" onClick={() => onGo("recordatorios")}>
              Ver bandeja
            </Btn>
          }
        >
          {!reminders.enabled ? (
            <Empty>Los recordatorios están desactivados.</Empty>
          ) : nextReminders.length ? (
            <ul className="-my-1 flex flex-col divide-y divide-border">
              {nextReminders.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <span className="w-28 shrink-0 text-sm text-text tabular-nums">{formatDateTime(r.sendAt)}</span>
                  <span className="min-w-0 flex-1">
                    <button type="button" onClick={() => r.client && onOpenClient(r.client.id)} className="block truncate text-left text-sm font-semibold text-text hover:text-brand">
                      {r.client?.name}
                    </button>
                    <span className="block truncate text-[12px] text-text-muted">
                      Cita {formatDate(r.appointment.start)}, {formatTime(r.appointment.start)} · {r.lead} h antes
                    </span>
                  </span>
                  <Pill tone="brand">{r.client ? CHANNEL_LABEL[r.client.channel] : "—"}</Pill>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No hay recordatorios programados.</Empty>
          )}
          <p className="mt-3 text-[12px] text-text-subtle">Simulados: en la demo no se envían mensajes reales.</p>
        </Panel>

        <Panel title="Ocupación por día">
          <ul className="flex flex-col gap-2.5" aria-label="Ocupación por día de esta semana">
            {perDay.map((d) => {
              const ratio = d.available ? Math.min(1, d.booked / d.available) : 0;
              const isToday = d.day === today;
              return (
                <li key={d.day} className="flex items-center gap-3 text-sm">
                  <span className={`w-20 shrink-0 ${isToday ? "font-semibold text-brand" : "text-text-muted"}`}>
                    {WEEKDAYS_SHORT[new Date(d.day).getDay()]} {formatDate(d.day).replace(/ .*/, "")}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-hover" aria-hidden="true">
                    <span className="block h-full rounded-full bg-brand" style={{ width: `${ratio * 100}%` }} />
                  </span>
                  <span className="w-24 shrink-0 text-right text-text tabular-nums">{d.available ? percent(ratio) : "Cerrado"}</span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Asistencia por marcar">
          {pending.length ? (
            <ul className="-m-2 flex flex-col">{pending.slice(0, 6).map((a) => apptRow(a, true))}</ul>
          ) : (
            <Empty>Todas las citas pasadas tienen su asistencia registrada.</Empty>
          )}
        </Panel>
      </div>
    </div>
  );
}
