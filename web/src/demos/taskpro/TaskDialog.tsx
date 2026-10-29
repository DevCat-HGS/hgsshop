import { useState, type KeyboardEvent } from "react";
import { fromDateInput, startOfDay, toDateInput } from "@/demos/kit/format";
import { uid } from "@/demos/kit/storage";
import { Btn, ConfirmButton, Dialog, Field, FormError, inputClass } from "@/demos/kit/ui";
import { CloseIcon } from "@/components/icons";
import { COLUMNS, PRIORITIES, colorHex, type Priority, type Project, type Subtask, type Task, type TaskStatus } from "./data";

export interface TaskDraftDefaults {
  projectId?: string;
  status?: TaskStatus;
}

/** Punto de color del proyecto, decorativo. */
export function ProjectDot({ project }: { project?: Project }) {
  return <span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-full" style={{ backgroundColor: project ? colorHex(project.color) : "#6f7f9a" }} />;
}

/** "frontend, bug , frontend" → ["frontend", "bug"]. */
function parseTags(raw: string) {
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const tag = part.trim().toLowerCase().slice(0, 24);
    if (tag) seen.add(tag);
  }
  return [...seen];
}

export function TaskDialog({
  open,
  task,
  defaults,
  projects,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  task: Task | null;
  defaults: TaskDraftDefaults;
  projects: Project[];
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  // Se monta de nuevo en cada apertura, así el formulario siempre parte de la tarea actual.
  if (!open) return null;
  return <TaskForm key={task?.id ?? "nueva"} task={task} defaults={defaults} projects={projects} onClose={onClose} onSave={onSave} onDelete={onDelete} />;
}

function TaskForm({
  task,
  defaults,
  projects,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task | null;
  defaults: TaskDraftDefaults;
  projects: Project[];
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  // Proyectos elegibles: los no archivados, más el actual de la tarea aunque esté archivado.
  const choices = projects.filter((p) => p.status !== "archived" || p.id === task?.projectId);
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [projectId, setProjectId] = useState(task?.projectId ?? defaults.projectId ?? choices[0]?.id ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaults.status ?? "todo");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [tags, setTags] = useState(task?.tags.join(", ") ?? "");
  const [due, setDue] = useState(task?.dueDate != null ? toDateInput(task.dueDate) : "");
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState("");
  const [error, setError] = useState("");

  function addSubtask() {
    const text = newSubtask.trim().slice(0, 120);
    if (!text) return;
    setSubtasks((list) => [...list, { id: uid("st"), title: text, done: false }]);
    setNewSubtask("");
  }

  function onSubtaskKey(event: KeyboardEvent<HTMLInputElement>) {
    // Enter agrega la subtarea en lugar de enviar todo el formulario.
    if (event.key === "Enter") {
      event.preventDefault();
      addSubtask();
    }
  }

  function save() {
    const cleanTitle = title.trim();
    if (!cleanTitle) return setError("Escribe un título para la tarea.");
    if (cleanTitle.length > 120) return setError("El título no puede pasar de 120 caracteres.");
    if (!choices.some((p) => p.id === projectId)) return setError("Elige un proyecto activo o en pausa.");
    const dueDate = due ? fromDateInput(due) : null;
    if (dueDate != null && Number.isNaN(dueDate)) return setError("La fecha límite no es válida.");
    // Una tarea nueva no puede nacer vencida; una existente sí puede conservar su fecha pasada.
    if (dueDate != null && dueDate < startOfDay(Date.now()) && dueDate !== task?.dueDate) return setError("La fecha límite no puede ser anterior a hoy.");
    const now = Date.now();
    const completedAt = status === "done" ? (task?.status === "done" ? task.completedAt : now) : null;
    onSave({
      id: task?.id ?? uid("t"),
      projectId,
      title: cleanTitle,
      description: description.trim(),
      status,
      priority,
      tags: parseTags(tags),
      dueDate,
      subtasks: subtasks.map((s) => ({ ...s, title: s.title.trim() })).filter((s) => s.title),
      createdAt: task?.createdAt ?? now,
      updatedAt: now,
      completedAt,
    });
  }

  const dialogTitle = task ? "Editar tarea" : "Nueva tarea";
  if (choices.length === 0)
    return (
      <Dialog open onClose={onClose} title={dialogTitle}>
        <p className="text-sm text-text-muted">Primero crea un proyecto activo para poder agregarle tareas.</p>
      </Dialog>
    );

  return (
    <Dialog open onClose={onClose} title={dialogTitle} wide onSubmit={save}>
    <div className="flex flex-col gap-4">
      <Field label="Título">{(id) => <input id={id} className={inputClass} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} autoFocus />}</Field>
      <Field label="Descripción">
        {(id) => <textarea id={id} className={`${inputClass} min-h-20`} value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} />}
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Proyecto">
          {(id) => (
            <select id={id} className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {choices.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Estado">
          {(id) => (
            <select id={id} className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Prioridad">
          {(id) => (
            <select id={id} className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Etiquetas" hint="Separadas por comas, p. ej. frontend, bug">
          {(id) => <input id={id} className={inputClass} value={tags} maxLength={160} onChange={(e) => setTags(e.target.value)} />}
        </Field>
        <Field label="Fecha límite" hint="Opcional">
          {(id) => <input id={id} type="date" className={inputClass} value={due} onChange={(e) => setDue(e.target.value)} />}
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[13px] font-semibold text-text-muted">
          Subtareas{subtasks.length > 0 && ` (${subtasks.filter((s) => s.done).length} de ${subtasks.length})`}
        </legend>
        {subtasks.length > 0 && (
          <ul className="flex flex-col gap-1">
            {subtasks.map((s) => (
              <li key={s.id} className="flex items-center gap-2 rounded-md bg-bg px-2 py-1.5">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--color-brand)]"
                  checked={s.done}
                  aria-label={`Subtarea "${s.title}" terminada`}
                  onChange={(e) => setSubtasks((list) => list.map((x) => (x.id === s.id ? { ...x, done: e.target.checked } : x)))}
                />
                <span className={`min-w-0 flex-1 text-sm break-words ${s.done ? "text-text-subtle line-through" : "text-text"}`}>{s.title}</span>
                <button
                  type="button"
                  aria-label={`Quitar subtarea "${s.title}"`}
                  onClick={() => setSubtasks((list) => list.filter((x) => x.id !== s.id))}
                  className="rounded p-1 text-text-subtle hover:bg-surface-hover hover:text-danger"
                >
                  <CloseIcon className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            aria-label="Nueva subtarea"
            placeholder="Nueva subtarea…"
            className={inputClass}
            value={newSubtask}
            maxLength={120}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={onSubtaskKey}
          />
          <Btn onClick={addSubtask} disabled={!newSubtask.trim()}>
            Agregar
          </Btn>
        </div>
      </fieldset>

      <FormError>{error}</FormError>

      {task && (
        <div className="flex justify-start border-t border-border pt-3">
          <ConfirmButton
            label="Eliminar tarea"
            title="Eliminar tarea"
            message={`¿Eliminar "${task.title}"? Sus registros de tiempo se conservan, pero quedarán sin tarea.`}
            onConfirm={() => onDelete(task)}
          />
        </div>
      )}
    </div>
    </Dialog>
  );
}
