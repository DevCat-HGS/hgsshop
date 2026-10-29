import { useState } from "react";
import { DAY_MS, fromDateInput, startOfDay, toDateInput } from "@/demos/kit/format";
import { Btn, Field, FormError, inputClass } from "@/demos/kit/ui";
import { docLabel, statusLabel, type Client, type Issuer, type Project, type Task, type TimeEntry } from "./data";
import { formatHours, minutesOf, monthStartOf } from "./billing";
import { EmptyState, PrintStyle } from "./shared";
import { formatLongDate } from "./util";

interface ProjectReport {
  project: Project;
  done: Task[];
  doneInPeriod: Task[];
  inProgress: Task[];
  pending: Task[];
  periodMinutes: number;
  totalMinutes: number;
  pct: number;
}

/** Avance de los proyectos de un cliente en un periodo: tareas hechas, en curso y horas. Sin valores en pesos. */
function buildClientReport(client: Client, projects: Project[], tasks: Task[], entries: TimeEntry[], from: number, to: number): ProjectReport[] {
  const end = to + DAY_MS;
  return projects
    .filter((p) => p.clientId === client.id && p.status !== "archived")
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .map((project) => {
      const own = tasks.filter((t) => t.projectId === project.id);
      const done = own.filter((t) => t.status === "done");
      const ownEntries = entries.filter((e) => e.projectId === project.id);
      return {
        project,
        done,
        doneInPeriod: done.filter((t) => t.completedAt != null && t.completedAt >= from && t.completedAt < end).sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0)),
        inProgress: own.filter((t) => t.status === "doing" || t.status === "review"),
        pending: own.filter((t) => t.status === "todo"),
        periodMinutes: ownEntries.filter((e) => e.start >= from && e.start < end).reduce((s, e) => s + minutesOf(e), 0),
        totalMinutes: ownEntries.reduce((s, e) => s + minutesOf(e), 0),
        pct: own.length ? Math.round((done.length / own.length) * 100) : 0,
      };
    });
}

export function ReportView({
  clients,
  projects,
  tasks,
  entries,
  issuer,
  initialClientId,
  onNewClient,
}: {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  entries: TimeEntry[];
  issuer: Issuer;
  initialClientId: string | null;
  onNewClient: () => void;
}) {
  const withProjects = clients.filter((c) => projects.some((p) => p.clientId === c.id)).sort((a, b) => a.name.localeCompare(b.name, "es"));
  const [clientId, setClientId] = useState(() => withProjects.find((c) => c.id === initialClientId)?.id ?? withProjects[0]?.id ?? "");
  const [today] = useState(() => startOfDay(Date.now()));
  const [from, setFrom] = useState(toDateInput(monthStartOf(today)));
  const [to, setTo] = useState(toDateInput(today));

  if (withProjects.length === 0)
    return (
      <EmptyState
        title="Aún no hay nada que informar"
        actions={
          clients.length === 0 ? (
            <Btn variant="primary" onClick={onNewClient}>
              Nuevo cliente
            </Btn>
          ) : undefined
        }
      >
        El informe muestra el avance de los proyectos de un cliente: tareas hechas, en curso y horas. Registra un cliente y un proyecto para verlo.
      </EmptyState>
    );

  const client = withProjects.find((c) => c.id === clientId) ?? withProjects[0];
  const fromMs = from ? fromDateInput(from) : NaN;
  const toMs = to ? fromDateInput(to) : NaN;
  const validRange = !Number.isNaN(fromMs) && !Number.isNaN(toMs) && fromMs <= toMs;
  const report = validRange ? buildClientReport(client, projects, tasks, entries, fromMs, toMs) : [];
  const periodMinutes = report.reduce((s, r) => s + r.periodMinutes, 0);
  const doneInPeriod = report.reduce((s, r) => s + r.doneInPeriod.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <PrintStyle />
      <div className="tp-no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <Field label="Cliente" className="sm:w-64">
          {(id) => (
            <select id={id} className={inputClass} value={client.id} onChange={(e) => setClientId(e.target.value)}>
              {withProjects.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:contents">
          <Field label="Desde" className="sm:w-44">
            {(id) => <input id={id} type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />}
          </Field>
          <Field label="Hasta" className="sm:w-44">
            {(id) => <input id={id} type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />}
          </Field>
        </div>
        <Btn variant="primary" className="sm:ml-auto" onClick={() => window.print()} disabled={!validRange}>
          Imprimir informe
        </Btn>
      </div>
      {!validRange && <FormError>Revisa el periodo: la fecha inicial no puede ser posterior a la final.</FormError>}

      {validRange && (
        <article aria-label={`Informe de avance para ${client.name}`} className="tp-doc mx-auto w-full max-w-3xl rounded-lg border border-border bg-bg p-5 text-sm text-text sm:p-8">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
            <div className="min-w-0">
              <p className="font-display text-2xl">Informe de avance</p>
              <p className="tp-muted text-text-muted">
                Del {formatLongDate(fromMs)} al {formatLongDate(toMs)}
              </p>
            </div>
            <div className="min-w-0 text-right">
              <p className="font-semibold break-words">{issuer.name || "Configura tu nombre en Ajustes"}</p>
              <p className="tp-muted text-text-muted">{docLabel(issuer.docType, issuer.docNumber)}</p>
              <p className="tp-muted text-text-muted">{[issuer.city, issuer.email].filter(Boolean).join(" · ")}</p>
            </div>
          </header>

          <section aria-label="Cliente" className="mt-4">
            <p className="tp-muted text-[12px] tracking-wide text-text-muted uppercase">Para</p>
            <p className="font-semibold break-words">{client.name}</p>
            <p className="tp-muted text-text-muted">
              {docLabel(client.docType, client.docNumber)}
              {client.contact ? ` · Atención: ${client.contact}` : ""}
            </p>
          </section>

          <section aria-label="Resumen" className="mt-4 grid grid-cols-3 gap-3 rounded-md border border-border p-3 text-center">
            <div>
              <p className="text-lg font-semibold tabular-nums">{report.length}</p>
              <p className="tp-muted text-[12px] text-text-muted">{report.length === 1 ? "proyecto" : "proyectos"}</p>
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">{doneInPeriod}</p>
              <p className="tp-muted text-[12px] text-text-muted">tareas terminadas en el periodo</p>
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">{formatHours(periodMinutes)}</p>
              <p className="tp-muted text-[12px] text-text-muted">dedicadas en el periodo</p>
            </div>
          </section>

          {report.length === 0 && <p className="tp-muted mt-4 text-text-muted">Este cliente solo tiene proyectos archivados.</p>}
          {report.map((r) => (
            <section key={r.project.id} aria-label={`Proyecto ${r.project.name}`} className="mt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-1.5">
                <h3 className="text-base font-semibold">{r.project.name}</h3>
                <p className="tp-muted text-[13px] text-text-muted tabular-nums">
                  {r.pct} % completado · {formatHours(r.periodMinutes)} en el periodo · {formatHours(r.totalMinutes)} en total
                </p>
              </div>
              <p className="mt-2 tabular-nums">
                {r.done.length} {r.done.length === 1 ? "tarea hecha" : "tareas hechas"} · {r.inProgress.length} en curso · {r.pending.length} {r.pending.length === 1 ? "pendiente" : "pendientes"}
              </p>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TaskList title="Terminadas en el periodo" tasks={r.doneInPeriod} empty="Ninguna en este periodo." />
                <TaskList title="En curso" tasks={r.inProgress} empty="Nada en curso." withStatus />
              </div>
            </section>
          ))}

          <footer className="tp-muted mt-8 border-t border-border pt-3 text-[12px] text-text-subtle">
            Generado el {formatLongDate(today)} por {issuer.name || "TaskPro"}. Las horas salen del registro de tiempo de cada proyecto.
          </footer>
        </article>
      )}
    </div>
  );
}

function TaskList({ title, tasks, empty, withStatus = false }: { title: string; tasks: Task[]; empty: string; withStatus?: boolean }) {
  return (
    <div>
      <h4 className="tp-muted mb-1 text-[13px] font-semibold text-text-muted">{title}</h4>
      {tasks.length === 0 ? (
        <p className="tp-muted text-[13px] text-text-subtle">{empty}</p>
      ) : (
        <ul className="flex list-disc flex-col gap-0.5 pl-5 text-[13px]">
          {tasks.map((t) => (
            <li key={t.id}>
              {t.title}
              {withStatus && <span className="tp-muted text-text-muted"> ({statusLabel(t.status).toLowerCase()})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
