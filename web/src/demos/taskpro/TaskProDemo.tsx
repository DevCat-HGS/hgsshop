import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell, type DemoAppProps } from "@/demos/kit/AppShell";
import { usePersistentState, uid } from "@/demos/kit/storage";
import { useToast } from "@/demos/kit/useToast";
import { useView } from "@/demos/kit/useView";
import { Btn } from "@/demos/kit/ui";
import { SLUG, createSeed, formatClock, isDueToday, isOverdue, statusLabel, type Note, type Project, type RunningTimer, type Task, type TaskStatus, type TimeEntry } from "./data";
import { TaskDialog, type TaskDraftDefaults } from "./TaskDialog";
import { TodayView } from "./TodayView";
import { BoardView, type BoardFilters } from "./BoardView";
import { ProjectsView } from "./ProjectsView";
import { NotesView } from "./NotesView";
import { TimeView } from "./TimeView";

const VIEWS = ["hoy", "tablero", "proyectos", "notas", "tiempo"] as const;
type View = (typeof VIEWS)[number];

const TITLES: Record<View, string> = {
  hoy: "Hoy",
  tablero: "Tablero",
  proyectos: "Proyectos",
  notas: "Notas",
  tiempo: "Registro de tiempo",
};

/** Hora actual que se refresca cada segundo mientras `active` (para el temporizador). */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
}

/**
 * TaskPro: el panel de un desarrollador independiente con varios proyectos de clientes. Tareas en tablero,
 * proyectos, notas técnicas y registro de tiempo; todo se guarda solo en este navegador.
 */
export function TaskProDemo({ embedded }: DemoAppProps) {
  const [view, setView] = useView(VIEWS, "hoy", embedded);
  const [projects, setProjects] = usePersistentState<Project[]>(SLUG, "proyectos.v1", () => createSeed().projects);
  const [tasks, setTasks] = usePersistentState<Task[]>(SLUG, "tareas.v1", () => createSeed().tasks);
  const [notes, setNotes] = usePersistentState<Note[]>(SLUG, "notas.v1", () => createSeed().notes);
  const [entries, setEntries] = usePersistentState<TimeEntry[]>(SLUG, "tiempo.v1", () => createSeed().entries);
  const [timer, setTimer] = usePersistentState<RunningTimer | null>(SLUG, "temporizador.v1", () => null);
  const { notify, toast } = useToast();
  const now = useNow(timer != null);

  // Estado de pantalla compartido entre vistas.
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; taskId: string | null; defaults: TaskDraftDefaults }>({ open: false, taskId: null, defaults: {} });
  const [boardFilters, setBoardFilters] = useState<BoardFilters>({ projectId: "all", priority: "all", tag: "all", query: "" });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const visibleProjectIds = useMemo(() => new Set(projects.filter((p) => p.status !== "archived").map((p) => p.id)), [projects]);
  const urgentCount = tasks.filter((t) => visibleProjectIds.has(t.projectId) && (isOverdue(t) || isDueToday(t))).length;
  const timerTask = timer ? tasks.find((t) => t.id === timer.taskId) : undefined;

  function openTask(task: Task | null, defaults: TaskDraftDefaults = {}) {
    setTaskDialog({ open: true, taskId: task?.id ?? null, defaults });
  }

  function saveTask(task: Task) {
    const exists = tasks.some((t) => t.id === task.id);
    setTasks((list) => (exists ? list.map((t) => (t.id === task.id ? task : t)) : [task, ...list]));
    setTaskDialog((d) => ({ ...d, open: false }));
    notify(exists ? "Tarea actualizada" : "Tarea creada");
  }

  function moveTask(id: string, status: TaskStatus) {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    const now = Date.now();
    setTasks((list) => list.map((t) => (t.id === id ? { ...t, status, updatedAt: now, completedAt: status === "done" ? now : null } : t)));
    notify(`"${task.title}" movida a ${statusLabel(status)}`);
  }

  /** Cierra el temporizador activo y lo convierte en una entrada de tiempo. */
  function stopTimer(silent = false) {
    if (!timer) return;
    const end = Date.now();
    const task = tasks.find((t) => t.id === timer.taskId);
    // Menos de un minuto no se registra: evita entradas vacías por clics accidentales.
    if (end - timer.start >= 60_000 && task) {
      setEntries((list) => [{ id: uid("e"), projectId: task.projectId, taskId: task.id, start: timer.start, end, note: "" }, ...list]);
      if (!silent) notify("Tiempo registrado");
    } else if (!silent) {
      notify("Temporizador detenido (menos de un minuto, no se registró)");
    }
    setTimer(null);
  }

  function startTimer(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const hadTimer = timer != null;
    if (hadTimer) stopTimer(true);
    setTimer({ taskId, start: Date.now() });
    notify(hadTimer ? `Temporizador anterior guardado; ahora en "${task.title}"` : `Temporizador iniciado en "${task.title}"`);
  }

  function deleteTask(task: Task) {
    if (timer?.taskId === task.id) stopTimer(true);
    setTasks((list) => list.filter((t) => t.id !== task.id));
    setTaskDialog((d) => ({ ...d, open: false }));
    notify("Tarea eliminada");
  }

  const editingTask = taskDialog.taskId ? (tasks.find((t) => t.id === taskDialog.taskId) ?? null) : null;

  const actions: Record<View, ReactNode> = {
    hoy: (
      <Btn variant="primary" size="sm" onClick={() => openTask(null)}>
        Nueva tarea
      </Btn>
    ),
    tablero: (
      <Btn variant="primary" size="sm" onClick={() => openTask(null, { projectId: boardFilters.projectId !== "all" ? boardFilters.projectId : undefined })}>
        Nueva tarea
      </Btn>
    ),
    proyectos: null,
    notas: null,
    tiempo: null,
  };

  const timerFooter = timer ? (
    <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-stretch">
      <div className="min-w-0">
        <p className="text-[12px] text-text-subtle">Temporizador activo</p>
        <p className="truncate text-sm font-semibold text-text">{timerTask?.title ?? "Tarea"}</p>
        <p className="text-sm text-success tabular-nums">{formatClock(now - timer.start)}</p>
      </div>
      <Btn size="sm" onClick={() => stopTimer()} aria-label="Detener temporizador">
        Detener
      </Btn>
    </div>
  ) : undefined;

  const common = { projects, tasks, now };

  return (
    <>
      <AppShell
        appName="TaskPro"
        tagline="Tareas, notas y tiempo"
        nav={[
          { id: "hoy", label: "Hoy", badge: urgentCount },
          { id: "tablero", label: "Tablero" },
          { id: "proyectos", label: "Proyectos" },
          { id: "notas", label: "Notas" },
          { id: "tiempo", label: "Tiempo" },
        ]}
        view={view}
        onNavigate={setView}
        title={TITLES[view]}
        actions={actions[view]}
        sidebarFooter={timerFooter}
      >
        {view === "hoy" && (
          <TodayView
            {...common}
            notes={notes}
            entries={entries}
            timer={timer}
            onOpenTask={(t) => openTask(t)}
            onMoveTask={moveTask}
            onStartTimer={startTimer}
            onStopTimer={() => stopTimer()}
            onOpenNote={(id) => {
              setSelectedNoteId(id);
              setView("notas");
            }}
            onShowBoard={() => setView("tablero")}
          />
        )}
        {view === "tablero" && (
          <BoardView {...common} filters={boardFilters} onFiltersChange={setBoardFilters} onOpenTask={openTask} onMoveTask={moveTask} />
        )}
        {view === "proyectos" && (
          <ProjectsView
            {...common}
            setProjects={setProjects}
            notify={notify}
            onShowBoard={(projectId) => {
              setBoardFilters({ projectId, priority: "all", tag: "all", query: "" });
              setView("tablero");
            }}
          />
        )}
        {view === "notas" && (
          <NotesView projects={projects} notes={notes} setNotes={setNotes} selectedId={selectedNoteId} onSelect={setSelectedNoteId} notify={notify} />
        )}
        {view === "tiempo" && (
          <TimeView {...common} entries={entries} setEntries={setEntries} timer={timer} onStartTimer={startTimer} onStopTimer={() => stopTimer()} onDiscardTimer={() => { setTimer(null); notify("Temporizador descartado"); }} notify={notify} />
        )}
      </AppShell>
      <TaskDialog
        open={taskDialog.open}
        task={editingTask}
        defaults={taskDialog.defaults}
        projects={projects}
        onClose={() => setTaskDialog((d) => ({ ...d, open: false }))}
        onSave={saveTask}
        onDelete={deleteTask}
      />
      {toast}
    </>
  );
}
