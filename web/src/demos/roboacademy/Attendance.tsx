import { useState } from "react";
import { downloadCsv } from "@/demos/kit/csv";
import { DAY_MS, formatDate, formatDateLong, startOfDay } from "@/demos/kit/format";
import { Btn, Empty, Field, Panel, Table, inputClass } from "@/demos/kit/ui";
import { MARK_LABEL, sessionDates, sessionId, timeLabel, type Group, type Mark, type Session, type Student, todayStart, plural } from "./data";
import { EmptyState, GroupSelect } from "./shared";
import type { GoTo, ScreenProps } from "./store";

const MARKS: Mark[] = ["presente", "ausente", "excusa"];
const markActive: Record<Mark, string> = {
  presente: "bg-success-muted text-success border-success",
  ausente: "bg-danger-muted text-danger border-danger",
  excusa: "bg-warning-muted text-warning border-warning",
};

/** Estudiantes que aparecen en una sesión: activos que ya habían ingresado, más quien ya tenga registro. */
function rosterFor(students: Student[], group: Group, date: number, session?: Session) {
  return students
    .filter((s) => (s.groupId === group.id && s.status === "activo" && startOfDay(s.joinedAt) <= date) || (session && session.marks[s.id]))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function Attendance({ academy, notify, goTo }: ScreenProps & { goTo: GoTo }) {
  const { groups, students, sessions } = academy;
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [picked, setPicked] = useState<number | null>(null);

  const group = groups.find((g) => g.id === groupId);
  if (!group) return <Empty>Crea un grupo para tomar asistencia.</Empty>;
  if (students.length === 0)
    return (
      <EmptyState
        title="Aún no hay estudiantes"
        actions={
          <Btn variant="primary" onClick={() => goTo("estudiantes")}>
            Ir a Estudiantes
          </Btn>
        }
      >
        La asistencia se toma por grupo y sesión con los estudiantes inscritos. Crea o importa tus estudiantes para empezar.
      </EmptyState>
    );

  const today = todayStart();
  const dates = sessionDates(group, today - 10 * 7 * DAY_MS, today);
  const date = picked !== null && dates.includes(picked) ? picked : dates[0];
  const session = sessions.find((s) => s.id === sessionId(group.id, date));
  const roster = rosterFor(students, group, date, session);
  const count = (mark: Mark) => roster.filter((s) => session?.marks[s.id] === mark).length;
  const unmarked = roster.filter((s) => !session?.marks[s.id]).length;

  function mark(student: Student, value: Mark) {
    academy.setMarks(group!.id, date, { [student.id]: value });
  }

  function markAll() {
    academy.setMarks(group!.id, date, Object.fromEntries(roster.map((s) => [s.id, "presente" as Mark])));
    notify("Todos marcados como presentes");
  }

  function exportCsv() {
    const g = group!;
    const rows = dates.flatMap((d) => {
      const s = sessions.find((x) => x.id === sessionId(g.id, d));
      return rosterFor(students, g, d, s).map((st) => [g.name, formatDate(d), timeLabel(g.time), st.name, s?.marks[st.id] ? MARK_LABEL[s.marks[st.id]] : "Sin registrar"]);
    });
    downloadCsv("roboacademy-asistencia", ["Grupo", "Fecha", "Hora", "Estudiante", "Asistencia"], rows);
  }
  const historyRows = dates.reduce((n, d) => n + rosterFor(students, group, d, sessions.find((x) => x.id === sessionId(group.id, d))).length, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <Field label="Grupo">
          {(id) => (
            <GroupSelect
              id={id}
              groups={groups}
              value={group.id}
              onChange={(v) => {
                setGroupId(v);
                setPicked(null);
              }}
            />
          )}
        </Field>
        <Field label="Sesión">
          {(id) => (
            <select id={id} value={date} onChange={(e) => setPicked(Number(e.target.value))} className={inputClass}>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {d === today ? `Hoy, ${formatDate(d)}` : formatDateLong(d)}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Panel
        title={`${group.name}: ${formatDateLong(date)}, ${timeLabel(group.time)}`}
        actions={
          <Btn size="sm" variant="primary" onClick={markAll} disabled={roster.length === 0}>
            Marcar todos presentes
          </Btn>
        }
      >
        <p className="mb-3 text-[13px] text-text-muted tabular-nums" aria-live="polite">
          {plural(count("presente"), "presente", "presentes")} · {plural(count("ausente"), "ausente", "ausentes")} · {count("excusa")} con excusa · {unmarked} sin registrar
        </p>
        {roster.length === 0 ? (
          <Empty>No había estudiantes inscritos en esta fecha.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {roster.map((s) => {
              const current = session?.marks[s.id];
              return (
                <li key={s.id} className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold text-text">{s.name}</span>
                  <div role="group" aria-label={`Asistencia de ${s.name}`} className="grid grid-cols-3 gap-1.5 sm:flex">
                    {MARKS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={current === m}
                        onClick={() => mark(s, m)}
                        className={`rounded-md border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                          current === m ? markActive[m] : "border-border-strong text-text-muted hover:bg-surface-hover hover:text-text"
                        }`}
                      >
                        {MARK_LABEL[m]}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <section aria-label="Historial de sesiones" className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-text">Historial de {group.name}</h3>
          <Btn size="sm" aria-label={`Exportar asistencia de ${group.name} a CSV`} onClick={exportCsv} disabled={historyRows === 0}>
            Exportar CSV
          </Btn>
        </div>
        <Table label={`Historial de sesiones de ${group.name}`} head={["Fecha", "Presentes", "Ausentes", "Excusas", "Sin registrar", ""]} minWidth="36rem">
          {dates.map((d) => {
            const s = sessions.find((x) => x.id === sessionId(group.id, d));
            const r = rosterFor(students, group, d, s);
            const values = Object.values(s?.marks ?? {});
            const pending = r.filter((st) => !s?.marks[st.id]).length;
            return (
              <tr key={d} className={d === date ? "bg-surface" : undefined}>
                <th scope="row" className="font-semibold whitespace-nowrap text-text">
                  {d === today ? "Hoy" : formatDate(d)}
                </th>
                <td className="tabular-nums">{values.filter((v) => v === "presente").length}</td>
                <td className="tabular-nums">{values.filter((v) => v === "ausente").length}</td>
                <td className="tabular-nums">{values.filter((v) => v === "excusa").length}</td>
                <td className={`tabular-nums ${pending ? "text-warning" : "text-text-muted"}`}>{pending}</td>
                <td className="text-right">
                  <Btn size="sm" variant="ghost" aria-label={`Abrir sesión del ${formatDate(d)}`} onClick={() => setPicked(d)} disabled={d === date}>
                    {d === date ? "Abierta" : "Abrir"}
                  </Btn>
                </td>
              </tr>
            );
          })}
        </Table>
      </section>
    </div>
  );
}
