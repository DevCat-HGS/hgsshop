import { DAY_MS, formatMoney } from "@/demos/kit/format";
import type { Bill, BillLine, Project, Task, TimeEntry } from "./data";

/**
 * Reglas de cobro de TaskPro, sin interfaz: qué horas faltan por cobrar, cómo se agrupan en una cuenta de cobro y
 * cuánto se ha cobrado. Las usan Hoy, Proyectos, Clientes y Cobros, así que todas cuentan lo mismo.
 */

export function billNumber(n: number) {
  return `CC-${String(n).padStart(4, "0")}`;
}

export function nextBillNumber(bills: Bill[]) {
  return bills.reduce((max, b) => Math.max(max, b.number), 0) + 1;
}

export function minutesOf(entry: TimeEntry) {
  return Math.max(0, Math.round((entry.end - entry.start) / 60_000));
}

const hoursFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

/** 195 → "3,25 h". */
export function formatHours(minutes: number) {
  return `${hoursFormat.format(minutes / 60)} h`;
}

export function lineAmount(minutes: number, rate: number) {
  return Math.round((minutes / 60) * rate);
}

/** Facturable y sin cuenta de cobro. */
export function isUnbilled(entry: TimeEntry) {
  return entry.billable && entry.billId == null;
}

/** Valor de una entrada sin cobrar a la tarifa por hora de su proyecto (0 si el proyecto no tiene tarifa). */
export function entryValue(entry: TimeEntry, project: Project | undefined) {
  return project ? lineAmount(minutesOf(entry), project.hourlyRate) : 0;
}

/** Horas facturables sin cobrar y su valor, opcionalmente solo de unos proyectos. */
export function unbilledSummary(entries: TimeEntry[], projects: Project[], projectIds?: Set<string>) {
  const byId = new Map(projects.map((p) => [p.id, p]));
  let minutes = 0;
  let value = 0;
  let unpriced = 0;
  for (const e of entries) {
    if (!isUnbilled(e) || (projectIds && !projectIds.has(e.projectId))) continue;
    const project = byId.get(e.projectId);
    minutes += minutesOf(e);
    if (project && project.hourlyRate > 0) value += entryValue(e, project);
    else unpriced += minutesOf(e);
  }
  return { minutes, value, unpriced };
}

/** Entradas facturables sin cobrar de un cliente, entre dos días (inclusive). */
export function pendingEntriesFor(entries: TimeEntry[], projects: Project[], clientId: string, from: number, to: number) {
  const own = new Set(projects.filter((p) => p.clientId === clientId).map((p) => p.id));
  return entries.filter((e) => own.has(e.projectId) && isUnbilled(e) && e.start >= from && e.start < to + DAY_MS);
}

/**
 * Agrupa entradas por proyecto y tarea en líneas de "horas × tarifa". Las entradas de proyectos sin tarifa por
 * hora no se pueden valorizar: se devuelven aparte para avisarlo y no entran en la cuenta.
 */
export function buildTimeLines(entries: TimeEntry[], projects: Project[], tasks: Task[]) {
  const byProject = new Map(projects.map((p) => [p.id, p]));
  const byTask = new Map(tasks.map((t) => [t.id, t]));
  const groups = new Map<string, { project: Project; taskId: string | null; minutes: number; notes: Set<string>; first: number; entries: TimeEntry[] }>();
  const skipped: TimeEntry[] = [];
  for (const e of [...entries].sort((a, b) => a.start - b.start)) {
    const project = byProject.get(e.projectId);
    if (!project || project.hourlyRate <= 0) {
      skipped.push(e);
      continue;
    }
    const taskId = e.taskId && byTask.has(e.taskId) ? e.taskId : null;
    const key = `${e.projectId}|${taskId ?? ""}`;
    const group = groups.get(key) ?? { project, taskId, minutes: 0, notes: new Set<string>(), first: e.start, entries: [] };
    group.minutes += minutesOf(e);
    if (e.note.trim()) group.notes.add(e.note.trim());
    group.entries.push(e);
    groups.set(key, group);
  }
  const ordered = [...groups.values()].sort((a, b) => a.project.name.localeCompare(b.project.name, "es") || (a.taskId == null ? 1 : 0) - (b.taskId == null ? 1 : 0) || a.first - b.first);
  const lines: BillLine[] = ordered.map((g, i) => {
    const task = g.taskId ? byTask.get(g.taskId) : undefined;
    const notes = [...g.notes].slice(0, 3).join("; ");
    const description = task ? task.title : notes ? `Otras actividades: ${notes}` : "Otras actividades del proyecto";
    return {
      id: `bl-${i + 1}-${g.first}`,
      kind: "time",
      projectId: g.project.id,
      projectName: g.project.name,
      description: description.slice(0, 160),
      minutes: g.minutes,
      rate: g.project.hourlyRate,
      amount: lineAmount(g.minutes, g.project.hourlyRate),
    };
  });
  const included = ordered.flatMap((g) => g.entries);
  return { lines, included, skipped };
}

export function billTotal(lines: BillLine[]) {
  return lines.reduce((sum, l) => sum + l.amount, 0);
}

/** Cuánto de un proyecto de precio fijo ya está en cuentas de cobro no anuladas. */
export function fixedBilled(bills: Bill[], projectId: string, exceptBillId?: string) {
  return bills
    .filter((b) => b.status !== "void" && b.id !== exceptBillId)
    .flatMap((b) => b.lines)
    .filter((l) => l.kind === "manual" && l.projectId === projectId)
    .reduce((sum, l) => sum + l.amount, 0);
}

export function monthStartOf(now: number) {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

/** Total de las cuentas pagadas este mes (por fecha de pago). */
export function collectedThisMonth(bills: Bill[], now: number) {
  const start = monthStartOf(now);
  const d = new Date(now);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  return bills.filter((b) => b.status === "paid" && b.paidAt != null && b.paidAt >= start && b.paidAt < end).reduce((sum, b) => sum + b.total, 0);
}

/** Enviadas y aún sin pagar. */
export function outstanding(bills: Bill[]) {
  const list = bills.filter((b) => b.status === "sent");
  return { count: list.length, total: list.reduce((sum, b) => sum + b.total, 0) };
}

/** "$ 120.000 por hora" o "Precio fijo $ 9.600.000". */
export function rateLabel(project: Project) {
  if (project.billing === "fixed") return `Precio fijo ${formatMoney(project.fixedPrice)}`;
  return project.hourlyRate > 0 ? `${formatMoney(project.hourlyRate)} por hora` : "Sin tarifa por hora";
}

/** Por defecto se cobran las horas de los proyectos por hora; en precio fijo, solo si hay tarifa de horas adicionales. */
export function defaultBillable(project: Project | undefined) {
  return project ? project.billing === "hourly" || project.hourlyRate > 0 : true;
}
