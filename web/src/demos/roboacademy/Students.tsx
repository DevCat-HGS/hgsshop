import { useCallback, useMemo, useRef, useState } from "react";
import { ImportDialog, type ImportField, type RowResult } from "@/demos/kit/ImportDialog";
import { parseNumber } from "@/demos/kit/csvImport";
import { DAY_MS, formatDate, fromDateInput, matches, toDateInput } from "@/demos/kit/format";
import { downloadCsv } from "@/demos/kit/csv";
import { uid } from "@/demos/kit/storage";
import { Btn, ConfirmButton, Dialog, Empty, Field, FormError, Pill, SearchField, Table, inputClass } from "@/demos/kit/ui";
import { RISK_WINDOW_DAYS, activeIn, digitsOnly, formatPhone, parseDateText, sameName, summarize, type Student, type StudentStatus, todayStart, nowMs, formatDateYear } from "./data";
import { EmptyState, GroupSelect, RatePill } from "./shared";
import { StudentProfile } from "./StudentProfile";
import type { Academy, ScreenProps } from "./store";

export function Students({ academy, notify, goToGroups, initialProfileId = null }: ScreenProps & { goToGroups: () => void; initialProfileId?: string | null }) {
  const { groups, students, sessions } = academy;
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState("");
  const [status, setStatus] = useState<"" | StudentStatus>("activo");
  const [editing, setEditing] = useState<Student | "nuevo" | null>(null);
  const [profileId, setProfileId] = useState<string | null>(initialProfileId);
  const [importing, setImporting] = useState(false);

  const since = todayStart() - RISK_WINDOW_DAYS * DAY_MS;
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? "Sin grupo";
  const visible = students
    .filter((s) => (!groupId || s.groupId === groupId) && (!status || s.status === status))
    .filter((s) => !query || matches(`${s.name} ${s.guardian} ${s.guardianPhone}`, query))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  function exportCsv() {
    downloadCsv(
      "roboacademy-estudiantes",
      ["Estudiante", "Edad", "Grupo", "Acudiente", "Teléfono del acudiente", "Módulo actual", "Asistencia 8 semanas (%)", "Ingreso", "Estado"],
      visible.map((s) => {
        const group = groups.find((g) => g.id === s.groupId);
        const module = !group ? "" : s.moduleIndex >= group.modules.length ? "Ruta completada" : `${s.moduleIndex + 1}. ${group.modules[s.moduleIndex].name}`;
        return [
          s.name,
          s.age,
          groupName(s.groupId),
          s.guardian,
          formatPhone(s.guardianPhone),
          module,
          summarize(sessions, s.id, since).rate ?? "Sin registro",
          formatDate(s.joinedAt),
          s.status === "activo" ? "Activo" : "Retirado",
        ];
      }),
    );
  }

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
        <Btn size="sm" className="sm:ml-auto sm:mb-1" aria-label="Exportar estudiantes a CSV" onClick={exportCsv} disabled={visible.length === 0}>
          Exportar CSV
        </Btn>
        <div className="flex gap-2">
          <Btn onClick={() => setImporting(true)} disabled={groups.length === 0}>
            Importar
          </Btn>
          <Btn variant="primary" className="flex-1 sm:flex-none" onClick={() => setEditing("nuevo")} disabled={groups.length === 0}>
            Nuevo estudiante
          </Btn>
        </div>
      </div>

      {students.length === 0 ? (
        <EmptyState
          title="Aún no hay estudiantes"
          actions={
            groups.length === 0 ? (
              <Btn variant="primary" onClick={goToGroups}>
                Crear un grupo primero
              </Btn>
            ) : (
              <>
                <Btn variant="primary" onClick={() => setEditing("nuevo")}>
                  Nuevo estudiante
                </Btn>
                <Btn onClick={() => setImporting(true)}>Importar desde Excel o CSV</Btn>
              </>
            )
          }
        >
          {groups.length === 0
            ? "Cada estudiante pertenece a un grupo. Crea tu primer grupo y vuelve aquí."
            : "Registra a tus estudiantes uno por uno o trae la lista completa desde Excel: nombre, edad, acudiente, teléfono, grupo y fecha de ingreso."}
        </EmptyState>
      ) : visible.length === 0 ? (
        <Empty>Ningún estudiante coincide con la búsqueda o los filtros.</Empty>
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
      <StudentImport
        academy={academy}
        open={importing}
        onClose={() => setImporting(false)}
        onDone={(n) => notify(`${n} ${n === 1 ? "estudiante importado" : "estudiantes importados"}`)}
      />
    </div>
  );
}

const IMPORT_FIELDS: ImportField<Record<string, string>>[] = [
  { key: "name", label: "Nombre del estudiante", required: true, aliases: ["nombre", "estudiante", "alumno", "nombre completo"], example: "Ximena Lozano" },
  { key: "age", label: "Edad", required: true, aliases: ["años", "edad del estudiante"], example: "10" },
  { key: "guardian", label: "Acudiente", required: true, aliases: ["nombre del acudiente", "padre", "madre", "responsable"], example: "Rosa Lozano" },
  { key: "phone", label: "Teléfono del acudiente", required: true, aliases: ["teléfono", "telefono", "celular", "whatsapp", "móvil"], example: "300 111 2233" },
  { key: "group", label: "Grupo", required: true, aliases: ["curso", "nombre del grupo", "clase"], example: "Club de inventores" },
  { key: "joined", label: "Fecha de ingreso", aliases: ["ingreso", "fecha", "fecha de inscripción", "inscripción"], example: "2025-02-03" },
];

/** Importar estudiantes desde Excel o CSV, con las mismas reglas del formulario (cupo y duplicados incluidos). */
function StudentImport({ academy, open, onClose, onDone }: { academy: Academy; open: boolean; onClose: () => void; onDone: (count: number) => void }) {
  const { groups, students } = academy;
  const fields = useMemo(() => IMPORT_FIELDS, []);
  // Lo que ya aceptaron las filas anteriores del mismo archivo: nombres y cupos ocupados. La revisión recorre
  // las filas en orden empezando por la 1, así que se reinicia ahí.
  const pass = useRef({ names: [] as string[], used: new Map<string, number>() });

  const validate = useCallback(
    (values: Record<string, string>, index: number): RowResult<Student> => {
      if (index === 1) pass.current = { names: [], used: new Map() };
      const name = values.name.trim();
      const age = parseNumber(values.age);
      const guardian = values.guardian.trim();
      const digits = digitsOnly(values.phone);
      if (name.length < 3) return { ok: false, error: "el nombre del estudiante es muy corto" };
      if (age === null || !Number.isInteger(age) || age < 4 || age > 18) return { ok: false, error: `edad "${values.age}" no válida (entre 4 y 18)` };
      if (guardian.length < 3) return { ok: false, error: "falta el nombre del acudiente" };
      if (digits.length < 7 || digits.length > 10) return { ok: false, error: "el teléfono debe tener entre 7 y 10 dígitos" };
      const group = groups.find((g) => sameName(g.name, values.group));
      if (!group) return { ok: false, error: `no existe el grupo "${values.group}"` };
      let joinedAt = todayStart();
      if (values.joined.trim()) {
        const parsed = parseDateText(values.joined);
        if (parsed === null) return { ok: false, error: `fecha de ingreso "${values.joined}" no válida (usa AAAA-MM-DD o DD/MM/AAAA)` };
        if (parsed > todayStart()) return { ok: false, error: "la fecha de ingreso no puede ser futura" };
        joinedAt = parsed;
      }
      if (students.some((s) => sameName(s.name, name))) return { ok: false, error: `${name} ya está registrado` };
      if (pass.current.names.some((n) => sameName(n, name))) return { ok: false, error: `${name} está repetido en el archivo` };
      const used = activeIn(students, group.id).length + (pass.current.used.get(group.id) ?? 0);
      if (used >= group.capacity) return { ok: false, error: `"${group.name}" está lleno (${group.capacity} de ${group.capacity})` };
      pass.current.names.push(name);
      pass.current.used.set(group.id, (pass.current.used.get(group.id) ?? 0) + 1);
      return {
        ok: true,
        record: { id: uid("e"), name, age, guardian, guardianPhone: digits, groupId: group.id, joinedAt, status: "activo", moduleIndex: 0 },
      };
    },
    [groups, students],
  );

  return (
    <ImportDialog
      open={open}
      onClose={onClose}
      title="Importar estudiantes"
      entityPlural="estudiantes"
      templateName="plantilla-estudiantes-roboacademy"
      fields={fields}
      validate={validate}
      onImport={(records) => {
        academy.addStudents(records);
        onDone(records.length);
      }}
    />
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
  const [email, setEmail] = useState(initial?.guardianEmail ?? "");
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
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError("El correo del acudiente no es válido.");
    if (students.some((s) => s.id !== initial?.id && sameName(s.name, name))) return setError(`Ya hay un estudiante llamado ${name.trim()}.`);
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
        guardianEmail: email.trim() || undefined,
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
        <Field label="Correo del acudiente (opcional)" className="sm:col-span-2">
          {(id) => <input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="acudiente@correo.com" className={inputClass} />}
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
