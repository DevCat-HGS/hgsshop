import { useState, type Dispatch, type SetStateAction } from "react";
import { DAY_MS, formatDate, formatTime, fromDateInput, startOfDay, toDateInput } from "@/demos/kit/format";
import { downloadCsv } from "@/demos/kit/csv";
import { uid } from "@/demos/kit/storage";
import { Btn, ConfirmButton, Dialog, Empty, Field, FormError, Panel, Pill, Table, inputClass } from "@/demos/kit/ui";
import { colorHex, formatClock, formatDuration, startOfWeek, type Bill, type Project, type RunningTimer, type Task, type TimeEntry } from "./data";
import { billNumber, defaultBillable, formatHours, unbilledSummary } from "./billing";
import { ProjectDot } from "./TaskDialog";

type Range = "week" | "two-weeks" | "all";
type BillingFilter = "all" | "unbilled" | "billed" | "nonbillable";

export function TimeView({
  projects,
  tasks,
  now,
  entries,
  bills,
  setEntries,
  timer,
  onStartTimer,
  onStopTimer,
  onDiscardTimer,
  notify,
}: {
  projects: Project[];
  tasks: Task[];
  now: number;
  entries: TimeEntry[];
  bills: Bill[];
  setEntries: Dispatch<SetStateAction<TimeEntry[]>>;
  timer: RunningTimer | null;
  onStartTimer: (taskId: string) => void;
  onStopTimer: () => void;
  onDiscardTimer: () => void;
  notify: (message: string) => void;
}) {
  const byProject = new Map(projects.map((p) => [p.id, p]));
  const byTask = new Map(tasks.map((t) => [t.id, t]));
  const live = projects.filter((p) => p.status !== "archived");
  const startable = tasks.filter((t) => t.status !== "done" && live.some((p) => p.id === t.projectId));
  const [pickTask, setPickTask] = useState(startable[0]?.id ?? "");
  const [range, setRange] = useState<Range>("two-weeks");
  const [projectFilter, setProjectFilter] = useState("all");
  const [billingFilter, setBillingFilter] = useState<BillingFilter>("all");
  const byBill = new Map(bills.map((b) => [b.id, b]));
  const [editing, setEditing] = useState<TimeEntry | null | "new">(null);

  const timerTask = timer ? byTask.get(timer.taskId) : undefined;
  const weekStart = startOfWeek(now);

  // Total por proyecto esta semana, incluido el temporizador en curso.
  const weekTotals = new Map<string, number>();
  for (const e of entries) if (e.start >= weekStart) weekTotals.set(e.projectId, (weekTotals.get(e.projectId) ?? 0) + (e.end - e.start));
  if (timer && timerTask && timer.start >= weekStart) weekTotals.set(timerTask.projectId, (weekTotals.get(timerTask.projectId) ?? 0) + (now - timer.start));
  const weekRows = [...weekTotals.entries()].sort((a, b) => b[1] - a[1]);
  const weekTotal = weekRows.reduce((sum, [, ms]) => sum + ms, 0);
  const weekMax = Math.max(1, ...weekRows.map(([, ms]) => ms));

  const rangeStart = range === "week" ? weekStart : range === "two-weeks" ? startOfDay(now) - 13 * DAY_MS : 0;
  const listed = entries
    .filter((e) => e.start >= rangeStart && (projectFilter === "all" || e.projectId === projectFilter))
    .filter((e) =>
      billingFilter === "all" ? true : billingFilter === "nonbillable" ? !e.billable : billingFilter === "billed" ? e.billable && e.billId != null : e.billable && e.billId == null,
    )
    .sort((a, b) => b.start - a.start);
  const listedTotal = listed.reduce((sum, e) => sum + (e.end - e.start), 0);
  const listedPending = unbilledSummary(listed, projects);

  function billingState(e: TimeEntry) {
    if (!e.billable) return "No facturable";
    if (e.billId == null) return "Por cobrar";
    const bill = byBill.get(e.billId);
    return bill ? `Cobrada en ${billNumber(bill.number)}` : "Cobrada";
  }

  function exportCsv() {
    const rows = listed.map((e) => {
      const task = e.taskId ? byTask.get(e.taskId) : undefined;
      return [
        formatDate(e.start),
        formatTime(e.start),
        formatTime(e.end),
        Math.round((e.end - e.start) / 36_000) / 100,
        byProject.get(e.projectId)?.name ?? "Proyecto eliminado",
        task?.title ?? (e.taskId ? "Tarea eliminada" : "Sin tarea"),
        e.note,
        billingState(e),
      ];
    });
    downloadCsv("taskpro-tiempo", ["Fecha", "Inicio", "Fin", "Duración (horas)", "Proyecto", "Tarea", "Nota", "Cobro"], rows);
  }

  function save(entry: TimeEntry) {
    const exists = entries.some((e) => e.id === entry.id);
    setEntries((list) => (exists ? list.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...list]));
    setEditing(null);
    notify(exists ? "Entrada actualizada" : "Entrada agregada");
  }

  function toggleBillable(entry: TimeEntry) {
    if (entry.billId != null) return;
    setEntries((list) => list.map((e) => (e.id === entry.id ? { ...e, billable: !e.billable } : e)));
    notify(entry.billable ? "Entrada marcada como no facturable" : "Entrada marcada como facturable");
  }

  function remove(entry: TimeEntry) {
    setEntries((list) => list.filter((e) => e.id !== entry.id));
    notify("Entrada eliminada");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel title="Temporizador">
          {timer ? (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold text-text">{timerTask?.title ?? "Tarea eliminada"}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[13px] text-text-muted">
                  <ProjectDot project={timerTask ? byProject.get(timerTask.projectId) : undefined} />
                  {timerTask ? byProject.get(timerTask.projectId)?.name : ""} · desde las {formatTime(timer.start)}
                </p>
              </div>
              <p className="font-display text-4xl text-success tabular-nums" aria-live="off">
                {formatClock(now - timer.start)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Btn variant="primary" onClick={onStopTimer}>
                  Detener y guardar
                </Btn>
                <ConfirmButton label="Descartar" size="md" title="Descartar temporizador" message="Se perderá el tiempo de esta sesión sin registrarlo." confirmLabel="Descartar" onConfirm={onDiscardTimer} />
              </div>
              <p className="text-[12px] text-text-subtle">El tiempo se calcula desde la hora de inicio, así que sigue contando aunque recargues o cierres la pestaña.</p>
            </div>
          ) : startable.length === 0 ? (
            <Empty>No hay tareas abiertas para cronometrar.</Empty>
          ) : (
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                if (byTask.has(pickTask)) onStartTimer(pickTask);
              }}
            >
              <Field label="Tarea" className="min-w-0 flex-1">
                {(id) => (
                  <select id={id} className={inputClass} value={startable.some((t) => t.id === pickTask) ? pickTask : ""} onChange={(e) => setPickTask(e.target.value)} required>
                    <option value="" disabled>
                      Elige una tarea
                    </option>
                    {live.map((p) => (
                      <optgroup key={p.id} label={p.name}>
                        {startable
                          .filter((t) => t.projectId === p.id)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </Field>
              <Btn variant="primary" type="submit">
                Iniciar temporizador
              </Btn>
            </form>
          )}
        </Panel>

        <Panel title="Esta semana por proyecto">
          <p className="text-sm text-text-muted">
            Total: <span className="font-semibold text-text tabular-nums">{formatDuration(weekTotal)}</span> desde el lunes {formatDate(weekStart)}
          </p>
          {weekRows.length === 0 ? (
            <Empty>Aún no hay tiempo registrado esta semana.</Empty>
          ) : (
            <ul className="mt-3 flex flex-col gap-2.5">
              {weekRows.map(([projectId, ms]) => {
                const project = byProject.get(projectId);
                return (
                  <li key={projectId}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2 text-text">
                        <ProjectDot project={project} />
                        <span className="truncate">{project?.name ?? "Proyecto eliminado"}</span>
                      </span>
                      <span className="shrink-0 text-text-muted tabular-nums">{formatDuration(ms)}</span>
                    </div>
                    <div aria-hidden="true" className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                      <div className="h-full rounded-full" style={{ width: `${(ms / weekMax) * 100}%`, backgroundColor: project ? colorHex(project.color) : "#6f7f9a" }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <section aria-label="Entradas de tiempo" className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="grid grid-cols-2 gap-3 sm:contents">
            <Field label="Periodo" className="sm:w-48">
              {(id) => (
                <select id={id} className={inputClass} value={range} onChange={(e) => setRange(e.target.value as Range)}>
                  <option value="week">Esta semana</option>
                  <option value="two-weeks">Últimas 2 semanas</option>
                  <option value="all">Todo</option>
                </select>
              )}
            </Field>
            <Field label="Proyecto" className="sm:w-56">
              {(id) => (
                <select id={id} className={inputClass} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
                  <option value="all">Todos</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Cobro" className="col-span-2 sm:w-44">
              {(id) => (
                <select id={id} className={inputClass} value={billingFilter} onChange={(e) => setBillingFilter(e.target.value as BillingFilter)}>
                  <option value="all">Todas</option>
                  <option value="unbilled">Por cobrar</option>
                  <option value="billed">Cobradas</option>
                  <option value="nonbillable">No facturables</option>
                </select>
              )}
            </Field>
          </div>
          <p className="text-sm text-text-muted sm:pb-2">
            {listed.length} entradas · <span className="font-semibold text-text tabular-nums">{formatDuration(listedTotal)}</span>
            {listedPending.minutes > 0 && <span> · {formatHours(listedPending.minutes)} por cobrar</span>}
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <Btn size="sm" onClick={exportCsv} disabled={listed.length === 0} aria-label="Exportar entradas de tiempo a CSV">
              Exportar CSV
            </Btn>
            <Btn variant="primary" onClick={() => setEditing("new")}>
              Entrada manual
            </Btn>
          </div>
        </div>

        {listed.length === 0 ? (
          <Empty>No hay entradas en este periodo.</Empty>
        ) : (
          <Table label="Entradas de tiempo" head={["Fecha", "Horario", "Duración", "Proyecto", "Tarea o nota", "Cobro", ""]} minWidth="54rem">
            {listed.map((e) => {
              const project = byProject.get(e.projectId);
              const task = e.taskId ? byTask.get(e.taskId) : undefined;
              const label = task?.title ?? (e.taskId ? "Tarea eliminada" : "Sin tarea");
              const billed = e.billId != null;
              const when = `del ${formatDate(e.start)} a las ${formatTime(e.start)}`;
              return (
                <tr key={e.id}>
                  <th scope="row" className="font-normal whitespace-nowrap text-text tabular-nums">
                    {formatDate(e.start)}
                  </th>
                  <td className="whitespace-nowrap text-text-muted tabular-nums">
                    {formatTime(e.start)} – {formatTime(e.end)}
                  </td>
                  <td className="whitespace-nowrap font-semibold text-text tabular-nums">{formatDuration(e.end - e.start)}</td>
                  <td>
                    <span className="flex items-center gap-2 whitespace-nowrap text-text-muted">
                      <ProjectDot project={project} />
                      {project?.name ?? "Proyecto eliminado"}
                    </span>
                  </td>
                  <td className="text-text">
                    {label}
                    {e.note && <span className="block text-[12px] text-text-subtle">{e.note}</span>}
                  </td>
                  <td className="whitespace-nowrap">
                    {billed ? (
                      <Pill tone="success">{billingState(e)}</Pill>
                    ) : (
                      <label className="flex items-center gap-2 text-[13px] text-text-muted">
                        <input type="checkbox" className="size-4 accent-[var(--color-brand)]" checked={e.billable} onChange={() => toggleBillable(e)} aria-label={`Facturable: entrada ${when}`} />
                        {e.billable ? "Por cobrar" : "No facturable"}
                      </label>
                    )}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {billed ? (
                      <span className="text-[12px] text-text-subtle">Bloqueada</span>
                    ) : (
                      <>
                        <Btn variant="ghost" size="sm" onClick={() => setEditing(e)} aria-label={`Editar entrada ${when}`}>
                          Editar
                        </Btn>
                        <ConfirmButton
                          label="Eliminar"
                          ariaLabel={`Eliminar entrada ${when}`}
                          title="Eliminar entrada"
                          message={`¿Eliminar ${formatDuration(e.end - e.start)} registrados el ${formatDate(e.start)} en "${label}"?`}
                          onConfirm={() => remove(e)}
                        />
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </section>

      {editing && <EntryDialog entry={editing === "new" ? null : editing} entries={entries} projects={projects} tasks={tasks} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function toTimeInput(value: number) {
  const d = new Date(value);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Hueco libre por defecto: justo después de la última entrada de hoy, o ayer al final de la tarde. */
function defaultSlot(entries: TimeEntry[]) {
  const now = Date.now();
  const today = startOfDay(now);
  const lastEnd = Math.max(today + 9 * 3_600_000, ...entries.filter((e) => e.end > today).map((e) => e.end));
  const start = Math.ceil(lastEnd / 300_000) * 300_000;
  const free = Math.floor((now - start) / 60_000);
  if (free >= 15) return { start, minutes: Math.min(60, free) };
  return { start: today - DAY_MS + 18 * 3_600_000 + 30 * 60_000, minutes: 60 };
}

function EntryDialog({
  entry,
  entries,
  projects,
  tasks,
  onClose,
  onSave,
}: {
  entry: TimeEntry | null;
  entries: TimeEntry[];
  projects: Project[];
  tasks: Task[];
  onClose: () => void;
  onSave: (entry: TimeEntry) => void;
}) {
  const choices = projects.filter((p) => p.status !== "archived" || p.id === entry?.projectId);
  const [slot] = useState(() => (entry ? { start: entry.start, minutes: Math.round((entry.end - entry.start) / 60_000) } : defaultSlot(entries)));
  const initialMinutes = slot.minutes;
  const [projectId, setProjectId] = useState(entry?.projectId ?? choices[0]?.id ?? "");
  const [taskId, setTaskId] = useState(entry?.taskId ?? "");
  const [date, setDate] = useState(toDateInput(slot.start));
  const [start, setStart] = useState(toTimeInput(slot.start));
  const [hours, setHours] = useState(String(Math.floor(initialMinutes / 60)));
  const [minutes, setMinutes] = useState(String(initialMinutes % 60));
  const [note, setNote] = useState(entry?.note ?? "");
  const projectOf = (id: string) => projects.find((p) => p.id === id);
  const [billable, setBillable] = useState(entry?.billable ?? defaultBillable(projectOf(entry?.projectId ?? choices[0]?.id ?? "")));
  const [error, setError] = useState("");
  const [maxDate] = useState(() => toDateInput(Date.now()));

  const projectTasks = tasks.filter((t) => t.projectId === projectId);

  function submit() {
    if (!choices.some((p) => p.id === projectId)) return setError("Elige un proyecto.");
    if (!date || !/^\d{2}:\d{2}$/.test(start)) return setError("Indica la fecha y la hora de inicio.");
    const h = Number(hours || 0);
    const m = Number(minutes || 0);
    if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || m < 0 || m > 59) return setError("La duración debe ser en horas y minutos enteros (0 a 59 minutos).");
    const total = h * 60 + m;
    if (total < 1) return setError("La duración debe ser de al menos un minuto.");
    if (total > 12 * 60) return setError("Una entrada no puede pasar de 12 horas.");
    const [sh, sm] = start.split(":").map(Number);
    const startMs = fromDateInput(date) + (sh * 60 + sm) * 60_000;
    const endMs = startMs + total * 60_000;
    if (endMs > Date.now()) return setError("La entrada no puede terminar en el futuro.");
    const clash = entries.find((e) => e.id !== entry?.id && e.start < endMs && startMs < e.end);
    if (clash) return setError(`Se cruza con otra entrada del ${formatDate(clash.start)} (${formatTime(clash.start)} – ${formatTime(clash.end)}).`);
    const validTask = projectTasks.some((t) => t.id === taskId) ? taskId : null;
    onSave({ id: entry?.id ?? uid("e"), projectId, taskId: validTask, start: startMs, end: endMs, note: note.trim(), billable, billId: entry?.billId ?? null });
  }

  return (
    <Dialog open onClose={onClose} title={entry ? "Editar entrada" : "Entrada manual"} onSubmit={submit}>
      <div className="flex flex-col gap-4">
        <Field label="Proyecto">
          {(id) => (
            <select
              id={id}
              className={inputClass}
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setTaskId("");
                if (!entry) setBillable(defaultBillable(projectOf(e.target.value)));
              }}
            >
              {choices.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Tarea" hint="Opcional">
          {(id) => (
            <select id={id} className={inputClass} value={taskId} onChange={(e) => setTaskId(e.target.value)}>
              <option value="">Sin tarea</option>
              {projectTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha">{(id) => <input id={id} type="date" className={inputClass} value={date} max={maxDate} onChange={(e) => setDate(e.target.value)} />}</Field>
          <Field label="Hora de inicio">{(id) => <input id={id} type="time" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} />}</Field>
          <Field label="Horas">{(id) => <input id={id} type="number" inputMode="numeric" min={0} max={12} className={inputClass} value={hours} onChange={(e) => setHours(e.target.value)} />}</Field>
          <Field label="Minutos">{(id) => <input id={id} type="number" inputMode="numeric" min={0} max={59} className={inputClass} value={minutes} onChange={(e) => setMinutes(e.target.value)} />}</Field>
        </div>
        <Field label="Nota" hint="Opcional, p. ej. llamada con el cliente">
          {(id) => <input id={id} className={inputClass} value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" className="size-4 accent-[var(--color-brand)]" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
          Facturable (se puede incluir en una cuenta de cobro)
        </label>
        {billable && projectOf(projectId) && projectOf(projectId)!.hourlyRate <= 0 && (
          <p className="text-[13px] text-warning">Este proyecto no tiene tarifa por hora: defínela en Proyectos para poder cobrar estas horas.</p>
        )}
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}
