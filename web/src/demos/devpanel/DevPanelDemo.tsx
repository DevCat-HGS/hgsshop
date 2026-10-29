import { useMemo, useState, type FormEvent } from "react";
import { CheckIcon, CloseIcon } from "@/components/icons";

type TaskStatus = "todo" | "doing" | "done";

interface Task {
  id: number;
  title: string;
  project: string;
  status: TaskStatus;
}

const PROJECTS = ["Tienda online", "API de pagos", "App interna"];

const SEED_TASKS: Task[] = [
  { id: 1, title: "Definir modelo de datos de pedidos", project: "Tienda online", status: "done" },
  { id: 2, title: "Pantalla de carrito en móvil", project: "Tienda online", status: "doing" },
  { id: 3, title: "Webhook de confirmación de pago", project: "API de pagos", status: "todo" },
  { id: 4, title: "Pruebas de reintentos", project: "API de pagos", status: "todo" },
  { id: 5, title: "Login con correo", project: "App interna", status: "doing" },
];

const columns: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "Pendiente" },
  { status: "doing", label: "En progreso" },
  { status: "done", label: "Hecho" },
];

const nextStatus: Record<TaskStatus, TaskStatus> = { todo: "doing", doing: "done", done: "todo" };

/**
 * Demo aislada: todo vive en estado de React. No hay red, ni almacenamiento, ni datos reales; recargar
 * la página la devuelve a los datos de ejemplo. Así ninguna acción en la demo es irreversible.
 */
export function DevPanelDemo() {
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newProject, setNewProject] = useState(PROJECTS[0]);
  const [nextId, setNextId] = useState(SEED_TASKS.length + 1);

  const visible = useMemo(() => (projectFilter ? tasks.filter((t) => t.project === projectFilter) : tasks), [tasks, projectFilter]);
  const doneCount = visible.filter((t) => t.status === "done").length;

  function addTask(event: FormEvent) {
    event.preventDefault();
    const title = newTitle.trim().slice(0, 120);
    if (!title) return;
    setTasks((current) => [...current, { id: nextId, title, project: newProject, status: "todo" }]);
    setNextId((id) => id + 1);
    setNewTitle("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted">
            Progreso: <span className="font-semibold text-text">{doneCount}</span> de {visible.length} tareas
          </p>
          <div className="mt-2 h-1.5 w-56 overflow-hidden rounded-full bg-surface-hover" aria-hidden="true">
            <div
              className="h-full bg-brand transition-[width] duration-300"
              style={{ width: `${visible.length ? (doneCount / visible.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[13px] font-medium text-text-muted" htmlFor="demo-project-filter">
            Proyecto
          </label>
          <select
            id="demo-project-filter"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-text"
          >
            <option value="">Todos</option>
            {PROJECTS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setTasks(SEED_TASKS);
              setProjectFilter("");
            }}
            className="rounded-md px-3 py-2 text-sm text-text-muted hover:bg-surface-hover hover:text-text"
          >
            Reiniciar demo
          </button>
        </div>
      </div>

      <form onSubmit={addTask} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="demo-new-task" className="sr-only">
          Nueva tarea
        </label>
        <input
          id="demo-new-task"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          maxLength={120}
          placeholder="Nueva tarea de ejemplo…"
          className="flex-1 rounded-md border border-border-strong bg-bg px-3.5 py-2.5 text-sm text-text placeholder:text-text-subtle"
        />
        <label htmlFor="demo-new-project" className="sr-only">
          Proyecto de la tarea
        </label>
        <select
          id="demo-new-project"
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          className="rounded-md border border-border-strong bg-bg px-3 py-2.5 text-sm text-text"
        >
          {PROJECTS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-contrast hover:bg-brand-hover">
          Agregar
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((column) => {
          const columnTasks = visible.filter((t) => t.status === column.status);
          return (
            <section key={column.status} aria-label={column.label} className="rounded-lg border border-border bg-bg p-3">
              <h3 className="flex items-center justify-between px-1 pb-3 text-[13px] font-semibold text-text-muted">
                {column.label}
                <span className="rounded-full bg-surface-hover px-2 py-0.5 text-text-muted">{columnTasks.length}</span>
              </h3>
              <ul className="flex flex-col gap-2">
                {columnTasks.length === 0 && <li className="px-1 py-4 text-center text-[13px] text-text-muted">Sin tareas</li>}
                {columnTasks.map((task) => (
                  <li key={task.id} className="group rounded-md border border-border bg-surface p-3">
                    <p className={`text-sm ${task.status === "done" ? "text-text-muted line-through" : "text-text"}`}>{task.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[13px] text-text-muted">{task.project}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setTasks((current) => current.map((t) => (t.id === task.id ? { ...t, status: nextStatus[t.status] } : t)))}
                          aria-label={`Mover "${task.title}" a ${columns.find((c) => c.status === nextStatus[task.status])?.label}`}
                          className="rounded p-1 text-text-subtle hover:bg-surface-hover hover:text-success"
                        >
                          <CheckIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTasks((current) => current.filter((t) => t.id !== task.id))}
                          aria-label={`Eliminar "${task.title}"`}
                          className="rounded p-1 text-text-subtle hover:bg-surface-hover hover:text-danger"
                        >
                          <CloseIcon className="size-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
