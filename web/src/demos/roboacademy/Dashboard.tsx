import { useState } from "react";
import { DAY_MS, formatDateLong, formatMoney } from "@/demos/kit/format";
import { Btn, Empty, Panel, Pill, Stat } from "@/demos/kit/ui";
import { RISK_THRESHOLD, RISK_WINDOW_DAYS, activeIn, billedStudents, monthKey, monthLabel, sessionDateTime, sessionDates, summarize, timeLabel, todayStart, plural } from "./data";
import { CapacityBar, RatePill } from "./shared";
import { StudentProfile } from "./StudentProfile";
import type { ScreenProps } from "./store";

export function Dashboard({ academy, onNavigate }: Omit<ScreenProps, "notify"> & { onNavigate: (view: "pagos" | "asistencia") => void }) {
  const { groups, students, sessions, payments } = academy;
  const [profileId, setProfileId] = useState<string | null>(null);

  const today = todayStart();
  const month = monthKey(today);
  const active = students.filter((s) => s.status === "activo");

  // Asistencia del mes: presentes sobre presentes + ausentes (las excusas no cuentan en contra).
  let present = 0;
  let counted = 0;
  for (const s of sessions) {
    if (monthKey(s.date) !== month) continue;
    for (const mark of Object.values(s.marks)) {
      if (mark === "excusa") continue;
      counted++;
      if (mark === "presente") present++;
    }
  }
  const monthRate = counted ? Math.round((present / counted) * 100) : null;

  const billed = billedStudents(students, payments, month);
  const feeOf = (groupId: string) => groups.find((g) => g.id === groupId)?.fee ?? 0;
  const paidThisMonth = payments.filter((p) => p.month === month);
  const pending = billed.filter((s) => !paidThisMonth.some((p) => p.studentId === s.id));
  const pendingAmount = pending.reduce((sum, s) => sum + feeOf(s.groupId), 0);
  const collected = paidThisMonth.reduce((sum, p) => sum + p.amount, 0);

  const upcoming = groups
    .flatMap((g) => sessionDates(g, today, today + 6 * DAY_MS).map((date) => ({ group: g, date, at: sessionDateTime(g, date) })))
    .sort((a, b) => a.at - b.at);

  const atRisk = active
    .map((s) => ({ student: s, summary: summarize(sessions, s.id, today - RISK_WINDOW_DAYS * DAY_MS) }))
    .filter((r) => r.summary.rate !== null && r.summary.presente + r.summary.ausente >= 3 && r.summary.rate < RISK_THRESHOLD)
    .sort((a, b) => a.summary.rate! - b.summary.rate!);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Estudiantes activos" value={active.length} detail={`En ${groups.length} grupos`} />
        <Stat
          label={`Asistencia de ${monthLabel(month).split(" ")[0].toLowerCase()}`}
          value={monthRate === null ? "—" : `${monthRate} %`}
          detail={monthRate === null ? "Aún sin sesiones este mes" : `${present} presencias registradas`}
          tone={monthRate !== null && monthRate < RISK_THRESHOLD ? "danger" : undefined}
        />
        <Stat label="Mensualidades pendientes" value={pending.length} detail={`${formatMoney(pendingAmount)} por cobrar`} tone={pending.length ? "warning" : "success"} />
        <Stat label="Recaudo del mes" value={formatMoney(collected)} detail={`de ${formatMoney(collected + pendingAmount)} esperado`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Próximas clases de la semana"
          actions={
            <Btn size="sm" variant="ghost" onClick={() => onNavigate("asistencia")}>
              Tomar asistencia
            </Btn>
          }
        >
          {upcoming.length === 0 ? (
            <Empty>No hay clases en los próximos siete días.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map(({ group, date }) => {
                const enrolled = activeIn(students, group.id).length;
                return (
                  <li key={`${group.id}-${date}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-text">{group.name}</p>
                      <p className="text-[13px] text-text-muted">
                        {date === today ? "Hoy" : formatDateLong(date)} · {timeLabel(group.time)} · {group.teacher}
                      </p>
                    </div>
                    <Pill tone={date === today ? "brand" : "neutral"}>
                      {enrolled} de {group.capacity} cupos
                    </Pill>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title={`Estudiantes en riesgo (asistencia menor a ${RISK_THRESHOLD} %)`}>
          {atRisk.length === 0 ? (
            <Empty>Nadie por debajo del {RISK_THRESHOLD} % en las últimas 8 semanas.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {atRisk.map(({ student, summary }) => (
                <li key={student.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-text">{student.name}</p>
                    <p className="text-[13px] text-text-muted tabular-nums">
                      {groups.find((g) => g.id === student.groupId)?.name} · {plural(summary.ausente, "ausencia", "ausencias")} en 8 semanas
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RatePill rate={summary.rate} />
                    <Btn size="sm" variant="ghost" onClick={() => setProfileId(student.id)} aria-label={`Ver ficha de ${student.name}`}>
                      Ver ficha
                    </Btn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Ocupación por grupo"
        actions={
          <Btn size="sm" variant="ghost" onClick={() => onNavigate("pagos")}>
            Ver pagos
          </Btn>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <div key={g.id}>
              <p className="mb-1 truncate text-sm font-semibold text-text">{g.name}</p>
              <CapacityBar used={activeIn(students, g.id).length} capacity={g.capacity} />
            </div>
          ))}
        </div>
      </Panel>

      <StudentProfile academy={academy} studentId={profileId} onClose={() => setProfileId(null)} />
    </div>
  );
}
