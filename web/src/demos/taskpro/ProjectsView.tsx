import { useState, type Dispatch, type SetStateAction } from "react";
import { matches } from "@/demos/kit/format";
import { uid } from "@/demos/kit/storage";
import { Btn, Dialog, Empty, Field, FormError, Pill, SearchField, inputClass } from "@/demos/kit/ui";
import { PROJECT_COLORS, PROJECT_STATUS, colorHex, isOverdue, type Project, type ProjectColor, type ProjectStatus, type Task } from "./data";

type StatusFilter = "current" | "archived" | "all";

export function ProjectsView({
  projects,
  tasks,
  setProjects,
  notify,
  onShowBoard,
}: {
  projects: Project[];
  tasks: Task[];
  now: number;
  setProjects: Dispatch<SetStateAction<Project[]>>;
  notify: (message: string) => void;
  onShowBoard: (projectId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("current");
  const [editing, setEditing] = useState<Project | null | "new">(null);

  const visible = projects
    .filter((p) => (statusFilter === "all" ? true : statusFilter === "archived" ? p.status === "archived" : p.status !== "archived"))
    .filter((p) => !query.trim() || matches(`${p.name} ${p.client} ${p.repo}`, query))
    .sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name, "es") : a.status === "active" ? -1 : b.status === "active" ? 1 : a.status === "paused" ? -1 : 1));

  function save(project: Project) {
    const exists = projects.some((p) => p.id === project.id);
    setProjects((list) => (exists ? list.map((p) => (p.id === project.id ? project : p)) : [...list, project]));
    setEditing(null);
    notify(exists ? "Proyecto actualizado" : "Proyecto creado");
  }

  function setStatus(project: Project, status: ProjectStatus) {
    setProjects((list) => list.map((p) => (p.id === project.id ? { ...p, status } : p)));
    notify(status === "archived" ? `"${project.name}" archivado` : `"${project.name}" restaurado`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <SearchField label="Buscar proyectos" placeholder="Buscar por nombre o cliente…" value={query} onChange={setQuery} />
        <Field label="Mostrar" className="sm:w-48">
          {(id) => (
            <select id={id} className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
              <option value="current">Activos y en pausa</option>
              <option value="archived">Archivados</option>
              <option value="all">Todos</option>
            </select>
          )}
        </Field>
        <Btn variant="primary" className="sm:ml-auto" onClick={() => setEditing("new")}>
          Nuevo proyecto
        </Btn>
      </div>

      {visible.length === 0 ? (
        <Empty>{statusFilter === "archived" ? "No hay proyectos archivados." : "Ningún proyecto coincide con la búsqueda."}</Empty>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((project) => {
            const own = tasks.filter((t) => t.projectId === project.id);
            const done = own.filter((t) => t.status === "done").length;
            const openTasks = own.length - done;
            const overdue = own.filter((t) => isOverdue(t)).length;
            const pct = own.length ? Math.round((done / own.length) * 100) : 0;
            const status = PROJECT_STATUS[project.status];
            return (
              <li key={project.id} className="flex flex-col rounded-lg border border-border bg-bg">
                <div className="flex flex-1 flex-col gap-3 p-4" style={{ borderTop: `3px solid ${colorHex(project.color)}`, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold break-words text-text">{project.name}</h3>
                      <p className="text-sm text-text-muted">{project.client}</p>
                    </div>
                    <Pill tone={status.tone}>{status.label}</Pill>
                  </div>
                  {project.repo && (
                    <p className="text-[13px] break-all text-text-subtle">
                      <span className="text-text-muted">Repositorio: </span>
                      {project.repo}
                    </p>
                  )}
                  <div>
                    <div className="flex items-baseline justify-between text-[13px] text-text-muted">
                      <span>Progreso</span>
                      <span className="tabular-nums">
                        {done} de {own.length} tareas · {pct} %
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`Progreso de ${project.name}`}
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-hover"
                    >
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colorHex(project.color) }} />
                    </div>
                  </div>
                  <p className="text-[13px] text-text-muted tabular-nums">
                    {openTasks} {openTasks === 1 ? "tarea abierta" : "tareas abiertas"}
                    {overdue > 0 && <span className="text-danger"> · {overdue} atrasada{overdue === 1 ? "" : "s"}</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 border-t border-border px-3 py-2">
                  {project.status !== "archived" && (
                    <Btn variant="ghost" size="sm" onClick={() => onShowBoard(project.id)} aria-label={`Ver tablero de "${project.name}"`}>
                      Ver tablero
                    </Btn>
                  )}
                  <Btn variant="ghost" size="sm" onClick={() => setEditing(project)} aria-label={`Editar "${project.name}"`}>
                    Editar
                  </Btn>
                  {project.status === "archived" ? (
                    <Btn variant="ghost" size="sm" onClick={() => setStatus(project, "active")} aria-label={`Restaurar "${project.name}"`}>
                      Restaurar
                    </Btn>
                  ) : (
                    <Btn variant="ghost" size="sm" onClick={() => setStatus(project, "archived")} aria-label={`Archivar "${project.name}"`}>
                      Archivar
                    </Btn>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && <ProjectDialog project={editing === "new" ? null : editing} projects={projects} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function ProjectDialog({ project, projects, onClose, onSave }: { project: Project | null; projects: Project[]; onClose: () => void; onSave: (p: Project) => void }) {
  const [name, setName] = useState(project?.name ?? "");
  const [client, setClient] = useState(project?.client ?? "");
  const [color, setColor] = useState<ProjectColor>(project?.color ?? "azul");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "active");
  const [repo, setRepo] = useState(project?.repo ?? "");
  const [error, setError] = useState("");

  function submit() {
    const cleanName = name.trim();
    const cleanClient = client.trim();
    const cleanRepo = repo.trim();
    if (!cleanName) return setError("Escribe el nombre del proyecto.");
    if (projects.some((p) => p.id !== project?.id && p.name.trim().toLowerCase() === cleanName.toLowerCase())) return setError("Ya existe un proyecto con ese nombre.");
    if (!cleanClient) return setError("Escribe el nombre del cliente.");
    if (cleanRepo && !/^(https?:\/\/|git@)\S+$/.test(cleanRepo)) return setError("El repositorio debe ser una URL que empiece por https:// o git@, sin espacios.");
    onSave({ id: project?.id ?? uid("p"), name: cleanName, client: cleanClient, color, status, repo: cleanRepo, createdAt: project?.createdAt ?? Date.now() });
  }

  return (
    <Dialog open onClose={onClose} title={project ? "Editar proyecto" : "Nuevo proyecto"} onSubmit={submit}>
      <div className="flex flex-col gap-4">
        <Field label="Nombre">{(id) => <input id={id} className={inputClass} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} autoFocus />}</Field>
        <Field label="Cliente">{(id) => <input id={id} className={inputClass} value={client} maxLength={80} onChange={(e) => setClient(e.target.value)} />}</Field>
        <Field label="Repositorio" hint="Opcional. Solo se guarda como texto.">
          {(id) => <input id={id} className={inputClass} value={repo} maxLength={200} placeholder="https://…" onChange={(e) => setRepo(e.target.value)} />}
        </Field>
        <Field label="Estado">
          {(id) => (
            <select id={id} className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
              {(Object.keys(PROJECT_STATUS) as ProjectStatus[]).map((s) => (
                <option key={s} value={s}>
                  {PROJECT_STATUS[s].label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold text-text-muted">Color</legend>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <label key={c.id} className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${color === c.id ? "border-brand bg-brand-muted text-text" : "border-border text-text-muted hover:border-border-strong"}`}>
                <input type="radio" name="project-color" value={c.id} checked={color === c.id} onChange={() => setColor(c.id)} className="sr-only" />
                <span aria-hidden="true" className="size-3 rounded-full" style={{ backgroundColor: c.hex }} />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}
