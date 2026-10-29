import { useState } from "react";
import { formatMoney } from "@/demos/kit/format";
import { uid } from "@/demos/kit/storage";
import { Btn, ConfirmButton, Dialog, Field, FormError, inputClass } from "@/demos/kit/ui";
import { WEEKDAYS, activeIn, scheduleLabel, type Group, type Module } from "./data";
import { CapacityBar, EmptyState } from "./shared";
import type { ScreenProps } from "./store";

interface Draft {
  id: string | null;
  name: string;
  day: number;
  time: string;
  teacher: string;
  capacity: string;
  fee: string;
  minAge: string;
  maxAge: string;
  modules: Module[];
}

const emptyDraft = (): Draft => ({ id: null, name: "", day: 6, time: "09:00", teacher: "", capacity: "8", fee: "180000", minAge: "7", maxAge: "12", modules: [] });

const draftOf = (g: Group): Draft => ({ ...g, capacity: String(g.capacity), fee: String(g.fee), minAge: String(g.minAge), maxAge: String(g.maxAge), modules: g.modules.map((m) => ({ ...m })) });

export function Groups({ academy, notify, initialEditId = null }: ScreenProps & { initialEditId?: string | null }) {
  const { groups, students } = academy;
  const [draft, setDraft] = useState<Draft | null>(() => {
    const g = groups.find((x) => x.id === initialEditId);
    return g ? draftOf(g) : null;
  });
  const [blocked, setBlocked] = useState<Group | null>(null);
  const open = draft;
  const close = () => setDraft(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          {groups.length} grupos · {students.filter((s) => s.status === "activo").length} estudiantes activos
        </p>
        <Btn variant="primary" onClick={() => setDraft(emptyDraft())}>
          Nuevo grupo
        </Btn>
      </div>
      {groups.length === 0 ? (
        <EmptyState
          title="Aún no hay grupos"
          actions={
            <Btn variant="primary" onClick={() => setDraft(emptyDraft())}>
              Crear el primer grupo
            </Btn>
          }
        >
          Un grupo tiene su horario, profesor, cupo, mensualidad, rango de edad y los módulos de su ruta. Los estudiantes se inscriben en un grupo.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => {
            const enrolled = activeIn(students, g.id).length;
            const total = students.filter((s) => s.groupId === g.id).length;
            return (
              <li key={g.id} className="flex flex-col rounded-lg border border-border bg-bg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text">{g.name}</h3>
                    <p className="text-[13px] text-text-muted">
                      {scheduleLabel(g)} · {g.teacher}
                    </p>
                    <p className="text-[13px] text-text-subtle">
                      De {g.minAge} a {g.maxAge} años
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-text tabular-nums">{formatMoney(g.fee)}</p>
                </div>
                <div className="mt-3">
                  <CapacityBar used={enrolled} capacity={g.capacity} />
                </div>
                <ol className="mt-3 flex-1 space-y-1 text-[13px] text-text-muted" aria-label={`Módulos de ${g.name}`}>
                  {g.modules.map((m, i) => (
                    <li key={m.id} className="flex gap-2">
                      <span className="w-4 shrink-0 text-right text-text-subtle tabular-nums">{i + 1}.</span>
                      <span className="min-w-0">{m.name}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex justify-end gap-1 border-t border-border pt-3">
                  <Btn
                    size="sm"
                    variant="ghost"
                    aria-label={`Editar "${g.name}"`}
                    onClick={() => setDraft(draftOf(g))}
                  >
                    Editar
                  </Btn>
                  {total > 0 ? (
                    <Btn size="sm" variant="ghost" aria-label={`Eliminar "${g.name}"`} onClick={() => setBlocked(g)}>
                      Eliminar
                    </Btn>
                  ) : (
                    <ConfirmButton
                      label="Eliminar"
                      ariaLabel={`Eliminar "${g.name}"`}
                      title="Eliminar grupo"
                      message={`¿Eliminar "${g.name}" y su historial de asistencia? Esta acción no se puede deshacer.`}
                      onConfirm={() => {
                        academy.deleteGroup(g.id);
                        notify("Grupo eliminado");
                      }}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <GroupForm
          key={open.id ?? "nuevo"}
          initial={open}
          enrolled={open.id ? activeIn(students, open.id).length : 0}
          onClose={close}
          onSave={(group, isNew) => {
            academy.saveGroup(group);
            notify(isNew ? "Grupo creado" : "Grupo guardado");
            close();
          }}
        />
      )}

      <Dialog open={Boolean(blocked)} onClose={() => setBlocked(null)} title="No se puede eliminar el grupo">
        {blocked && (
          <>
            <p className="text-sm text-text">
              "{blocked.name}" tiene {students.filter((s) => s.groupId === blocked.id).length} estudiantes (activos o retirados). Muévelos a otro grupo o elimínalos
              desde Estudiantes antes de borrar el grupo.
            </p>
            <div className="mt-5 flex justify-end">
              <Btn onClick={() => setBlocked(null)}>Entendido</Btn>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}

function GroupForm({ initial, enrolled, onClose, onSave }: { initial: Draft; enrolled: number; onClose: () => void; onSave: (group: Group, isNew: boolean) => void }) {
  const [d, setD] = useState<Draft>(initial);
  const [newModule, setNewModule] = useState("");
  const [error, setError] = useState("");
  const set = (change: Partial<Draft>) => setD((prev) => ({ ...prev, ...change }));

  function addModule() {
    const name = newModule.trim();
    if (!name) return;
    set({ modules: [...d.modules, { id: uid("m"), name }] });
    setNewModule("");
  }

  function move(index: number, delta: number) {
    const list = [...d.modules];
    const [item] = list.splice(index, 1);
    list.splice(index + delta, 0, item);
    set({ modules: list });
  }

  function submit() {
    const capacity = Number(d.capacity);
    const fee = Number(d.fee);
    if (d.name.trim().length < 3) return setError("Escribe un nombre de al menos 3 caracteres.");
    if (!d.teacher.trim()) return setError("Indica el profesor del grupo.");
    if (!/^\d{2}:\d{2}$/.test(d.time)) return setError("Indica la hora de la clase.");
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 30) return setError("El cupo debe ser un número entero entre 1 y 30.");
    if (capacity < enrolled) return setError(`El grupo ya tiene ${enrolled} estudiantes activos: el cupo no puede ser menor.`);
    if (!Number.isFinite(fee) || fee <= 0) return setError("La mensualidad debe ser mayor que cero.");
    const minAge = Number(d.minAge);
    const maxAge = Number(d.maxAge);
    if (!Number.isInteger(minAge) || !Number.isInteger(maxAge) || minAge < 4 || maxAge > 18 || minAge > maxAge)
      return setError("Las edades deben ser números enteros entre 4 y 18, y la mínima no puede superar a la máxima.");
    if (d.modules.length === 0) return setError("Agrega al menos un módulo.");
    if (d.modules.some((m) => !m.name.trim())) return setError("Todos los módulos necesitan un nombre.");
    onSave(
      {
        id: d.id ?? uid("g"),
        name: d.name.trim(),
        day: d.day,
        time: d.time,
        teacher: d.teacher.trim(),
        capacity,
        fee: Math.round(fee),
        minAge,
        maxAge,
        modules: d.modules.map((m) => ({ ...m, name: m.name.trim() })),
      },
      !d.id,
    );
  }

  return (
    <Dialog open onClose={onClose} title={d.id ? "Editar grupo" : "Nuevo grupo"} onSubmit={submit} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del grupo" className="sm:col-span-2">
          {(id) => <input id={id} value={d.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} placeholder="Robótica inicial" />}
        </Field>
        <Field label="Día">
          {(id) => (
            <select id={id} value={d.day} onChange={(e) => set({ day: Number(e.target.value) })} className={inputClass}>
              {WEEKDAYS.map((w, i) => (
                <option key={w} value={i}>
                  {w}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Hora">{(id) => <input id={id} type="time" value={d.time} onChange={(e) => set({ time: e.target.value })} className={inputClass} />}</Field>
        <Field label="Profesor" className="sm:col-span-2">
          {(id) => <input id={id} value={d.teacher} onChange={(e) => set({ teacher: e.target.value })} className={inputClass} />}
        </Field>
        <Field label="Cupo" hint={enrolled ? `${enrolled} estudiantes activos hoy` : undefined}>
          {(id) => <input id={id} type="number" min={1} max={30} value={d.capacity} onChange={(e) => set({ capacity: e.target.value })} className={inputClass} />}
        </Field>
        <Field label="Mensualidad (COP)" hint={Number(d.fee) > 0 ? formatMoney(Number(d.fee)) : undefined}>
          {(id) => <input id={id} type="number" min={0} step={1000} value={d.fee} onChange={(e) => set({ fee: e.target.value })} className={inputClass} />}
        </Field>
        <Field label="Edad mínima" hint="Orienta el formulario de inscripción">
          {(id) => <input id={id} type="number" min={4} max={18} value={d.minAge} onChange={(e) => set({ minAge: e.target.value })} className={inputClass} />}
        </Field>
        <Field label="Edad máxima">
          {(id) => <input id={id} type="number" min={4} max={18} value={d.maxAge} onChange={(e) => set({ maxAge: e.target.value })} className={inputClass} />}
        </Field>
      </div>

      <fieldset className="mt-5">
        <legend className="text-[13px] font-semibold text-text-muted">Módulos, en orden</legend>
        {d.modules.length === 0 ? (
          <p className="mt-2 text-sm text-text-subtle">Todavía no hay módulos.</p>
        ) : (
          <ol className="mt-2 space-y-2">
            {d.modules.map((m, i) => (
              <li key={m.id} className="flex items-center gap-1.5">
                <span className="w-5 shrink-0 text-right text-sm text-text-subtle tabular-nums">{i + 1}.</span>
                <input
                  aria-label={`Nombre del módulo ${i + 1}`}
                  value={m.name}
                  onChange={(e) => set({ modules: d.modules.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)) })}
                  className={`${inputClass} min-w-0 flex-1`}
                />
                <Btn size="sm" variant="ghost" aria-label={`Subir "${m.name}"`} disabled={i === 0} onClick={() => move(i, -1)}>
                  ↑
                </Btn>
                <Btn size="sm" variant="ghost" aria-label={`Bajar "${m.name}"`} disabled={i === d.modules.length - 1} onClick={() => move(i, 1)}>
                  ↓
                </Btn>
                <Btn size="sm" variant="ghost" aria-label={`Quitar "${m.name}"`} onClick={() => set({ modules: d.modules.filter((x) => x.id !== m.id) })}>
                  Quitar
                </Btn>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-3 flex gap-2">
          <input
            aria-label="Nuevo módulo"
            value={newModule}
            onChange={(e) => setNewModule(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addModule();
              }
            }}
            placeholder="Nombre del módulo"
            className={`${inputClass} min-w-0 flex-1`}
          />
          <Btn onClick={addModule} disabled={!newModule.trim()}>
            Agregar módulo
          </Btn>
        </div>
      </fieldset>

      <div className="mt-4">
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}
