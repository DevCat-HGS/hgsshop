import { useState } from "react";
import { downloadCsv } from "@/demos/kit/csv";
import { formatDate, formatDateLong, formatTime, startOfDay } from "@/demos/kit/format";
import { Btn, Empty, Field, inputClass } from "@/demos/kit/ui";
import {
  addDays,
  apptEnd,
  atMinutes,
  durationLabel,
  minutesLabel,
  minutesOfDay,
  SLOT,
  STATUS_LABEL,
  startOfWeek,
  TONE_BLOCK,
  WEEKDAYS,
  WEEKDAYS_SHORT,
  type Appointment,
  type Editor,
  type Professional,
} from "./data";
import type { ClientiaStore } from "./store";

const ROW_REM = 2.75;

type Mode = "week" | "day";

export function Agenda({
  store,
  onEdit,
  proFilter,
  onProFilterChange,
}: {
  store: ClientiaStore;
  onEdit: (editor: Editor) => void;
  /** "all" o el id de una profesional; vive en la raíz para que la búsqueda global pueda filtrar. */
  proFilter: string;
  onProFilterChange: (id: string) => void;
}) {
  const { now, schedule, professionals, appointments, clients } = store;
  const [mode, setMode] = useState<Mode>(() => (typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches ? "day" : "week"));
  const [anchor, setAnchor] = useState(() => startOfDay(now));

  const shownPros = proFilter === "all" ? professionals : professionals.filter((p) => p.id === proFilter);
  const weekStart = startOfWeek(anchor);
  const days = mode === "week" ? Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)) : [anchor];

  // Rango de horas visible: del primer día que abre más temprano al que cierra más tarde.
  const openDays = days.map((d) => schedule[new Date(d).getDay()]).filter((h) => h.open);
  const gridStart = openDays.length ? Math.min(...openDays.map((h) => h.start)) : 8 * 60;
  const gridEnd = openDays.length ? Math.max(...openDays.map((h) => h.end)) : 18 * 60;
  const rows = Array.from({ length: (gridEnd - gridStart) / SLOT }, (_, i) => gridStart + i * SLOT);

  function move(step: number) {
    setAnchor((a) => (mode === "week" ? addDays(startOfWeek(a), step * 7) : addDays(a, step)));
  }

  function openDay(day: number) {
    setAnchor(day);
    setMode("day");
  }

  const rangeLabel =
    mode === "week"
      ? `${formatDate(days[0])} – ${formatDate(days[5])} de ${new Date(days[5]).getFullYear()}`
      : capitalize(formatDateLong(anchor));
  const isCurrent = mode === "week" ? weekStart === startOfWeek(now) : anchor === startOfDay(now);

  // Citas visibles: las mismas que pinta la grilla (sin canceladas, días abiertos, profesionales mostradas).
  const shownIds = shownPros.map((p) => p.id);
  const visibleAppts = appointments
    .filter((a) => a.status !== "cancelled" && shownIds.includes(a.professionalId) && days.includes(startOfDay(a.start)) && schedule[new Date(a.start).getDay()].open)
    .sort((a, b) => a.start - b.start);

  function exportCsv() {
    const proName = (id: string) => professionals.find((p) => p.id === id)?.name ?? "Profesional eliminada";
    downloadCsv(
      "clientia-citas",
      ["Fecha", "Hora", "Duración", "Cliente", "Servicio", "Profesional", "Estado", "Precio (COP)"],
      visibleAppts.map((a) => [
        formatDate(a.start),
        formatTime(a.start),
        durationLabel(a.duration),
        clients.find((c) => c.id === a.clientId)?.name ?? "Cliente eliminado",
        a.serviceName,
        proName(a.professionalId),
        a.status === "scheduled" && a.start <= now ? "Por marcar" : STATUS_LABEL[a.status],
        Math.round(a.price),
      ]),
    );
  }

  const columns =
    mode === "week"
      ? days.map((day) => ({ key: String(day), day, lanes: shownPros, label: <DayHeader day={day} now={now} onPick={() => openDay(day)} /> }))
      : shownPros.map((p) => ({ key: p.id, day: anchor, lanes: [p], label: <ProHeader pro={p} day={anchor} store={store} /> }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-1" role="group" aria-label="Navegación de fechas">
          <Btn size="sm" variant="ghost" onClick={() => move(-1)} aria-label={mode === "week" ? "Semana anterior" : "Día anterior"}>
            ‹ Anterior
          </Btn>
          <Btn size="sm" onClick={() => setAnchor(startOfDay(now))} disabled={isCurrent}>
            Hoy
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => move(1)} aria-label={mode === "week" ? "Semana siguiente" : "Día siguiente"}>
            Siguiente ›
          </Btn>
        </div>
        <p className="order-first w-full text-sm font-semibold text-text sm:order-none sm:w-auto sm:min-w-0 sm:flex-1" aria-live="polite">
          {rangeLabel}
        </p>
        <div className="flex rounded-md border border-border-strong p-0.5" role="group" aria-label="Vista de la agenda">
          {(["week", "day"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`rounded px-3 py-1 text-[13px] font-semibold ${mode === m ? "bg-surface-hover text-text" : "text-text-muted hover:text-text"}`}
            >
              {m === "week" ? "Semana" : "Día"}
            </button>
          ))}
        </div>
        <Field label="Profesional" className="w-full sm:w-64">
          {(id) => (
            <select id={id} className={inputClass} value={proFilter} onChange={(e) => onProFilterChange(e.target.value)}>
              <option value="all">Agenda compartida (todas)</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Btn size="sm" onClick={exportCsv} disabled={visibleAppts.length === 0} aria-label={`Exportar citas ${mode === "week" ? "de la semana" : "del día"} a CSV`}>
          Exportar CSV
        </Btn>
      </div>

      {mode === "week" && proFilter === "all" && professionals.length > 1 && (
        <p className="text-[13px] text-text-muted">
          Cada día se divide en columnas por profesional, en este orden: {professionals.map((p) => p.name).join(", ")}. Haz clic en una franja libre para agendar.
        </p>
      )}

      {columns.length === 0 || (mode === "day" && !schedule[new Date(anchor).getDay()].open) ? (
        <div className="rounded-lg border border-border bg-bg">
          <Empty>{columns.length === 0 ? "No hay profesionales registradas." : `${WEEKDAYS[new Date(anchor).getDay()]}: el estudio está cerrado.`}</Empty>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <div
            className="grid"
            style={{ gridTemplateColumns: `${mode === "week" ? "4.5rem" : "4rem"} repeat(${columns.length}, minmax(${mode === "week" ? "7.5rem" : "8rem"}, 1fr))`, minWidth: mode === "week" ? "50rem" : undefined }}
          >
            <div className="border-b border-border" />
            {columns.map((c) => (
              <div key={c.key} className="border-b border-l border-border px-2 py-2">
                {c.label}
              </div>
            ))}
            <div aria-hidden="true">
              {rows.map((m) => (
                <div key={m} className="pr-2 text-right text-[11px] whitespace-nowrap text-text-subtle tabular-nums" style={{ height: `${ROW_REM}rem` }}>
                  <span className="relative -top-1.5">{m % 60 === 0 ? minutesLabel(m) : ""}</span>
                </div>
              ))}
            </div>
            {columns.map((c) => (
              <DayColumn key={c.key} day={c.day} lanes={c.lanes} rows={rows} gridStart={gridStart} store={store} onEdit={onEdit} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** "1:30" sin a. m./p. m.: dentro del bloque la hora ya se lee en el eje. */
function shortTime(value: number) {
  const d = new Date(value);
  return `${((d.getHours() + 11) % 12) + 1}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function DayHeader({ day, now, onPick }: { day: number; now: number; onPick: () => void }) {
  const today = day === startOfDay(now);
  return (
    <button type="button" onClick={onPick} aria-label={`Ver el día ${formatDateLong(day)}`} className="w-full rounded text-left hover:text-brand">
      <span className={`block text-[12px] ${today ? "text-brand" : "text-text-muted"}`}>{WEEKDAYS_SHORT[new Date(day).getDay()]}</span>
      <span className={`text-sm font-semibold tabular-nums ${today ? "text-brand" : "text-text"}`}>
        {formatDate(day)}
        {today && <span className="ml-1 text-[12px] font-normal">(hoy)</span>}
      </span>
    </button>
  );
}

function ProHeader({ pro, day, store }: { pro: Professional; day: number; store: ClientiaStore }) {
  const count = store.appointments.filter((a) => a.professionalId === pro.id && a.status !== "cancelled" && startOfDay(a.start) === day).length;
  const works = pro.days.includes(new Date(day).getDay());
  return (
    <div>
      <p className="truncate text-sm font-semibold text-text">{pro.name}</p>
      <p className="text-[12px] text-text-muted">{works ? `${count} ${count === 1 ? "cita" : "citas"}` : "No atiende este día"}</p>
    </div>
  );
}

function DayColumn({
  day,
  lanes,
  rows,
  gridStart,
  store,
  onEdit,
}: {
  day: number;
  lanes: Professional[];
  rows: number[];
  gridStart: number;
  store: ClientiaStore;
  onEdit: (editor: Editor) => void;
}) {
  const { schedule, appointments, clients, services, now } = store;
  const weekday = new Date(day).getDay();
  const hours = schedule[weekday];
  const single = lanes.length === 1 ? lanes[0] : undefined;
  const working = lanes.filter((p) => p.days.includes(weekday));
  const laneIds = lanes.map((p) => p.id);
  const dayAppts = appointments.filter((a) => a.status !== "cancelled" && startOfDay(a.start) === day && laneIds.includes(a.professionalId));
  const dateLabel = `${WEEKDAYS[weekday].toLowerCase()} ${formatDate(day)}`;
  // En la agenda compartida, la franja se propone a la primera profesional libre a esa hora.
  const freePro = (start: number) => working.find((p) => !dayAppts.some((a) => a.professionalId === p.id && a.start <= start && apptEnd(a) > start));

  return (
    <div className="relative border-l border-border" style={{ height: `${rows.length * ROW_REM}rem` }}>
      {rows.map((m) => {
        const start = atMinutes(day, m);
        const closed = !hours.open || m < hours.start || m >= hours.end || working.length === 0;
        const inBreak = hours.open && hours.hasBreak && m >= hours.breakStart && m < hours.breakEnd;
        const base = `border-t border-border/60 ${m % 60 === 0 ? "" : "border-dashed"}`;
        const style = { height: `${ROW_REM}rem` };
        if (closed || inBreak) {
          return (
            <div key={m} className={`${base} bg-surface/70 px-2 text-[11px] text-text-subtle`} style={style}>
              {inBreak && m === hours.breakStart ? "Descanso" : ""}
            </div>
          );
        }
        if (start < now) return <div key={m} className={`${base} bg-bg-raised`} style={style} />;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onEdit({ mode: "new", start, professionalId: single?.id ?? freePro(start)?.id ?? working[0]?.id })}
            aria-label={`Agendar el ${dateLabel} a las ${minutesLabel(m)}${single ? ` con ${single.name}` : ""}`}
            className={`group block w-full ${base} px-2 text-left text-[12px] text-transparent hover:bg-brand-muted hover:text-brand-soft focus-visible:text-brand-soft`}
            style={style}
          >
            + Agendar
          </button>
        );
      })}

      {dayAppts.map((a) => (
        <ApptBlock
          key={a.id}
          appt={a}
          lane={laneIds.indexOf(a.professionalId)}
          lanes={lanes.length}
          gridStart={gridStart}
          clientName={clients.find((c) => c.id === a.clientId)?.name ?? "Cliente eliminado"}
          pro={lanes.find((p) => p.id === a.professionalId)}
          tone={services.find((s) => s.id === a.serviceId)?.tone ?? "neutral"}
          now={now}
          onOpen={() => onEdit({ mode: "edit", id: a.id })}
        />
      ))}
    </div>
  );
}

function ApptBlock({
  appt,
  lane,
  lanes,
  gridStart,
  clientName,
  pro,
  tone,
  now,
  onOpen,
}: {
  appt: Appointment;
  lane: number;
  lanes: number;
  gridStart: number;
  clientName: string;
  pro: Professional | undefined;
  tone: keyof typeof TONE_BLOCK;
  now: number;
  onOpen: () => void;
}) {
  const top = ((minutesOfDay(appt.start) - gridStart) / SLOT) * ROW_REM;
  const height = (appt.duration / SLOT) * ROW_REM;
  const width = 100 / lanes;
  const pending = appt.status === "scheduled" && appt.start <= now;
  const statusText = appt.status === "attended" ? "Asistió" : appt.status === "no_show" ? "No asistió" : pending ? "Por marcar" : "";
  const initials = pro ? pro.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("") : "";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Cita: ${clientName}, ${appt.serviceName}, ${formatTime(appt.start)} a ${formatTime(apptEnd(appt))}${pro ? `, con ${pro.name}` : ""}${statusText ? `, ${statusText.toLowerCase()}` : ""}`}
      className={`absolute overflow-hidden rounded-md border border-l-[3px] border-border px-1.5 py-1 text-left hover:brightness-125 ${TONE_BLOCK[tone]} ${appt.status === "no_show" ? "opacity-60" : ""}`}
      style={{ top: `calc(${top}rem + 2px)`, height: `calc(${height}rem - 4px)`, left: `calc(${lane * width}% + 2px)`, width: `calc(${width}% - 4px)` }}
    >
      <span className="flex items-start justify-between gap-1">
        <span className="truncate text-[11px] text-text-muted tabular-nums">
          {shortTime(appt.start)}
          {lanes === 1 && ` · ${durationLabel(appt.duration)}`}
        </span>
        {lanes > 1 && initials && <span className="shrink-0 text-[10px] font-semibold text-text-subtle">{initials}</span>}
      </span>
      <span className="block truncate text-[12px] leading-tight font-semibold text-text">{clientName}</span>
      {appt.duration > SLOT && <span className="block truncate text-[11px] leading-tight text-text-muted">{appt.serviceName}</span>}
      {statusText && appt.duration > SLOT && (
        <span className={`block truncate text-[11px] font-semibold ${appt.status === "no_show" ? "text-danger" : appt.status === "attended" ? "text-success" : "text-warning"}`}>
          {statusText}
        </span>
      )}
    </button>
  );
}
