import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell, type DemoAppProps } from "@/demos/kit/AppShell";
import type { Command } from "@/demos/kit/CommandPalette";
import { productThemes } from "@/demos/kit/themes";
import { usePersistentState, uid } from "@/demos/kit/storage";
import { useToast } from "@/demos/kit/useToast";
import { useView } from "@/demos/kit/useView";
import { Btn } from "@/demos/kit/ui";
import {
  BILL_STATUS,
  SLUG,
  STORES,
  createInitialData,
  createIssuer,
  dropLegacyStores,
  formatClock,
  isDueToday,
  isOverdue,
  statusLabel,
  type Bill,
  type Client,
  type Issuer,
  type Note,
  type Project,
  type RunningTimer,
  type Task,
  type TaskStatus,
  type TimeEntry,
} from "./data";
import { billNumber, defaultBillable } from "./billing";
import { TaskDialog, type TaskDraftDefaults } from "./TaskDialog";
import { TodayView } from "./TodayView";
import { BoardView, type BoardFilters } from "./BoardView";
import { ProjectsView } from "./ProjectsView";
import { ClientDialog, ClientsView } from "./ClientsView";
import { NotesView } from "./NotesView";
import { TimeView } from "./TimeView";
import { BillsView } from "./BillsView";
import { ReportView } from "./ReportView";
import { SettingsView } from "./SettingsView";
import { ImportTasks } from "./ImportTasks";
import { EmptyState } from "./shared";
import { Logo } from "./Logo";

const VIEWS = ["hoy", "tablero", "proyectos", "clientes", "notas", "tiempo", "cobros", "informes", "ajustes"] as const;
type View = (typeof VIEWS)[number];

const TITLES: Record<View, string> = {
  hoy: "Hoy",
  tablero: "Tablero",
  proyectos: "Proyectos",
  clientes: "Clientes",
  notas: "Notas",
  tiempo: "Registro de tiempo",
  cobros: "Cuentas de cobro",
  informes: "Informe para el cliente",
  ajustes: "Ajustes del emisor",
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
 * proyectos con su tarifa, clientes, notas técnicas, registro de tiempo y cuentas de cobro a partir de las horas;
 * todo se guarda solo en este navegador.
 */
export function TaskProDemo({ embedded }: DemoAppProps) {
  const [view, setView] = useView(VIEWS, "hoy", embedded);
  // Datos iniciales una sola vez: los almacenes que aún no existen toman de aquí su semilla (o la migración de la v1).
  const [initial] = useState(createInitialData);
  const [clients, setClients] = usePersistentState<Client[]>(SLUG, STORES.clients, () => initial.clients);
  const [projects, setProjects] = usePersistentState<Project[]>(SLUG, STORES.projects, () => initial.projects);
  const [tasks, setTasks] = usePersistentState<Task[]>(SLUG, STORES.tasks, () => initial.tasks);
  const [notes, setNotes] = usePersistentState<Note[]>(SLUG, STORES.notes, () => initial.notes);
  const [entries, setEntries] = usePersistentState<TimeEntry[]>(SLUG, STORES.entries, () => initial.entries);
  const [bills, setBills] = usePersistentState<Bill[]>(SLUG, STORES.bills, () => initial.bills);
  const [issuer, setIssuer] = usePersistentState<Issuer>(SLUG, STORES.issuer, createIssuer);
  const [timer, setTimer] = usePersistentState<RunningTimer | null>(SLUG, STORES.timer, () => null);
  const { notify, toast } = useToast();
  const now = useNow(timer != null);

  // Datos de la versión anterior ya migrados: se borran los almacenes viejos y se avisa una vez.
  useEffect(() => {
    if (!initial.migrated) return;
    dropLegacyStores();
    notify("Actualizamos tus datos: cada proyecto ahora tiene un cliente. Completa sus documentos y tarifas.");
  }, [initial.migrated, notify]);

  // Estado de pantalla compartido entre vistas.
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; taskId: string | null; defaults: TaskDraftDefaults }>({ open: false, taskId: null, defaults: {} });
  const [boardFilters, setBoardFilters] = useState<BoardFilters>({ projectId: "all", priority: "all", tag: "all", query: "" });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [clientDialog, setClientDialog] = useState<{ client: Client | null } | null>(null);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<{ clientId: string | null; n: number }>({ clientId: null, n: 0 });

  const [projectFocus, setProjectFocus] = useState<{ id: string } | null>(null);
  const clearProjectFocus = useCallback(() => setProjectFocus(null), []);
  const [billRequest, setBillRequest] = useState<{ clientId: string | null } | null>(null);
  const clearBillRequest = useCallback(() => setBillRequest(null), []);

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
      const project = projects.find((p) => p.id === task.projectId);
      setEntries((list) => [{ id: uid("e"), projectId: task.projectId, taskId: task.id, start: timer.start, end, note: "", billable: defaultBillable(project), billId: null }, ...list]);
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

  function saveClient(client: Client) {
    const exists = clients.some((c) => c.id === client.id);
    setClients((list) => (exists ? list.map((c) => (c.id === client.id ? client : c)) : [...list, client]));
    setClientDialog(null);
    notify(exists ? "Cliente actualizado" : `Cliente "${client.name}" creado`);
  }

  function deleteClient(client: Client) {
    setClients((list) => list.filter((c) => c.id !== client.id));
    notify(`Cliente "${client.name}" eliminado`);
  }

  function importTasks(imported: Task[]) {
    setTasks((list) => [...imported, ...list]);
    notify(`${imported.length} ${imported.length === 1 ? "tarea importada" : "tareas importadas"}`);
  }

  const newClient = () => setClientDialog({ client: null });

  const commands = useMemo<Command[]>(() => {
    const byId = new Map(projects.map((p) => [p.id, p]));
    const byClient = new Map(clients.map((c) => [c.id, c]));
    const screens: Command[] = VIEWS.map((v) => ({ id: `view-${v}`, group: "Pantallas", label: TITLES[v], run: () => setView(v) }));
    const taskCommands: Command[] = tasks.map((t) => ({
      id: `task-${t.id}`,
      group: "Tareas",
      label: t.title,
      hint: `${byId.get(t.projectId)?.name ?? "Sin proyecto"} · ${statusLabel(t.status)}`,
      keywords: t.tags.join(" "),
      run: () => {
        setView("tablero");
        setTaskDialog({ open: true, taskId: t.id, defaults: {} });
      },
    }));
    const projectCommands: Command[] = projects.map((p) => ({
      id: `project-${p.id}`,
      group: "Proyectos",
      label: p.name,
      hint: byClient.get(p.clientId)?.name,
      keywords: p.repo,
      run: () => {
        setView("proyectos");
        setProjectFocus({ id: p.id });
      },
    }));
    const clientCommands: Command[] = clients.map((c) => ({
      id: `client-${c.id}`,
      group: "Clientes",
      label: c.name,
      hint: c.contact,
      keywords: `${c.docNumber} ${c.email}`,
      run: () => {
        setView("clientes");
        setClientDialog({ client: c });
      },
    }));
    const billCommands: Command[] = bills.map((b) => ({
      id: `bill-${b.id}`,
      group: "Cuentas de cobro",
      label: `${billNumber(b.number)} · ${byClient.get(b.clientId)?.name ?? "Cliente eliminado"}`,
      hint: BILL_STATUS[b.status].label,
      run: () => {
        setView("cobros");
        setSelectedBillId(b.id);
      },
    }));
    const noteCommands: Command[] = notes.map((n) => ({
      id: `note-${n.id}`,
      group: "Notas",
      label: n.title,
      hint: byId.get(n.projectId)?.name ?? "Sin proyecto",
      run: () => {
        setView("notas");
        setSelectedNoteId(n.id);
      },
    }));
    return [...screens, ...taskCommands, ...projectCommands, ...clientCommands, ...billCommands, ...noteCommands];
  }, [projects, clients, bills, tasks, notes, setView]);

  const editingTask = taskDialog.taskId ? (tasks.find((t) => t.id === taskDialog.taskId) ?? null) : null;
  const hasLiveProject = projects.some((p) => p.status !== "archived");

  const actions: Record<View, ReactNode> = {
    hoy: hasLiveProject ? (
      <Btn variant="primary" size="sm" onClick={() => openTask(null)}>
        Nueva tarea
      </Btn>
    ) : null,
    tablero: hasLiveProject ? (
      <div className="flex gap-2">
        <Btn size="sm" onClick={() => setImporting(true)}>
          Importar
        </Btn>
        <Btn variant="primary" size="sm" onClick={() => openTask(null, { projectId: boardFilters.projectId !== "all" ? boardFilters.projectId : undefined })}>
          Nueva tarea
        </Btn>
      </div>
    ) : null,
    proyectos: null,
    clientes: null,
    notas: null,
    tiempo: null,
    cobros: null,
    informes: null,
    ajustes: null,
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

  // Sin proyectos el tablero no tiene dónde poner tareas: se explica el primer paso.
  const noProjects = (
    <EmptyState
      title="Aún no tienes proyectos"
      actions={
        clients.length ? (
          <Btn variant="primary" onClick={() => setView("proyectos")}>
            Ir a Proyectos
          </Btn>
        ) : (
          <Btn variant="primary" onClick={newClient}>
            Nuevo cliente
          </Btn>
        )
      }
    >
      Las tareas viven dentro de un proyecto, y cada proyecto pertenece a un cliente. Crea el cliente y el proyecto; luego podrás crear tareas o
      importarlas desde Excel o CSV.
    </EmptyState>
  );

  return (
    <>
      <AppShell
        appName="TaskPro"
        tagline={issuer.name ? `${issuer.name}${issuer.city ? ` · ${issuer.city}` : ""}` : "Tareas, tiempo y cobros"}
        theme={productThemes.taskpro}
        logo={<Logo />}
        nav={[
          { id: "hoy", label: "Hoy", badge: urgentCount },
          { id: "tablero", label: "Tablero" },
          { id: "proyectos", label: "Proyectos" },
          { id: "clientes", label: "Clientes" },
          { id: "notas", label: "Notas" },
          { id: "tiempo", label: "Tiempo" },
          { id: "cobros", label: "Cobros" },
          { id: "informes", label: "Informes" },
          { id: "ajustes", label: "Ajustes" },
        ]}
        view={view}
        onNavigate={setView}
        title={TITLES[view]}
        actions={actions[view]}
        sidebarFooter={timerFooter}
        commands={commands}
        embedded={embedded}
      >
        {view === "hoy" &&
          (projects.length === 0 ? (
            noProjects
          ) : (
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
          ))}
        {view === "tablero" &&
          (projects.length === 0 ? noProjects : <BoardView {...common} filters={boardFilters} onFiltersChange={setBoardFilters} onOpenTask={openTask} onMoveTask={moveTask} />)}
        {view === "proyectos" && (
          <ProjectsView
            {...common}
            clients={clients}
            entries={entries}
            bills={bills}
            setProjects={setProjects}
            onNewClient={newClient}
            notify={notify}
            focus={projectFocus}
            onFocusHandled={clearProjectFocus}
            onShowBoard={(projectId) => {
              setBoardFilters({ projectId, priority: "all", tag: "all", query: "" });
              setView("tablero");
            }}
          />
        )}
        {view === "clientes" && (
          <ClientsView
            clients={clients}
            projects={projects}
            entries={entries}
            bills={bills}
            onNew={newClient}
            onEdit={(client) => setClientDialog({ client })}
            onDelete={deleteClient}
            onNewBill={(clientId) => {
              setSelectedBillId(null);
              setBillRequest({ clientId });
              setView("cobros");
            }}
            onReport={(clientId) => {
              setReport((r) => ({ clientId, n: r.n + 1 }));
              setView("informes");
            }}
          />
        )}
        {view === "notas" && (
          <NotesView projects={projects} notes={notes} setNotes={setNotes} selectedId={selectedNoteId} onSelect={setSelectedNoteId} notify={notify} />
        )}
        {view === "tiempo" && (
          <TimeView
            {...common}
            entries={entries}
            bills={bills}
            setEntries={setEntries}
            timer={timer}
            onStartTimer={startTimer}
            onStopTimer={() => stopTimer()}
            onDiscardTimer={() => {
              setTimer(null);
              notify("Temporizador descartado");
            }}
            notify={notify}
          />
        )}
        {view === "cobros" && (
          <BillsView
            clients={clients}
            projects={projects}
            tasks={tasks}
            entries={entries}
            bills={bills}
            issuer={issuer}
            now={now}
            setBills={setBills}
            setEntries={setEntries}
            notify={notify}
            selectedId={selectedBillId}
            onSelect={setSelectedBillId}
            createRequest={billRequest}
            onCreateHandled={clearBillRequest}
            onGoSettings={() => setView("ajustes")}
            onNewClient={newClient}
          />
        )}
        {view === "informes" && (
          <ReportView key={report.n} clients={clients} projects={projects} tasks={tasks} entries={entries} issuer={issuer} initialClientId={report.clientId} onNewClient={newClient} />
        )}
        {view === "ajustes" && (
          <SettingsView
            issuer={issuer}
            onSave={(next) => {
              setIssuer(next);
              notify("Ajustes guardados");
            }}
          />
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
      {clientDialog && <ClientDialog key={clientDialog.client?.id ?? "nuevo"} client={clientDialog.client} clients={clients} onClose={() => setClientDialog(null)} onSave={saveClient} />}
      <ImportTasks open={importing} projects={projects} tasks={tasks} onClose={() => setImporting(false)} onImport={importTasks} />
      {toast}
    </>
  );
}
