import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { formatMoney, matches } from "@/demos/kit/format";
import { uid } from "@/demos/kit/storage";
import { Btn, Dialog, Empty, Field, FormError, Pill, SearchField, inputClass } from "@/demos/kit/ui";
import { PROJECT_COLORS, PROJECT_STATUS, colorHex, isOverdue, type BillingMode, type Bill, type Client, type Project, type ProjectColor, type ProjectStatus, type Task, type TimeEntry } from "./data";
import { fixedBilled, formatHours, minutesOf, rateLabel, unbilledSummary } from "./billing";
import { EmptyState } from "./shared";
import { moneyInput, parseMoney } from "./util";

type StatusFilter = "current" | "archived" | "all";

const BILLING_OPTIONS: [BillingMode, string][] = [
  ["hourly", "Por hora"],
  ["fixed", "Precio fijo"],
];

export function ProjectsView({
  clients,
  projects,
  tasks,
  entries,
  bills,
  setProjects,
  onNewClient,
  notify,
  onShowBoard,
  focus,
  onFocusHandled,
}: {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  entries: TimeEntry[];
  bills: Bill[];
  now: number;
  setProjects: Dispatch<SetStateAction<Project[]>>;
  onNewClient: () => void;
  notify: (message: string) => void;
  onShowBoard: (projectId: string) => void;
  /** Proyecto que se pidió abrir desde fuera (búsqueda global): se abre su diálogo de edición. */
  focus?: { id: string } | null;
  onFocusHandled?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("current");
  const [editing, setEditing] = useState<Project | null | "new">(null);

  // Cada petición es un objeto nuevo: se atiende una sola vez, aunque se pida el mismo proyecto de nuevo.
  const [handledFocus, setHandledFocus] = useState<{ id: string } | null>(null);
  if (focus && focus !== handledFocus) {
    setHandledFocus(focus);
    const project = projects.find((p) => p.id === focus.id);
    if (project) {
      setQuery("");
      setStatusFilter(project.status === "archived" ? "archived" : "current");
      setEditing(project);
    }
  }
  // Ya atendida: se limpia en la raíz para que volver a esta pantalla no reabra el diálogo.
  useEffect(() => {
    if (focus) onFocusHandled?.();
  }, [focus, onFocusHandled]);

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Sin cliente";

  const visible = projects
    .filter((p) => (statusFilter === "all" ? true : statusFilter === "archived" ? p.status === "archived" : p.status !== "archived"))
    .filter((p) => !query.trim() || matches(`${p.name} ${clientName(p.clientId)} ${p.repo}`, query))
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

  const dialog = editing && (
    <ProjectDialog project={editing === "new" ? null : editing} projects={projects} clients={clients} onClose={() => setEditing(null)} onSave={save} onNewClient={onNewClient} />
  );

  if (projects.length === 0)
    return (
      <>
        <EmptyState
          title="Aún no tienes proyectos"
          actions={
            clients.length ? (
              <Btn variant="primary" onClick={() => setEditing("new")}>
                Nuevo proyecto
              </Btn>
            ) : (
              <Btn variant="primary" onClick={onNewClient}>
                Nuevo cliente
              </Btn>
            )
          }
        >
          {clients.length
            ? "Cada proyecto pertenece a un cliente y tiene su tarifa por hora o un precio fijo. Sus tareas van al tablero."
            : "Cada proyecto pertenece a un cliente. Empieza por registrar a quién le trabajas."}
        </EmptyState>
        {dialog}
      </>
    );

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
            const projectEntries = entries.filter((e) => e.projectId === project.id);
            const totalMinutes = projectEntries.reduce((sum, e) => sum + minutesOf(e), 0);
            const pending = unbilledSummary(projectEntries, [project]);
            return (
              <li key={project.id} className="flex flex-col rounded-lg border border-border bg-bg">
                <div className="flex flex-1 flex-col gap-3 p-4" style={{ borderTop: `3px solid ${colorHex(project.color)}`, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold break-words text-text">{project.name}</h3>
                      <p className="text-sm text-text-muted">{clientName(project.clientId)}</p>
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
                    {rateLabel(project)} · {formatHours(totalMinutes)} registradas
                    <br />
                    {project.billing === "fixed"
                      ? `Cobrado ${formatMoney(fixedBilled(bills, project.id))} de ${formatMoney(project.fixedPrice)}`
                      : `Por cobrar ${formatMoney(pending.value)} (${formatHours(pending.minutes)})`}
                  </p>
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

      {dialog}
    </div>
  );
}

function ProjectDialog({
  project,
  projects,
  clients,
  onClose,
  onSave,
  onNewClient,
}: {
  project: Project | null;
  projects: Project[];
  clients: Client[];
  onClose: () => void;
  onSave: (p: Project) => void;
  onNewClient: () => void;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [clientId, setClientId] = useState(project?.clientId ?? (clients.length === 1 ? clients[0].id : ""));
  const [color, setColor] = useState<ProjectColor>(project?.color ?? "azul");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "active");
  const [repo, setRepo] = useState(project?.repo ?? "");
  const [billing, setBilling] = useState<BillingMode>(project?.billing ?? "hourly");
  const [rate, setRate] = useState(moneyInput(project?.hourlyRate ?? 0));
  const [fixedPrice, setFixedPrice] = useState(moneyInput(project?.fixedPrice ?? 0));
  const [error, setError] = useState("");
  const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name, "es"));

  function submit() {
    const cleanName = name.trim();
    const cleanRepo = repo.trim();
    if (!cleanName) return setError("Escribe el nombre del proyecto.");
    if (projects.some((p) => p.id !== project?.id && p.name.trim().toLowerCase() === cleanName.toLowerCase())) return setError("Ya existe un proyecto con ese nombre.");
    if (!clients.some((c) => c.id === clientId)) return setError(clients.length ? "Elige el cliente del proyecto." : "Primero registra un cliente.");
    let hourlyRate = 0;
    let price = 0;
    if (billing === "hourly") {
      const parsed = parseMoney(rate);
      if (parsed == null) return setError("La tarifa por hora debe ser un valor entero en pesos mayor que cero (p. ej. 120.000).");
      hourlyRate = parsed;
    } else {
      const parsed = parseMoney(fixedPrice);
      if (parsed == null) return setError("El precio fijo debe ser un valor entero en pesos mayor que cero.");
      price = parsed;
      if (rate.trim()) {
        const extra = parseMoney(rate);
        if (extra == null) return setError("La tarifa de horas adicionales debe ser un valor entero en pesos, o déjala vacía.");
        hourlyRate = extra;
      }
    }
    if (hourlyRate > 5_000_000) return setError("La tarifa por hora no puede pasar de $ 5.000.000. Revísala.");
    if (cleanRepo && !/^(https?:\/\/|git@)\S+$/.test(cleanRepo)) return setError("El repositorio debe ser una URL que empiece por https:// o git@, sin espacios.");
    onSave({
      id: project?.id ?? uid("p"),
      name: cleanName,
      clientId,
      color,
      status,
      repo: cleanRepo,
      createdAt: project?.createdAt ?? Date.now(),
      billing,
      hourlyRate,
      fixedPrice: price,
    });
  }

  return (
    <Dialog open onClose={onClose} title={project ? "Editar proyecto" : "Nuevo proyecto"} onSubmit={submit}>
      <div className="flex flex-col gap-4">
        <Field label="Nombre">{(id) => <input id={id} className={inputClass} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} autoFocus />}</Field>
        {clients.length === 0 ? (
          <p className="text-sm text-warning">
            Aún no tienes clientes.{" "}
            <button type="button" className="text-brand hover:underline" onClick={onNewClient}>
              Registrar un cliente
            </button>
          </p>
        ) : (
          <Field label="Cliente">
            {(id) => (
              <select id={id} className={inputClass} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="" disabled>
                  Elige un cliente
                </option>
                {sortedClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold text-text-muted">Cobro</legend>
          <div className="flex flex-wrap gap-2">
            {BILLING_OPTIONS.map(([value, label]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${billing === value ? "border-brand bg-brand-muted text-text" : "border-border text-text-muted hover:border-border-strong"}`}
              >
                <input type="radio" name="project-billing" value={value} checked={billing === value} onChange={() => setBilling(value)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {billing === "fixed" && (
            <Field label="Precio fijo (COP)">
              {(id) => <input id={id} inputMode="numeric" className={inputClass} value={fixedPrice} placeholder="9.600.000" onChange={(e) => setFixedPrice(e.target.value)} />}
            </Field>
          )}
          <Field label={billing === "hourly" ? "Tarifa por hora (COP)" : "Tarifa de horas adicionales (COP)"} hint={billing === "fixed" ? "Opcional, para horas fuera del alcance" : undefined}>
            {(id) => <input id={id} inputMode="numeric" className={inputClass} value={rate} placeholder="120.000" onChange={(e) => setRate(e.target.value)} />}
          </Field>
        </div>
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
