import type { ReactNode } from "react";
import { DAY_MS, formatDate, formatMoney } from "@/demos/kit/format";
import { Dialog, Pill } from "@/demos/kit/ui";
import { MARK_LABEL, PAY_METHODS, RISK_WINDOW_DAYS, formatPhone, monthEnd, monthKey, monthLabel, shiftMonth, summarize, type Mark, todayStart, formatDateYear, plural } from "./data";
import { RatePill, StepBar } from "./shared";
import type { Academy } from "./store";

const markTone: Record<Mark, "success" | "danger" | "warning"> = { presente: "success", ausente: "danger", excusa: "warning" };

/** Ficha del estudiante: datos, asistencia, módulo, pagos y notas. */
export function StudentProfile({ academy, studentId, onClose }: { academy: Academy; studentId: string | null; onClose: () => void }) {
  const student = academy.students.find((s) => s.id === studentId);
  const group = student && academy.groups.find((g) => g.id === student.groupId);

  const today = todayStart();
  const recent = student ? summarize(academy.sessions, student.id, today - RISK_WINDOW_DAYS * DAY_MS) : null;
  const total = student ? summarize(academy.sessions, student.id) : null;
  const history = student
    ? academy.sessions
        .filter((s) => s.marks[student.id])
        .sort((a, b) => b.date - a.date)
        .slice(0, 8)
    : [];
  const months = [0, -1, -2].map((d) => shiftMonth(monthKey(today), d));
  const notes = student ? academy.notes.filter((n) => n.studentId === student.id).sort((a, b) => b.date - a.date) : [];

  return (
    <Dialog open={Boolean(student)} onClose={onClose} title={student ? `Ficha de ${student.name}` : "Ficha"} wide>
      {student && (
        <div className="space-y-5 text-sm">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            <Info label="Grupo" value={group?.name ?? "Sin grupo"} />
            <Info label="Estado" value={student.status === "activo" ? <Pill tone="success">Activo</Pill> : <Pill>Retirado</Pill>} />
            <Info label="Edad" value={`${student.age} años`} />
            <Info label="Ingreso" value={formatDateYear(student.joinedAt)} />
            <Info label="Acudiente" value={student.guardian} />
            <Info label="Teléfono" value={formatPhone(student.guardianPhone)} />
          </dl>

          <section aria-label="Asistencia">
            <h3 className="mb-2 font-semibold text-text">Asistencia</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-text-muted">
              <span className="flex items-center gap-2">
                Últimas 8 semanas <RatePill rate={recent!.rate} />
              </span>
              <span className="tabular-nums">
                Total: {plural(total!.presente, "presente", "presentes")}, {plural(total!.ausente, "ausencia", "ausencias")}, {plural(total!.excusa, "excusa", "excusas")}
              </span>
            </div>
            {history.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Últimas sesiones">
                {history.map((s) => (
                  <li key={s.id}>
                    <Pill tone={markTone[s.marks[student.id]]}>
                      {formatDate(s.date)}: {MARK_LABEL[s.marks[student.id]]}
                    </Pill>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {group && (
            <section aria-label="Módulo actual">
              <h3 className="mb-2 font-semibold text-text">Módulo actual</h3>
              <StepBar group={group} index={student.moduleIndex} />
            </section>
          )}

          <section aria-label="Pagos">
            <h3 className="mb-2 font-semibold text-text">Pagos</h3>
            <ul className="divide-y divide-border rounded-md border border-border">
              {months.map((m) => {
                const p = academy.payments.find((x) => x.studentId === student.id && x.month === m);
                const billed = student.joinedAt <= monthEnd(m);
                return (
                  <li key={m} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span>{monthLabel(m)}</span>
                    {p ? (
                      <span className="flex items-center gap-2 text-text-muted">
                        <span className="tabular-nums">{formatMoney(p.amount)}</span>
                        <Pill tone="success">
                          Pagado el {formatDate(p.paidAt)} · {PAY_METHODS.find((x) => x.id === p.method)?.label}
                        </Pill>
                      </span>
                    ) : billed && student.status === "activo" ? (
                      <Pill tone="warning">Pendiente</Pill>
                    ) : (
                      <Pill>No aplica</Pill>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-label="Notas del profesor">
            <h3 className="mb-2 font-semibold text-text">Notas del profesor</h3>
            {notes.length === 0 ? (
              <p className="text-text-muted">Sin notas todavía.</p>
            ) : (
              <ul className="space-y-2">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-md border border-border px-3 py-2">
                    <p className="text-[12px] text-text-subtle">{formatDate(n.date)}</p>
                    <p className="text-text">{n.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-1.5">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-right text-text">{value}</dd>
    </div>
  );
}
