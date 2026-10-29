import { useState } from "react";
import { DAY_MS, formatDate, formatDateLong, formatMoney } from "@/demos/kit/format";
import { Btn, Field, Pill, inputClass } from "@/demos/kit/ui";
import { MARK_LABEL, PAY_METHODS, formatPhone, monthEnd, monthKey, monthLabel, monthStart, scheduleLabel, shiftMonth, summarize, todayStart, nowMs, plural } from "./data";
import { DocFooter, DocHeader, PRINT_CSS } from "./Document";
import { EmptyState, StepBar } from "./shared";
import type { GoTo, ScreenProps } from "./store";

type Period = "mes-actual" | "mes-anterior" | "ultimos-3-meses" | "ultimas-8-semanas";

const PERIODS: { id: Period; label: string }[] = [
  { id: "mes-actual", label: "Este mes" },
  { id: "mes-anterior", label: "Mes anterior" },
  { id: "ultimas-8-semanas", label: "Últimas 8 semanas" },
  { id: "ultimos-3-meses", label: "Últimos 3 meses" },
];

function periodRange(period: Period) {
  const today = todayStart();
  const current = monthKey(today);
  switch (period) {
    case "mes-actual":
      return { from: monthStart(current), to: today + DAY_MS - 1, title: monthLabel(current) };
    case "mes-anterior": {
      const prev = shiftMonth(current, -1);
      return { from: monthStart(prev), to: monthEnd(prev), title: monthLabel(prev) };
    }
    case "ultimas-8-semanas":
      return { from: today - 56 * DAY_MS, to: today + DAY_MS - 1, title: `${formatDate(today - 56 * DAY_MS)} a ${formatDate(today)}` };
    case "ultimos-3-meses": {
      const first = shiftMonth(current, -2);
      return { from: monthStart(first), to: today + DAY_MS - 1, title: `${monthLabel(first)} a ${monthLabel(current)}` };
    }
  }
}


export function Reports({ academy, goTo, initialStudentId = null }: Omit<ScreenProps, "notify"> & { goTo: GoTo; initialStudentId?: string | null }) {
  const { groups, students, sessions, notes, payments, comments, settings } = academy;
  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const [studentId, setStudentId] = useState(initialStudentId ?? sorted[0]?.id ?? "");
  const [period, setPeriod] = useState<Period>("mes-actual");

  const student = students.find((s) => s.id === studentId) ?? sorted[0];
  if (!student)
    return (
      <EmptyState
        title="Aún no hay estudiantes"
        actions={
          <Btn variant="primary" onClick={() => goTo("estudiantes")}>
            Ir a Estudiantes
          </Btn>
        }
      >
        Los reportes para acudientes salen de la asistencia, el progreso y los pagos de cada estudiante. Crea o importa tus estudiantes para empezar.
      </EmptyState>
    );

  const group = groups.find((g) => g.id === student.groupId);
  const range = periodRange(period);
  const summary = summarize(sessions, student.id, range.from, range.to);
  const attended = sessions.filter((s) => s.marks[student.id] && s.date >= range.from && s.date <= range.to).sort((a, b) => a.date - b.date);
  const periodNotes = notes.filter((n) => n.studentId === student.id && n.date >= range.from && n.date <= range.to).sort((a, b) => a.date - b.date);
  const months: string[] = [];
  for (let m = monthKey(range.from); monthStart(m) <= range.to; m = shiftMonth(m, 1)) months.push(m);
  const commentKey = `${student.id}:${period}`;
  const comment = comments[commentKey] ?? "";
  const total = group?.modules.length ?? 0;

  return (
    <div className="space-y-5">
      <style>{PRINT_CSS}</style>

      <div className="ra-no-print flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Estudiante" className="sm:w-72">
          {(id) => (
            <select id={id} value={student.id} onChange={(e) => setStudentId(e.target.value)} className={inputClass}>
              {sorted.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.status === "retirado" ? `${s.name} (retirado)` : s.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Periodo" className="sm:w-56">
          {(id) => (
            <select id={id} value={period} onChange={(e) => setPeriod(e.target.value as Period)} className={inputClass}>
              {PERIODS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Btn variant="primary" className="sm:ml-auto" onClick={() => window.print()}>
          Imprimir
        </Btn>
      </div>

      <article aria-label={`Reporte de ${student.name}`} className="ra-doc mx-auto max-w-3xl space-y-6 rounded-lg border border-border bg-bg p-5 text-sm sm:p-8">
        <DocHeader settings={settings} kind="Reporte para acudientes">
          <p className="ra-muted text-[13px] text-text-muted">Emitido el {formatDateLong(nowMs())}</p>
        </DocHeader>
        <div>
          <h3 className="font-display text-2xl text-text">{student.name}</h3>
          <p className="ra-muted text-text-muted">Periodo: {range.title}</p>
        </div>

        <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          <Row label="Grupo" value={group?.name ?? "Sin grupo"} />
          <Row label="Horario" value={group ? scheduleLabel(group) : "—"} />
          <Row label="Profesor" value={group?.teacher ?? "—"} />
          <Row label="Edad" value={`${student.age} años`} />
          <Row label="Acudiente" value={student.guardian} />
          <Row label="Teléfono" value={formatPhone(student.guardianPhone)} />
        </dl>

        <section aria-label="Asistencia del periodo">
          <h4 className="mb-2 font-semibold text-text">Asistencia del periodo</h4>
          <p className="text-text tabular-nums">
            {summary.rate === null ? "Sin sesiones registradas en el periodo." : `${summary.rate} % de asistencia`}
            <span className="ra-muted text-text-muted">
              {" "}
              · {plural(summary.presente, "presente", "presentes")}, {plural(summary.ausente, "ausencia", "ausencias")}, {summary.excusa} con excusa
            </span>
          </p>
          {attended.length > 0 && (
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
              {attended.map((s) => (
                <li key={s.id} className="flex justify-between gap-2 border-b border-border py-1">
                  <span className="ra-muted text-text-muted tabular-nums">{formatDate(s.date)}</span>
                  <span className={s.marks[student.id] === "ausente" ? "text-danger" : "text-text"}>{MARK_LABEL[s.marks[student.id]]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {group && (
          <section aria-label="Módulo actual y avance">
            <h4 className="mb-2 font-semibold text-text">Módulo actual y avance</h4>
            <StepBar group={group} index={student.moduleIndex} />
            <p className="mt-1 text-text tabular-nums">Avance de la ruta: {total ? Math.round((Math.min(student.moduleIndex, total) / total) * 100) : 0} %</p>
            <ol className="mt-2 space-y-0.5">
              {group.modules.map((m, i) => (
                <li key={m.id} className="flex justify-between gap-3">
                  <span className="text-text">
                    {i + 1}. {m.name}
                  </span>
                  <span className="ra-muted text-text-muted">{i < student.moduleIndex ? "Completado" : i === student.moduleIndex ? "En curso" : "Pendiente"}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section aria-label="Notas del profesor">
          <h4 className="mb-2 font-semibold text-text">Notas del profesor</h4>
          {periodNotes.length === 0 ? (
            <p className="ra-muted text-text-muted">Sin notas en este periodo.</p>
          ) : (
            <ul className="space-y-1.5">
              {periodNotes.map((n) => (
                <li key={n.id}>
                  <span className="ra-muted text-text-muted tabular-nums">{formatDate(n.date)}:</span> <span className="text-text">{n.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Estado de pagos">
          <h4 className="mb-2 font-semibold text-text">Estado de pagos</h4>
          <ul className="divide-y divide-border">
            {months.map((m) => {
              const p = payments.find((x) => x.studentId === student.id && x.month === m);
              const applies = student.joinedAt <= monthEnd(m) && (student.status === "activo" || p);
              return (
                <li key={m} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                  <span className="text-text">{monthLabel(m)}</span>
                  {p ? (
                    <span className="text-text tabular-nums">
                      Pagado ({formatMoney(p.amount)}, {formatDate(p.paidAt)}, {PAY_METHODS.find((x) => x.id === p.method)?.label.toLowerCase()})
                    </span>
                  ) : applies ? (
                    <Pill tone="warning">Pendiente: {formatMoney(group?.fee ?? 0)}</Pill>
                  ) : (
                    <span className="ra-muted text-text-muted">No aplica</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-label="Comentario">
          <h4 className="mb-2 font-semibold text-text">Comentario</h4>
          <div className="ra-no-print">
            <Field label="Comentario para el acudiente" hint="Se guarda solo y sale en la versión impresa.">
              {(id) => (
                <textarea
                  id={id}
                  rows={3}
                  value={comment}
                  onChange={(e) => academy.setComment(commentKey, e.target.value)}
                  placeholder="Un mensaje corto sobre el periodo: logros, retos y qué practicar en casa."
                  className={inputClass}
                />
              )}
            </Field>
          </div>
          <p className="ra-print-only whitespace-pre-wrap text-text">{comment || "Sin comentarios adicionales."}</p>
        </section>

        <DocFooter settings={settings} extra="Las excusas no cuentan en contra del porcentaje de asistencia." />
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border py-1">
      <dt className="ra-muted text-text-muted">{label}</dt>
      <dd className="text-right text-text">{value}</dd>
    </div>
  );
}
