import { useState, type DragEvent } from "react";
import { formatDate, matches, startOfDay } from "@/demos/kit/format";
import { downloadCsv } from "@/demos/kit/csv";
import { Btn, Field, Pill, SearchField, inputClass } from "@/demos/kit/ui";
import { ArrowRightIcon } from "@/components/icons";
import { COLUMNS, PRIORITIES, isOverdue, priorityInfo, statusLabel, type Priority, type Project, type Task, type TaskStatus } from "./data";
import type { TaskDraftDefaults } from "./TaskDialog";
import { ProjectDot } from "./TaskDialog";

export interface BoardFilters {
  projectId: string; // "all" = todos los proyectos no archivados
  priority: Priority | "all";
  tag: string; // "all" = cualquiera
  query: string;
}

const PRIORITY_ORDER: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export function BoardView({
  projects,
  tasks,
  now,
  filters,
  onFiltersChange,
  onOpenTask,
  onMoveTask,
}: {
  projects: Project[];
  tasks: Task[];
  now: number;
  filters: BoardFilters;
  onFiltersChange: (filters: BoardFilters) => void;
  onOpenTask: (task: Task | null, defaults?: TaskDraftDefaults) => void;
  onMoveTask: (id: string, status: TaskStatus) => void;
}) {
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const byId = new Map(projects.map((p) => [p.id, p]));
  const selectable = projects.filter((p) => p.status !== "archived");
  // Si el proyecto elegido se archivó, el tablero vuelve a "Todos".
  const projectId = filters.projectId === "all" || selectable.some((p) => p.id === filters.projectId) ? filters.projectId : "all";
  const scope = tasks.filter((t) => (projectId === "all" ? selectable.some((p) => p.id === t.projectId) : t.projectId === projectId));
  const allTags = [...new Set(scope.flatMap((t) => t.tags))].sort((a, b) => a.localeCompare(b, "es"));

  const visible = scope.filter(
    (t) =>
      (filters.priority === "all" || t.priority === filters.priority) &&
      (filters.tag === "all" || t.tags.includes(filters.tag)) &&
      (!filters.query.trim() || matches(`${t.title} ${t.description} ${t.tags.join(" ")}`, filters.query)),
  );
  const filtering = filters.priority !== "all" || filters.tag !== "all" || filters.query.trim() !== "";
  const set = (change: Partial<BoardFilters>) => onFiltersChange({ ...filters, projectId, ...change });

  function exportCsv() {
    const order = new Map(COLUMNS.map((c, i) => [c.id, i]));
    const rows = [...visible]
      .sort((a, b) => (order.get(a.status) ?? 0) - (order.get(b.status) ?? 0) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
      .map((t) => [
        t.title,
        byId.get(t.projectId)?.name ?? "Proyecto eliminado",
        statusLabel(t.status),
        priorityInfo(t.priority).label,
        t.tags.join(", "),
        t.dueDate != null ? formatDate(t.dueDate) : "",
        t.subtasks.length ? `${t.subtasks.filter((s) => s.done).length} de ${t.subtasks.length}` : "",
      ]);
    downloadCsv("taskpro-tareas", ["Tarea", "Proyecto", "Estado", "Prioridad", "Etiquetas", "Fecha límite", "Subtareas hechas"], rows);
  }

  function onDrop(event: DragEvent, status: TaskStatus) {
    event.preventDefault();
    setDropTarget(null);
    const id = event.dataTransfer.getData("text/plain");
    if (id) onMoveTask(id, status);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <Field label="Proyecto" className="sm:w-56">
          {(id) => (
            <select id={id} className={inputClass} value={projectId} onChange={(e) => set({ projectId: e.target.value, tag: "all" })}>
              <option value="all">Todos</option>
              {selectable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:contents">
          <Field label="Prioridad" className="sm:w-36">
            {(id) => (
              <select id={id} className={inputClass} value={filters.priority} onChange={(e) => set({ priority: e.target.value as BoardFilters["priority"] })}>
                <option value="all">Todas</option>
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Etiqueta" className="sm:w-40">
            {(id) => (
              <select id={id} className={inputClass} value={allTags.includes(filters.tag) ? filters.tag : "all"} onChange={(e) => set({ tag: e.target.value })}>
                <option value="all">Todas</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <SearchField label="Buscar tareas" placeholder="Buscar tareas…" value={filters.query} onChange={(query) => set({ query })} />
        {filtering && (
          <button type="button" onClick={() => set({ priority: "all", tag: "all", query: "" })} className="self-start rounded-md px-2 py-2 text-sm text-brand hover:underline sm:self-end">
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-text-subtle">
          {visible.length} de {scope.length} tareas. Usa las flechas de cada tarjeta, o arrástrala, para moverla de columna.
        </p>
        <Btn size="sm" onClick={exportCsv} disabled={visible.length === 0} aria-label="Exportar tareas a CSV">
          Exportar CSV
        </Btn>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((column, colIndex) => {
          const items = visible
            .filter((t) => t.status === column.id)
            .sort((a, b) => (column.id === "done" ? (b.completedAt ?? 0) - (a.completedAt ?? 0) : PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity)));
          const prev = COLUMNS[colIndex - 1];
          const next = COLUMNS[colIndex + 1];
          return (
            <section
              key={column.id}
              aria-label={column.label}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget(column.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropTarget(null);
              }}
              onDrop={(e) => onDrop(e, column.id)}
              className={`flex min-w-0 flex-col rounded-lg border bg-bg p-2.5 transition-colors ${dropTarget === column.id ? "border-brand" : "border-border"}`}
            >
              <div className="flex items-center justify-between px-1 pb-2.5">
                <h3 className="text-[13px] font-semibold text-text-muted">{column.label}</h3>
                <div className="flex items-center gap-1">
                  <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[12px] text-text-muted tabular-nums">{items.length}</span>
                  <button
                    type="button"
                    onClick={() => onOpenTask(null, { status: column.id, projectId: projectId !== "all" ? projectId : undefined })}
                    aria-label={`Nueva tarea en ${column.label}`}
                    className="rounded px-1.5 text-base leading-6 text-text-subtle hover:bg-surface-hover hover:text-text"
                  >
                    +
                  </button>
                </div>
              </div>
              <ul className="flex min-h-16 flex-col gap-2">
                {items.length === 0 && <li className="px-1 py-4 text-center text-[13px] text-text-subtle">{filtering ? "Sin coincidencias" : "Sin tareas"}</li>}
                {items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    project={byId.get(task.projectId)}
                    showProject={projectId === "all"}
                    prevLabel={prev?.label}
                    nextLabel={next?.label}
                    now={now}
                    onOpen={() => onOpenTask(task)}
                    onPrev={prev ? () => onMoveTask(task.id, prev.id) : undefined}
                    onNext={next ? () => onMoveTask(task.id, next.id) : undefined}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  project,
  showProject,
  prevLabel,
  nextLabel,
  now,
  onOpen,
  onPrev,
  onNext,
}: {
  task: Task;
  now: number;
  project?: Project;
  showProject: boolean;
  prevLabel?: string;
  nextLabel?: string;
  onOpen: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const prio = priorityInfo(task.priority);
  const overdue = isOverdue(task, now);
  const dueToday = task.status !== "done" && task.dueDate != null && startOfDay(task.dueDate) === startOfDay(now);
  const doneSubtasks = task.subtasks.filter((s) => s.done).length;
  const arrowBtn = "rounded p-1 text-text-subtle hover:bg-surface-hover hover:text-text";

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="rounded-md border border-border bg-surface p-3"
    >
      <button type="button" onClick={onOpen} className={`text-left text-sm font-semibold break-words hover:text-brand ${task.status === "done" ? "text-text-muted" : "text-text"}`}>
        {task.title}
      </button>
      {showProject && (
        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-text-muted">
          <ProjectDot project={project} />
          <span className="truncate">{project?.name}</span>
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Pill tone={prio.tone}>{prio.label}</Pill>
        {task.tags.map((tag) => (
          <span key={tag} className="rounded-sm border border-border px-1.5 py-px text-[12px] text-text-muted">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text-subtle tabular-nums">
          {task.dueDate != null && task.status !== "done" && (
            <span className={overdue ? "font-semibold text-danger" : dueToday ? "font-semibold text-warning" : undefined}>
              {overdue ? "Atrasada · " : dueToday ? "Hoy · " : "Vence "}
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.subtasks.length > 0 && (
            <span>
              {doneSubtasks}/{task.subtasks.length} subtareas
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5">
          {onPrev && (
            <button type="button" onClick={onPrev} aria-label={`Mover "${task.title}" a ${prevLabel}`} className={arrowBtn}>
              <ArrowRightIcon className="size-4 rotate-180" />
            </button>
          )}
          {onNext && (
            <button type="button" onClick={onNext} aria-label={`Mover "${task.title}" a ${nextLabel}`} className={arrowBtn}>
              <ArrowRightIcon className="size-4" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
