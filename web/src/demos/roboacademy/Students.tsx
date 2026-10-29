import { useState } from "react";
import { DAY_MS, fromDateInput, matches, toDateInput } from "@/demos/kit/format";
import { uid } from "@/demos/kit/storage";
import { Btn, ConfirmButton, Dialog, Empty, Field, FormError, Pill, SearchField, Table, inputClass } from "@/demos/kit/ui";
import { RISK_WINDOW_DAYS, activeIn, digitsOnly, formatPhone, summarize, type Student, type StudentStatus, todayStart, nowMs, formatDateYear } from "./data";
import { GroupSelect, RatePill } from "./shared";
import { StudentProfile } from "./StudentProfile";
import type { Academy, ScreenProps } from "./store";

export function Students({ academy, notify }: ScreenProps) {
  const { groups, students, sessions } = academy;
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState("");
  const [status, setStatus] = useState<"" | StudentStatus>("activo");
  const [editing, setEditing] = useState<Student | "nuevo" | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const since = todayStart() - RISK_WINDOW_DAYS * DAY_MS;
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? "Sin grupo";
  const visible = students
    .filter((s) => (!groupId || s.groupId === groupId) && (!status || s.status === status))
    .filter((s) => !query || matches(`${s.name} ${s.guardian} ${s.guardianPhone}`, query))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <SearchField value={query} onChange={setQuery} label="Buscar estudiante" placeholder="Nombre, acudiente o teléfono" />
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Field label="Grupo">{(id) => <GroupSelect id={id} groups={groups} value={groupId} onChange={setGroupId} allLabel="Todos los grupos" />}</Field>
          <Field label="Estado">
            {(id) => (
              <select id={id} value={status} onChange={(e) => setStatus(e.target.value as "" | StudentStatus)} className={inputClass}>
                <option value="activo">Activos</option>
                <option value="retirado">Retirados</option>
                <option value="">Todos</option>
              </select>
            )}
          </Field>
        </div>
        <Btn variant="primary" className="sm:ml-auto" onClick={() => setEditing("nuevo")} disabled={groups.length === 0}>
          Nuevo estudiante
        </Btn>
      </div>

      {visible.length === 0 ? (
        <Empty>{students.length === 0 ? "Aún no hay estudiantes." : "Ningún estudiante coincide con la búsqueda o los filtros."}</Empty>
      ) : (
        <Table label="Estudiantes" head={["Estudiante", "Grupo", "Acudiente", "Ingreso", "Asistencia", "Estado", "Acciones"]} minWidth="58rem">
          {visible.map((s) => (
            <tr key={s.id}>
              <th scope="row" className="font-normal">
                <button type="button" onClick={() => setProfileId(s.id)} className="text-left font-semibold text-text hover:text-brand-soft hover:underline">
                  {s.name}
                </button>
                <p className="text-[12px] text-text-subtle">{s.age} años</p>
              </th>
              <td className="text-text-muted">{groupName(s.groupId)}</td>
              <td>
                <p className="text-text">{s.guardian}</p>
                <p className="text-[12px] text-text-subtle tabular-nums">{formatPhone(s.guardianPhone)}</p>
              </td>
              <td className="whitespace-nowrap text-text-muted tabular-nums">{formatDateYear(s.joinedAt)}</td>
              <td>
                <RatePill rate={summarize(sessions, s.id, since).rate} />
              </td>
              <td>{s.status === "activo" ? <Pill tone="success">Activo</Pill> : <Pill>Retirado</Pill>}</td>
              <td>
                <div className="flex gap-1 whitespace-nowrap">
                  <Btn size="sm" variant="ghost" aria-label={`Ver ficha de ${s.name}`} onClick={() => setProfileId(s.id)}>
                    Ficha
                  </Btn>
                  <Btn size="sm" variant="ghost" aria-label={`Editar "${s.name}"`} onClick={() => setEditing(s)}>
                    Editar
                  </Btn>
                  <ConfirmButton
                    label="Eliminar"
                    ariaLabel={`Eliminar "${s.name}"`}
                    title="Eliminar estudiante"
                    message={`¿Eliminar a ${s.name} con su asistencia, pagos y notas? Si solo dejó la academia, mejor márcalo como retirado.`}
                    onConfirm={() => {
                      academy.deleteStudent(s.id);
                      notify("Estudiante eliminado");
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <p className="text-[13px] text-text-subtle">
        {visible.length} de {students.length} estudiantes. La asistencia es de las últimas 8 semanas; las excusas no cuentan en contra.
      </p>

      {editing && (
        <StudentForm
          key={editing === "nuevo" ? "nuevo" : editing.id}
          academy={academy}
          initial={editing === "nuevo" ? null : editing}
          defaultGroup={groupId || groups[0]?.id || ""}
          onClose={() => setEditing(null)}
          onSave={(student, isNew) => {
            academy.saveStudent(student);
            notify(isNew ? "Estudiante creado" : "Estudiante guardado");
            setEditing(null);
          }}
        />
      )}
      <StudentProfile academy={academy} studentId={profileId} onClose={() => setProfileId(null)} />
    </div>
  );
}

function StudentForm({
  academy,
  initial,
  defaultGroup,
  onClose,
  onSave,
}: {
  academy: Academy;
  initial: Student | null;
  defaultGroup: string;
  onClose: () => void;
  onSave: (student: Student, isNew: boolean) => void;
}) {
  const { groups, students } = academy;
  const [name, setName] = useState(initial?.name ?? "");
  const [age, setAge] = useState(initial ? String(initial.age) : "");
  const [guardian, setGuardian] = useState(initial?.guardian ?? "");
  const [phone, setPhone] = useState(initial?.guardianPhone ?? "");
  const [groupId, setGroupId] = useState(initial?.groupId ?? defaultGroup);
  const [joined, setJoined] = useState(toDateInput(initial?.joinedAt ?? nowMs()));
  const [status, setStatus] = useState<StudentStatus>(initial?.status ?? "activo");
  const [error, setError] = useState("");

  // Ocupación sin contar a este mismo estudiante.
  const occupied = (gid: string) => activeIn(students, gid).filter((s) => s.id !== initial?.id).length;
  const changedGroup = initial && initial.groupId !== groupId;

  function submit() {
    const ageNum = Number(age);
    const digits = digitsOnly(phone);
    const group = groups.find((g) => g.id === groupId);
    if (name.trim().length < 3) return setError("Escribe el nombre completo del estudiante.");
    if (!Number.isInteger(ageNum) || ageNum < 4 || ageNum > 18) return setError("La edad debe estar entre 4 y 18 años.");
    if (guardian.trim().length < 3) return setError("Escribe el nombre del acudiente.");
    if (digits.length < 7 || digits.length > 10) return setError("El teléfono del acudiente debe tener entre 7 y 10 dígitos.");
    if (!group) return setError("Elige un grupo.");
    if (!joined) return setError("Indica la fecha de ingreso.");
    const joinedAt = fromDateInput(joined);
    if (joinedAt > todayStart()) return setError("La fecha de ingreso no puede ser futura.");
    if (status === "activo" && occupied(group.id) >= group.capacity) {
      return setError(`"${group.name}" está lleno (${group.capacity} de ${group.capacity}). Elige otro grupo o amplía su cupo.`);
    }
    onSave(
      {
        id: initial?.id ?? uid("e"),
        name: name.trim(),
        age: ageNum,
        guardian: guardian.trim(),
        guardianPhone: digits,
        groupId,
        joinedAt,
        status,
        moduleIndex: initial && !changedGroup ? initial.moduleIndex : 0,
      },
      !initial,
    );
  }

  return (
    <Dialog open onClose={onClose} title={initial ? "Editar estudiante" : "Nuevo estudiante"} onSubmit={submit} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del estudiante" className="sm:col-span-2">
          {(id) => <input id={id} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />}
        </Field>
        <Field label="Edad">{(id) => <input id={id} type="number" min={4} max={18} value={age} onChange={(e) => setAge(e.target.value)} className={inputClass} />}</Field>
        <Field label="Fecha de ingreso">
          {(id) => <input id={id} type="date" value={joined} max={toDateInput(nowMs())} onChange={(e) => setJoined(e.target.value)} className={inputClass} />}
        </Field>
        <Field label="Acudiente">{(id) => <input id={id} value={guardian} onChange={(e) => setGuardian(e.target.value)} className={inputClass} />}</Field>
        <Field label="Teléfono del acudiente">
          {(id) => <input id={id} type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="3001234567" className={inputClass} />}
        </Field>
        <Field label="Grupo" hint={changedGroup ? "Al cambiar de grupo, el progreso empieza en el primer módulo." : undefined}>
          {(id) => (
            <select id={id} value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputClass}>
              {groups.map((g) => {
                const used = occupied(g.id);
                return (
                  <option key={g.id} value={g.id}>
                    {`${g.name} (${used}/${g.capacity}${used >= g.capacity ? ", lleno" : ""})`}
                  </option>
                );
              })}
            </select>
          )}
        </Field>
        <Field label="Estado">
          {(id) => (
            <select id={id} value={status} onChange={(e) => setStatus(e.target.value as StudentStatus)} className={inputClass}>
              <option value="activo">Activo</option>
              <option value="retirado">Retirado</option>
            </select>
          )}
        </Field>
      </div>
      <div className="mt-4">
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}
