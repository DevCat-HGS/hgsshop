import { DAY_MS, formatDate, formatDateLong, relativeDays, startOfDay } from "@/demos/kit/format";
import { Btn, Empty, Panel, Pill, Stat } from "@/demos/kit/ui";
import { formatClock, formatDuration, isDueToday, isOverdue, priorityInfo, startOfWeek, statusLabel, type Note, type Project, type RunningTimer, type Task, type TaskStatus, type TimeEntry } from "./data";
import { plainExcerpt } from "./excerpt";
import { ProjectDot } from "./TaskDialog";

const weekday = new Intl.DateTimeFormat("es-CO", { weekday: "short" });

export function TodayView({
  projects,
  tasks,
  notes,
  entries,
  timer,
  now,
  onOpenTask,
  onMoveTask,
  onStartTimer,
  onStopTimer,
  onOpenNote,
  onShowBoard,
}: {
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  entries: TimeEntry[];
  timer: RunningTimer | null;
  now: number;
  onOpenTask: (task: Task) => void;
  onMoveTask: (id: string, status: TaskStatus) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: () => void;
  onOpenNote: (id: string) => void;
  onShowBoard: () => void;
}) {
  const live = new Map(projects.filter((p) => p.status !== "archived").map((p) => [p.id, p]));
  const open = tasks.filter((t) => live.has(t.projectId));
  const inProgress = open.filter((t) => t.status === "doing" || t.status === "review").sort((a, b) => (a.status === b.status ? b.updatedAt - a.updatedAt : a.status === "doing" ? -1 : 1));
  const due = open.filter((t) => isOverdue(t) || isDueToday(t)).sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));
  const overdueCount = due.filter((t) => isOverdue(t)).length;
  const pinned = notes.filter((n) => n.pinned && live.has(n.projectId)).sort((a, b) => b.updatedAt - a.updatedAt);

  // Últimos 7 días (hoy incluido): tareas terminadas por día.
  const today = startOfDay(now);
  const days = Array.from({ length: 7 }, (_, i) => today - (6 - i) * DAY_MS);
  const donePerDay = days.map((day) => tasks.filter((t) => t.completedAt != null && startOfDay(t.completedAt) === day).length);
  const maxDone = Math.max(1, ...donePerDay);
  const doneWeek = donePerDay.reduce((a, b) => a + b, 0);

  const weekStart = startOfWeek(now);
  const weekMs =
    entries.filter((e) => e.start >= weekStart).reduce((sum, e) => sum + (e.end - e.start), 0) + (timer && timer.start >= weekStart ? now - timer.start : 0);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-muted first-letter:uppercase">{formatDateLong(now)}</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="En progreso" value={inProgress.filter((t) => t.status === "doing").length} detail={`${inProgress.filter((t) => t.status === "review").length} en revisión`} />
        <Stat label="Vencen hoy" value={due.length - overdueCount} tone={due.length - overdueCount ? "warning" : undefined} />
        <Stat label="Atrasadas" value={overdueCount} tone={overdueCount ? "danger" : "success"} />
        <Stat label="Tiempo esta semana" value={formatDuration(weekMs)} detail="Desde el lunes" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel
          title="En progreso ahora"
          actions={
            <Btn variant="ghost" size="sm" onClick={onShowBoard}>
              Ver tablero
            </Btn>
          }
        >
          {inProgress.length === 0 ? (
            <Empty>Nada en progreso. Mueve una tarea a "En progreso" desde el tablero.</Empty>
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {inProgress.map((task) => {
                const running = timer?.taskId === task.id;
                return (
                  <li key={task.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => onOpenTask(task)} className="text-left text-sm font-semibold text-text hover:text-brand">
                        {task.title}
                      </button>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-text-muted">
                        <ProjectDot project={live.get(task.projectId)} />
                        {live.get(task.projectId)?.name}
                        {task.status === "review" && <Pill tone="brand">En revisión</Pill>}
                      </p>
                    </div>
                    {running ? (
                      <Btn size="sm" onClick={onStopTimer} aria-label={`Detener temporizador de "${task.title}"`}>
                        <span className="text-success tabular-nums">{formatClock(now - timer.start)}</span> Detener
                      </Btn>
                    ) : (
                      <Btn variant="ghost" size="sm" onClick={() => onStartTimer(task.id)} aria-label={`Iniciar temporizador en "${task.title}"`}>
                        Iniciar tiempo
                      </Btn>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Vencen hoy o atrasadas">
          {due.length === 0 ? (
            <Empty>Nada vence hoy. Buen momento para adelantar lo pendiente.</Empty>
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {due.map((task) => {
                const late = isOverdue(task);
                const prio = priorityInfo(task.priority);
                return (
                  <li key={task.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => onOpenTask(task)} className="text-left text-sm font-semibold text-text hover:text-brand">
                        {task.title}
                      </button>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-text-muted">
                        <ProjectDot project={live.get(task.projectId)} />
                        {live.get(task.projectId)?.name}
                        <span aria-hidden="true">·</span>
                        <span className={late ? "text-danger" : "text-warning"}>{late ? `Venció ${relativeDays(task.dueDate!)}` : "Vence hoy"}</span>
                        <span aria-hidden="true">·</span>
                        {statusLabel(task.status)}
                      </p>
                    </div>
                    <Pill tone={prio.tone}>{prio.label}</Pill>
                    <Btn variant="ghost" size="sm" onClick={() => onMoveTask(task.id, "done")} aria-label={`Marcar "${task.title}" como hecha`}>
                      Hecha
                    </Btn>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Notas fijadas">
          {pinned.length === 0 ? (
            <Empty>No hay notas fijadas. Fija una nota para tenerla a mano aquí.</Empty>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {pinned.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => onOpenNote(note.id)}
                    className="flex h-full w-full flex-col gap-1 rounded-md border border-border bg-bg-raised p-3 text-left hover:border-border-strong hover:bg-surface"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-text">
                      <ProjectDot project={live.get(note.projectId)} />
                      {note.title}
                    </span>
                    <span className="line-clamp-2 text-[13px] text-text-muted">{plainExcerpt(note.body)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Últimos 7 días">
          <p className="text-sm text-text-muted">
            <span className="font-semibold text-text tabular-nums">{doneWeek}</span> {doneWeek === 1 ? "tarea terminada" : "tareas terminadas"}
          </p>
          <ol aria-label="Tareas terminadas por día" className="mt-4 grid h-36 grid-cols-7 items-end gap-2">
            {days.map((day, i) => (
              <li key={day} className="flex h-full flex-col items-center justify-end gap-1">
                <span className="sr-only">
                  {formatDate(day)}: {donePerDay[i]} {donePerDay[i] === 1 ? "terminada" : "terminadas"}
                </span>
                <span aria-hidden="true" className="text-[12px] text-text-muted tabular-nums">
                  {donePerDay[i]}
                </span>
                <div
                  aria-hidden="true"
                  className={`w-full max-w-10 rounded-sm ${day === today ? "bg-brand" : "bg-depth"}`}
                  style={{ height: `${Math.max(4, (donePerDay[i] / maxDone) * 88)}px` }}
                />
                <span aria-hidden="true" className={`text-[12px] ${day === today ? "font-semibold text-text" : "text-text-subtle"}`}>
                  {day === today ? "Hoy" : weekday.format(day).replace(".", "")}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
