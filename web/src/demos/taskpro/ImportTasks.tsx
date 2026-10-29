import { useCallback, useRef } from "react";
import { ImportDialog, type ImportField, type RowResult } from "@/demos/kit/ImportDialog";
import { uid } from "@/demos/kit/storage";
import { COLUMNS, PRIORITIES, type Priority, type Project, type Task, type TaskStatus } from "./data";

const FIELDS: ImportField<Record<string, string>>[] = [
  { key: "title", label: "Tarea", required: true, aliases: ["titulo", "nombre", "tarea"], example: "Formulario de contacto" },
  { key: "project", label: "Proyecto", required: true, example: "Tienda Café Altamira" },
  { key: "status", label: "Estado", aliases: ["columna"], example: "Pendiente" },
  { key: "priority", label: "Prioridad", example: "Alta" },
  { key: "tags", label: "Etiquetas", aliases: ["tags"], example: "frontend, bug" },
  { key: "due", label: "Fecha límite", aliases: ["vence", "vencimiento", "fecha"], example: "2026-11-15" },
  { key: "description", label: "Descripción", aliases: ["detalle", "notas"], example: "" },
];

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const STATUS_ALIASES: Record<string, TaskStatus> = { "por hacer": "todo", "en curso": "doing", revision: "review", terminada: "done", hecha: "done", completada: "done" };

/** "2026-11-15", "15/11/2026" o "15-11-2026" → medianoche local. Null si no es una fecha real. */
function parseDueDate(raw: string): number | null {
  const text = raw.trim();
  let y: number, m: number, d: number;
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (match) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else {
    match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
    if (!match) return null;
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date.getTime();
}

/** Importar tareas desde Excel o CSV. Cada fila debe nombrar un proyecto que ya exista (sin archivar). */
export function ImportTasks({
  open,
  projects,
  tasks,
  onClose,
  onImport,
}: {
  open: boolean;
  projects: Project[];
  tasks: Task[];
  onClose: () => void;
  onImport: (tasks: Task[]) => void;
}) {
  // Títulos ya vistos en la pasada actual: ImportDialog valida en orden y vuelve a empezar al cambiar de archivo.
  const seen = useRef(new Map<string, number>());
  const lastIndex = useRef(0);
  const validate = useCallback(
    (values: Record<string, string>, index: number): RowResult<Task> => {
      if (index <= lastIndex.current) seen.current.clear();
      lastIndex.current = index;
      const title = values.title.trim();
      if (title.length > 120) return { ok: false, error: "El título pasa de 120 caracteres." };
      const project = projects.find((p) => p.status !== "archived" && norm(p.name) === norm(values.project));
      if (!project) return { ok: false, error: `El proyecto "${values.project}" no existe o está archivado. Créalo en Proyectos.` };
      let status: TaskStatus = "todo";
      if (values.status) {
        const found = COLUMNS.find((c) => norm(c.label) === norm(values.status))?.id ?? STATUS_ALIASES[norm(values.status)];
        if (!found) return { ok: false, error: `El estado "${values.status}" no existe. Usa: ${COLUMNS.map((c) => c.label).join(", ")}.` };
        status = found;
      }
      let priority: Priority = "medium";
      if (values.priority) {
        const found = PRIORITIES.find((p) => norm(p.label) === norm(values.priority));
        if (!found) return { ok: false, error: `La prioridad "${values.priority}" no existe. Usa: ${PRIORITIES.map((p) => p.label).join(", ")}.` };
        priority = found.id;
      }
      let dueDate: number | null = null;
      if (values.due) {
        dueDate = parseDueDate(values.due);
        if (dueDate == null) return { ok: false, error: `La fecha "${values.due}" no es válida. Escríbela como AAAA-MM-DD o DD/MM/AAAA.` };
      }
      const key = `${project.id}|${norm(title)}`;
      if (tasks.some((t) => t.projectId === project.id && norm(t.title) === norm(title))) return { ok: false, error: `"${title}" ya existe en ${project.name}.` };
      const first = seen.current.get(key);
      if (first !== undefined) return { ok: false, error: `"${title}" ya está en la fila ${first + 1} del archivo.` };
      seen.current.set(key, index);
      const now = Date.now();
      const tags = [
        ...new Set(
          (values.tags ?? "")
            .split(/[,;|]/)
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
        ),
      ].slice(0, 8);
      return {
        ok: true,
        record: {
          id: uid("t"),
          projectId: project.id,
          title,
          description: (values.description ?? "").trim().slice(0, 2000),
          status,
          priority,
          tags,
          dueDate,
          subtasks: [],
          createdAt: now,
          updatedAt: now,
          completedAt: status === "done" ? now : null,
        },
      };
    },
    [projects, tasks],
  );

  return (
    <ImportDialog
      open={open}
      onClose={onClose}
      title="Importar tareas"
      entityPlural="tareas"
      templateName="taskpro-plantilla-tareas"
      fields={FIELDS}
      validate={validate}
      onImport={onImport}
    />
  );
}
