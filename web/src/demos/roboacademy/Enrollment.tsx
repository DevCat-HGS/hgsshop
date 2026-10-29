import { useState } from "react";
import { downloadCsv } from "@/demos/kit/csv";
import { DAY_MS, formatDate, formatDateLong, formatDateTime, formatTime, fromDateInput, matches, relativeDays, toDateInput } from "@/demos/kit/format";
import { uid } from "@/demos/kit/storage";
import { Btn, ConfirmButton, Dialog, Empty, Field, FormError, Pill, SearchField, Stat, inputClass } from "@/demos/kit/ui";
import {
  APPLICANT_STATUS,
  DISCARD_REASONS,
  activeIn,
  formatPhone,
  groupsForAge,
  nowMs,
  sameName,
  scheduleLabel,
  sessionDates,
  statusInfo,
  todayStart,
  type Applicant,
  type ApplicantStatus,
  type Group,
} from "./data";
import { EmptyState } from "./shared";
import type { Academy, GoTo, ScreenProps } from "./store";

type StatusFilter = "" | "abiertos" | ApplicantStatus;
type Action = { kind: "prueba" | "descartar" | "inscribir" | "seguimiento"; id: string };

const OPEN: ApplicantStatus[] = ["nuevo", "contactado", "prueba"];

/** Lista de aspirantes: del formulario público a estudiante inscrito, con su seguimiento. */
export function Enrollment({
  academy,
  notify,
  goTo,
  onOpenStudent,
  initialApplicantId = null,
}: ScreenProps & { goTo: GoTo; onOpenStudent: (studentId: string) => void; initialApplicantId?: string | null }) {
  const { applicants, groups } = academy;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>(initialApplicantId ? "" : "abiertos");
  const [groupId, setGroupId] = useState("");
  const [action, setAction] = useState<Action | null>(initialApplicantId ? { kind: "seguimiento", id: initialApplicantId } : null);

  const today = todayStart();
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name;
  const count = (s: ApplicantStatus) => applicants.filter((a) => a.status === s).length;
  const upcomingTrials = applicants.filter((a) => a.status === "prueba" && a.trialAt !== null && a.trialAt >= today).length;
  const enrolledRecently = applicants.filter((a) => a.status === "inscrito" && a.log.some((l) => l.kind === "estado" && l.text.startsWith("Inscrito") && l.at >= today - 30 * DAY_MS)).length;

  const visible = applicants
    .filter((a) => (status === "abiertos" ? OPEN.includes(a.status) : !status || a.status === status))
    .filter((a) => !groupId || a.groupId === groupId)
    .filter((a) => !query || matches(`${a.childName} ${a.guardian} ${a.phone} ${a.email}`, query))
    .sort((a, b) => OPEN.indexOf(a.status) - OPEN.indexOf(b.status) || b.createdAt - a.createdAt);

  const current = action ? applicants.find((a) => a.id === action.id) : undefined;
  const close = () => setAction(null);

  function contacted(a: Applicant) {
    academy.setApplicantStatus(a.id, "contactado", {}, "Marcado como contactado");
    notify(`${a.childName}: contactado`);
  }

  function reopen(a: Applicant) {
    academy.setApplicantStatus(a.id, "contactado", { discardReason: "" }, "Reabierto");
    notify(`${a.childName}: reabierto`);
  }

  function exportCsv() {
    downloadCsv(
      "roboacademy-aspirantes",
      ["Aspirante", "Edad", "Acudiente", "Teléfono", "Correo", "Grupo de interés", "Cómo nos conoció", "Recibido", "Estado", "Clase de prueba", "Motivo de descarte"],
      visible.map((a) => [
        a.childName,
        a.age,
        a.guardian,
        formatPhone(a.phone),
        a.email,
        groupName(a.groupId) ?? "Pide recomendación",
        a.source,
        formatDate(a.createdAt),
        statusInfo(a.status).label,
        a.trialAt ? formatDateTime(a.trialAt) : "",
        a.discardReason,
      ]),
    );
  }

  if (applicants.length === 0)
    return (
      <EmptyState
        title="Aún no hay aspirantes"
        actions={
          <Btn variant="primary" onClick={() => goTo("formulario")}>
            Abrir el formulario de inscripción
          </Btn>
        }
      >
        Las inscripciones que llegan desde el formulario público aparecen aquí para hacerles seguimiento: contactar, agendar la clase de prueba e
        inscribir. También puedes llenarlo tú cuando un acudiente llama o escribe.
      </EmptyState>
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Nuevos por contactar" value={count("nuevo")} tone={count("nuevo") ? "warning" : undefined} />
        <Stat label="En seguimiento" value={count("contactado") + count("prueba")} detail={`${count("contactado")} contactados · ${count("prueba")} con clase de prueba`} />
        <Stat label="Clases de prueba próximas" value={upcomingTrials} />
        <Stat label="Inscritos en 30 días" value={enrolledRecently} tone={enrolledRecently ? "success" : undefined} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <SearchField value={query} onChange={setQuery} label="Buscar aspirante" placeholder="Niño, acudiente, teléfono o correo" />
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Field label="Estado">
            {(id) => (
              <select id={id} value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={inputClass}>
                <option value="abiertos">En curso</option>
                {APPLICANT_STATUS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
                <option value="">Todos</option>
              </select>
            )}
          </Field>
          <Field label="Grupo de interés">
            {(id) => (
              <select id={id} value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputClass}>
                <option value="">Todos</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Btn size="sm" className="sm:mb-1" aria-label="Exportar aspirantes a CSV" onClick={exportCsv} disabled={visible.length === 0}>
            Exportar CSV
          </Btn>
          <Btn variant="primary" className="flex-1 sm:flex-none" onClick={() => goTo("formulario")}>
            Nuevo aspirante
          </Btn>
        </div>
      </div>

      {visible.length === 0 ? (
        <Empty>Ningún aspirante coincide con la búsqueda o los filtros.</Empty>
      ) : (
        <ul aria-label="Aspirantes" className="divide-y divide-border rounded-lg border border-border bg-bg">
          {visible.map((a) => {
            const info = statusInfo(a.status);
            const last = a.log.filter((l) => l.kind === "nota").at(-1);
            return (
              <li key={a.id} aria-label={a.childName} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="min-w-0 space-y-1 text-sm">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-text">{a.childName}</span>
                    <span className="text-text-muted">{a.age} años</span>
                    <Pill tone={info.tone}>{info.label}</Pill>
                    {a.status === "prueba" && a.trialAt && (
                      <Pill tone={a.trialAt < today ? "warning" : "neutral"}>
                        {a.trialAt < today ? "Prueba vencida: " : ""}
                        {formatDateLong(a.trialAt)}, {formatTime(a.trialAt)}
                      </Pill>
                    )}
                  </p>
                  <p className="text-text-muted">
                    {a.guardian} · <span className="tabular-nums">{formatPhone(a.phone)}</span>
                    {a.email && <span className="break-all"> · {a.email}</span>}
                  </p>
                  <p className="text-[13px] text-text-subtle">
                    {groupName(a.groupId) ?? "Pide recomendación de grupo"} · {a.source} · recibido {relativeDays(a.createdAt)}
                  </p>
                  {a.status === "descartado" && a.discardReason && <p className="text-[13px] text-danger">Motivo: {a.discardReason}</p>}
                  {last && <p className="truncate text-[13px] text-text-muted" title={last.text}>Última nota: {last.text}</p>}
                </div>
                <div className="flex flex-wrap gap-1 lg:max-w-[22rem] lg:justify-end">
                  {a.status === "nuevo" && (
                    <Btn size="sm" aria-label={`Marcar contactado a ${a.childName}`} onClick={() => contacted(a)}>
                      Marcar contactado
                    </Btn>
                  )}
                  {(a.status === "nuevo" || a.status === "contactado" || a.status === "prueba") && (
                    <Btn size="sm" variant={a.status === "prueba" ? "ghost" : "secondary"} aria-label={`${a.status === "prueba" ? "Reagendar" : "Agendar"} clase de prueba de ${a.childName}`} onClick={() => setAction({ kind: "prueba", id: a.id })}>
                      {a.status === "prueba" ? "Reagendar prueba" : "Clase de prueba"}
                    </Btn>
                  )}
                  {OPEN.includes(a.status) && (
                    <Btn size="sm" variant="primary" aria-label={`Inscribir a ${a.childName}`} onClick={() => setAction({ kind: "inscribir", id: a.id })}>
                      Inscribir
                    </Btn>
                  )}
                  {OPEN.includes(a.status) && (
                    <Btn size="sm" variant="ghost" aria-label={`Descartar a ${a.childName}`} onClick={() => setAction({ kind: "descartar", id: a.id })}>
                      Descartar
                    </Btn>
                  )}
                  {a.status === "descartado" && (
                    <Btn size="sm" variant="ghost" aria-label={`Reabrir a ${a.childName}`} onClick={() => reopen(a)}>
                      Reabrir
                    </Btn>
                  )}
                  {a.status === "inscrito" && a.studentId && (
                    <Btn size="sm" aria-label={`Ver ficha de estudiante de ${a.childName}`} onClick={() => onOpenStudent(a.studentId!)}>
                      Ver estudiante
                    </Btn>
                  )}
                  <Btn size="sm" variant="ghost" aria-label={`Seguimiento de ${a.childName}`} onClick={() => setAction({ kind: "seguimiento", id: a.id })}>
                    Seguimiento ({a.log.filter((l) => l.kind === "nota").length})
                  </Btn>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[13px] text-text-subtle">
        {visible.length} de {applicants.length} aspirantes.
      </p>

      {current && action?.kind === "prueba" && <TrialDialog key={current.id} academy={academy} applicant={current} onClose={close} notify={notify} />}
      {current && action?.kind === "descartar" && <DiscardDialog key={current.id} academy={academy} applicant={current} onClose={close} notify={notify} />}
      {current && action?.kind === "inscribir" && (
        <EnrollDialog key={current.id} academy={academy} applicant={current} onClose={close} notify={notify} goToGroups={() => goTo("grupos")} />
      )}
      {current && action?.kind === "seguimiento" && <FollowUpDialog key={current.id} academy={academy} applicant={current} onClose={close} notify={notify} />}
    </div>
  );
}

type DialogProps = ScreenProps & { applicant: Applicant; onClose: () => void };

/** Próxima clase del grupo a partir de hoy (o null si no hay grupo). */
function nextClass(group: Group | undefined) {
  if (!group) return null;
  const today = todayStart();
  const dates = sessionDates(group, today + DAY_MS, today + 7 * DAY_MS);
  return dates.at(-1) ?? null;
}

function TrialDialog({ academy, applicant, onClose, notify }: DialogProps) {
  const group = academy.groups.find((g) => g.id === applicant.groupId) ?? groupsForAge(academy.groups, applicant.age)[0];
  const suggested = applicant.trialAt ?? nextClass(group) ?? todayStart() + DAY_MS;
  const [date, setDate] = useState(toDateInput(suggested));
  const [time, setTime] = useState(applicant.trialAt ? new Date(applicant.trialAt).toTimeString().slice(0, 5) : (group?.time ?? "16:00"));
  const [error, setError] = useState("");

  function submit() {
    if (!date || !/^\d{2}:\d{2}$/.test(time)) return setError("Indica la fecha y la hora de la clase de prueba.");
    const [h, m] = time.split(":").map(Number);
    const at = new Date(fromDateInput(date)).setHours(h, m, 0, 0);
    if (at < nowMs()) return setError("La clase de prueba no puede quedar en el pasado.");
    const verb = applicant.status === "prueba" ? "reagendada" : "agendada";
    academy.setApplicantStatus(applicant.id, "prueba", { trialAt: at }, `Clase de prueba ${verb} para el ${formatDateLong(at)}, ${formatTime(at)}`);
    notify(`Clase de prueba de ${applicant.childName} ${verb}`);
    onClose();
  }

  return (
    <Dialog open onClose={onClose} title={`Clase de prueba de ${applicant.childName}`} onSubmit={submit} submitLabel="Agendar">
      <p className="mb-4 text-sm text-text-muted">
        {group ? `Sugerimos la próxima clase de ${group.name} (${scheduleLabel(group)}).` : "Elige la fecha y la hora en que vendrá a conocer la academia."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fecha de la clase de prueba">
          {(id) => <input id={id} type="date" value={date} min={toDateInput(nowMs())} onChange={(e) => setDate(e.target.value)} className={inputClass} />}
        </Field>
        <Field label="Hora">{(id) => <input id={id} type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />}</Field>
      </div>
      <div className="mt-4">
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}

function DiscardDialog({ academy, applicant, onClose, notify }: DialogProps) {
  const [reason, setReason] = useState(DISCARD_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const text = reason === "Otro" ? detail.trim() : detail.trim() ? `${reason} (${detail.trim()})` : reason;
    if (reason === "Otro" && text.length < 3) return setError("Escribe el motivo.");
    academy.setApplicantStatus(applicant.id, "descartado", { discardReason: text }, `Descartado: ${text}`);
    notify(`${applicant.childName}: descartado`);
    onClose();
  }

  return (
    <Dialog open onClose={onClose} title={`Descartar a ${applicant.childName}`} onSubmit={submit} submitLabel="Descartar">
      <div className="grid gap-4">
        <Field label="Motivo">
          {(id) => (
            <select id={id} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass}>
              {DISCARD_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label={reason === "Otro" ? "¿Cuál?" : "Detalle (opcional)"}>
          {(id) => <input id={id} value={detail} onChange={(e) => setDetail(e.target.value)} className={inputClass} />}
        </Field>
        <p className="text-[13px] text-text-subtle">Podrás reabrirlo después si el acudiente vuelve a escribir.</p>
      </div>
      <div className="mt-4">
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}

function EnrollDialog({ academy, applicant, onClose, notify, goToGroups }: DialogProps & { goToGroups: () => void }) {
  const { groups, students } = academy;
  const free = (g: Group) => g.capacity - activeIn(students, g.id).length;
  const forAge = groupsForAge(groups, applicant.age);
  const interest = groups.find((g) => g.id === applicant.groupId);
  const suggested = (interest && free(interest) > 0 ? interest : forAge.find((g) => free(g) > 0)) ?? interest ?? forAge[0] ?? groups[0];
  const [groupId, setGroupId] = useState(suggested?.id ?? "");
  const [joined, setJoined] = useState(toDateInput(nowMs()));
  const [error, setError] = useState("");
  const fullForAge = forAge.length > 0 && forAge.every((g) => free(g) <= 0);

  function submit() {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return setError("Elige un grupo.");
    if (free(group) <= 0) return setError(`"${group.name}" está lleno (${group.capacity} de ${group.capacity}). Elige otro grupo o amplía su cupo.`);
    if (!joined) return setError("Indica la fecha de ingreso.");
    if (fromDateInput(joined) > todayStart()) return setError("La fecha de ingreso no puede ser futura.");
    if (students.some((s) => sameName(s.name, applicant.childName))) return setError(`Ya hay un estudiante llamado ${applicant.childName}.`);
    academy.enroll(
      applicant.id,
      {
        id: uid("e"),
        name: applicant.childName,
        age: applicant.age,
        guardian: applicant.guardian,
        guardianPhone: applicant.phone,
        guardianEmail: applicant.email || undefined,
        groupId: group.id,
        joinedAt: fromDateInput(joined),
        status: "activo",
        moduleIndex: 0,
      },
      group.name,
    );
    notify(`${applicant.childName} quedó inscrito en ${group.name}`);
    onClose();
  }

  if (groups.length === 0)
    return (
      <Dialog open onClose={onClose} title={`Inscribir a ${applicant.childName}`}>
        <p className="text-sm text-text">Para inscribir necesitas al menos un grupo.</p>
        <div className="mt-5 flex justify-end">
          <Btn variant="primary" onClick={goToGroups}>
            Ir a Grupos
          </Btn>
        </div>
      </Dialog>
    );

  return (
    <Dialog open onClose={onClose} title={`Inscribir a ${applicant.childName}`} onSubmit={submit} submitLabel="Inscribir">
      <div className="space-y-4 text-sm">
        <p className="text-text-muted">
          Se crea el estudiante con los datos del formulario: {applicant.age} años, acudiente {applicant.guardian} ({formatPhone(applicant.phone)}).
        </p>
        {(fullForAge || forAge.length === 0) && (
          <p role="note" className="rounded-md border border-warning bg-warning-muted px-3 py-2 text-warning">
            {forAge.length === 0
              ? `Ningún grupo está pensado para ${applicant.age} años. Puedes inscribirlo en otro grupo con cupo o crear uno nuevo.`
              : `Todos los grupos para ${applicant.age} años están llenos. Amplía el cupo en Grupos o elige otro grupo con cupo.`}
          </p>
        )}
        <Field label="Grupo">
          {(id) => (
            <select id={id} value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputClass}>
              {groups.map((g) => {
                const left = free(g);
                return (
                  <option key={g.id} value={g.id}>
                    {`${g.name} · ${g.minAge}-${g.maxAge} años · ${left > 0 ? `${left} ${left === 1 ? "cupo" : "cupos"}` : "lleno"}`}
                  </option>
                );
              })}
            </select>
          )}
        </Field>
        <Field label="Fecha de ingreso">
          {(id) => <input id={id} type="date" value={joined} max={toDateInput(nowMs())} onChange={(e) => setJoined(e.target.value)} className={inputClass} />}
        </Field>
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}

function FollowUpDialog({ academy, applicant, onClose, notify }: DialogProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const group = academy.groups.find((g) => g.id === applicant.groupId);
  const log = [...applicant.log].sort((a, b) => b.at - a.at);
  const info = statusInfo(applicant.status);

  function add() {
    if (text.trim().length < 3) return setError("Escribe la nota antes de guardarla.");
    academy.addFollowUp(applicant.id, text.trim());
    setText("");
    setError("");
    notify("Nota de seguimiento agregada");
  }

  return (
    <Dialog open onClose={onClose} title={`Seguimiento de ${applicant.childName}`} wide>
      <div className="space-y-5 text-sm">
        <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          <Info label="Estado" value={<Pill tone={info.tone}>{info.label}</Pill>} />
          <Info label="Edad" value={`${applicant.age} años`} />
          <Info label="Acudiente" value={applicant.guardian} />
          <Info label="Teléfono" value={formatPhone(applicant.phone)} />
          <Info label="Correo" value={applicant.email || "—"} />
          <Info label="Grupo de interés" value={group?.name ?? "Pide recomendación"} />
          <Info label="Cómo nos conoció" value={applicant.source} />
          <Info label="Recibido" value={formatDateTime(applicant.createdAt)} />
        </dl>
        {applicant.message && (
          <blockquote className="rounded-md border-l-2 border-brand bg-surface px-3 py-2 text-text">
            <span className="block text-[12px] text-text-subtle">Mensaje del acudiente</span>
            {applicant.message}
          </blockquote>
        )}

        <form
          aria-label="Nueva nota de seguimiento"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="space-y-2"
        >
          <Field label="Nota de seguimiento">
            {(id) => <textarea id={id} rows={2} value={text} onChange={(e) => setText(e.target.value)} className={inputClass} placeholder="Qué se habló, qué quedó pendiente" />}
          </Field>
          <FormError>{error}</FormError>
          <div className="flex justify-end">
            <Btn type="submit" variant="primary">
              Agregar nota
            </Btn>
          </div>
        </form>

        <section aria-label="Historial de seguimiento">
          <h3 className="mb-2 font-semibold text-text">Historial</h3>
          <ol className="space-y-2">
            {log.map((l) => (
              <li key={l.id} className={`rounded-md border px-3 py-2 ${l.kind === "estado" ? "border-dashed border-border text-text-muted" : "border-border text-text"}`}>
                <p className="text-[12px] text-text-subtle">
                  {formatDateTime(l.at)} · {l.kind === "estado" ? "Cambio de estado" : "Nota"}
                </p>
                <p>{l.text}</p>
              </li>
            ))}
            <li className="rounded-md border border-dashed border-border px-3 py-2 text-text-muted">
              <p className="text-[12px] text-text-subtle">{formatDateTime(applicant.createdAt)} · Formulario</p>
              <p>Inscripción recibida desde el formulario público</p>
            </li>
          </ol>
        </section>

        <div className="flex justify-end border-t border-border pt-3">
          <ConfirmButton
            label="Eliminar aspirante"
            ariaLabel={`Eliminar aspirante ${applicant.childName}`}
            title="Eliminar aspirante"
            message={`¿Eliminar la inscripción de ${applicant.childName} y su seguimiento?${applicant.studentId ? " El estudiante ya creado no se borra." : ""}`}
            onConfirm={() => {
              academy.deleteApplicant(applicant.id);
              notify("Aspirante eliminado");
              onClose();
            }}
          />
        </div>
      </div>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-1.5">
      <dt className="text-text-muted">{label}</dt>
      <dd className="min-w-0 text-right break-words text-text">{value}</dd>
    </div>
  );
}

export type { Academy };
