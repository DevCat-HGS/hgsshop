import { useState, type ReactNode } from "react";
import { DAY_MS, formatDate, formatDateLong, formatMoney } from "@/demos/kit/format";
import { Btn, Field, Pill, inputClass } from "@/demos/kit/ui";
import {
  DUE_DAY,
  MARK_LABEL,
  PAY_METHODS,
  RISK_WINDOW_DAYS,
  billedStudents,
  formatPhone,
  monthKey,
  monthLabel,
  monthStart,
  receiptLabel,
  scheduleLabel,
  sessionDates,
  shiftMonth,
  summarize,
  timeLabel,
  todayStart,
  plural,
  type Mark,
} from "./data";
import { ClientFrame, EmptyState, RatePill, StepBar } from "./shared";
import type { GoTo, ScreenProps } from "./store";

const markTone: Record<Mark, "success" | "danger" | "warning"> = { presente: "success", ausente: "danger", excusa: "warning" };

/**
 * Portal del acudiente: lo que ve un padre de familia de su hijo, de solo lectura. Asistencia, módulo, notas del
 * profesor, pagos hechos y próximos pagos. La academia elige el estudiante para revisar qué ve cada familia.
 */
export function Portal({ academy, goTo, initialStudentId = null }: Omit<ScreenProps, "notify"> & { goTo: GoTo; initialStudentId?: string | null }) {
  const { groups, students, sessions, notes, payments, settings } = academy;
  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const [studentId, setStudentId] = useState(initialStudentId ?? sorted.find((s) => s.status === "activo")?.id ?? sorted[0]?.id ?? "");
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
        Cada familia ve en su portal la asistencia, el módulo, las notas del profesor y los pagos de su hijo. Crea, importa o inscribe estudiantes
        para verlo.
      </EmptyState>
    );

  const group = groups.find((g) => g.id === student.groupId);
  const today = todayStart();
  const recent = summarize(sessions, student.id, today - RISK_WINDOW_DAYS * DAY_MS);
  const history = sessions
    .filter((s) => s.marks[student.id])
    .sort((a, b) => b.date - a.date)
    .slice(0, 8);
  const studentNotes = notes.filter((n) => n.studentId === student.id).sort((a, b) => b.date - a.date);
  const paid = payments.filter((p) => p.studentId === student.id).sort((a, b) => b.month.localeCompare(a.month));
  const nextClass = group && student.status === "activo" ? sessionDates(group, today, today + 6 * DAY_MS).at(-1) : undefined;

  // Próximos pagos: la mensualidad de este mes si está pendiente y la del mes siguiente.
  const current = monthKey(today);
  const fee = group?.fee ?? 0;
  const upcoming: { month: string; due: number; overdue: boolean }[] = [];
  if (student.status === "activo") {
    for (const month of [current, shiftMonth(current, 1)]) {
      const billed = month !== current || billedStudents([student], payments, month).length > 0;
      if (!billed || payments.some((p) => p.studentId === student.id && p.month === month)) continue;
      const due = monthStart(month) + (DUE_DAY - 1) * DAY_MS;
      upcoming.push({ month, due, overdue: due < today });
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Ver el portal de" className="sm:w-80">
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

      <ClientFrame
        label="Portal del acudiente"
        address={`portal · ${settings.name}`}
        notice={`Vista de solo lectura para ${student.guardian}. En la demo no hay un enlace real: así vería la familia la información de ${student.name}.`}
      >
        <article aria-label={`Portal de ${student.name}`} className="space-y-6 text-sm">
          <header>
            <p className="text-[13px] font-semibold tracking-wide text-brand-soft uppercase">{settings.name}</p>
            <h3 className="font-display text-2xl text-text">Hola, {student.guardian.split(" ")[0]}</h3>
            <p className="mt-1 text-text-muted">
              Así va {student.name}
              {group ? ` en ${group.name} (${scheduleLabel(group)}, con ${group.teacher})` : ""}.
              {student.status === "retirado" && " Ya no está inscrito en la academia."}
            </p>
            {nextClass !== undefined && group && (
              <p className="mt-2">
                <Pill tone="brand">
                  Próxima clase: {nextClass === today ? "hoy" : formatDateLong(nextClass)}, {timeLabel(group.time)}
                </Pill>
              </p>
            )}
          </header>

          <Section title="Asistencia">
            <p className="flex flex-wrap items-center gap-2 text-text">
              Últimas 8 semanas <RatePill rate={recent.rate} />
              <span className="text-text-muted tabular-nums">
                {plural(recent.presente, "clase", "clases")} asistidas, {plural(recent.ausente, "falta", "faltas")}, {recent.excusa} con excusa
              </span>
            </p>
            {history.length > 0 ? (
              <ul aria-label="Últimas clases" className="mt-2 flex flex-wrap gap-1.5">
                {history.map((s) => (
                  <li key={s.id}>
                    <Pill tone={markTone[s.marks[student.id]]}>
                      {formatDate(s.date)}: {MARK_LABEL[s.marks[student.id]]}
                    </Pill>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-text-muted">Aún no hay clases registradas.</p>
            )}
          </Section>

          {group && (
            <Section title="Módulo actual">
              <StepBar group={group} index={student.moduleIndex} />
            </Section>
          )}

          <Section title="Notas del profesor">
            {studentNotes.length === 0 ? (
              <p className="text-text-muted">Sin notas todavía.</p>
            ) : (
              <ul className="space-y-2">
                {studentNotes.slice(0, 5).map((n) => (
                  <li key={n.id} className="rounded-md border border-border px-3 py-2">
                    <p className="text-[12px] text-text-subtle">{formatDateLong(n.date)}</p>
                    <p className="text-text">{n.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Próximos pagos">
            {upcoming.length === 0 ? (
              <p className="text-text-muted">{student.status === "activo" ? "Estás al día. No hay pagos pendientes." : "No hay pagos por hacer."}</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {upcoming.map((u) => (
                  <li key={u.month} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span className="text-text">Mensualidad de {monthLabel(u.month).toLowerCase()}</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums">{formatMoney(fee)}</span>
                      <Pill tone={u.overdue ? "danger" : "warning"}>
                        {u.overdue ? "Vencida" : "Vence"} el {formatDateLong(u.due)}
                      </Pill>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Pagos realizados">
            {paid.length === 0 ? (
              <p className="text-text-muted">Aún no hay pagos registrados.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {paid.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span className="text-text">
                      {monthLabel(p.month)} <span className="text-text-subtle tabular-nums">· {receiptLabel(p.receipt)}</span>
                    </span>
                    <span className="flex items-center gap-2 text-text-muted">
                      <span className="tabular-nums">{formatMoney(p.amount)}</span>
                      <Pill tone="success">
                        Pagado el {formatDate(p.paidAt)} · {PAY_METHODS.find((m) => m.id === p.method)?.label}
                      </Pill>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {(settings.phone || settings.footer) && (
            <footer className="border-t border-border pt-3 text-[12px] text-text-subtle">
              {settings.footer && <p className="whitespace-pre-wrap">{settings.footer}</p>}
              {settings.phone && <p>¿Dudas? Escríbenos al {formatPhone(settings.phone)}.</p>}
            </footer>
          )}
        </article>
      </ClientFrame>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h4 className="mb-2 font-semibold text-text">{title}</h4>
      {children}
    </section>
  );
}
