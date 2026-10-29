import { useState } from "react";
import { formatDate, formatTime } from "@/demos/kit/format";
import { uid } from "@/demos/kit/storage";
import { Btn, ConfirmButton, Dialog, Empty, Field, FormError, inputClass, Panel, Pill } from "@/demos/kit/ui";
import { minutesLabel, SLOT, validateSlot, WEEK_ORDER, WEEKDAYS, WEEKDAYS_SHORT, type DaySchedule, type Editor, type Professional, type Schedule } from "./data";
import type { ClientiaStore } from "./store";

/** Horas de 6:00 a 22:00 para apertura, cierre y descanso. */
const HOURS = Array.from({ length: 33 }, (_, i) => 6 * 60 + i * SLOT);

export function Availability({
  store,
  notify,
  onEdit,
  creatingPro,
  onCreatingProChange,
}: {
  store: ClientiaStore;
  notify: (msg: string) => void;
  onEdit: (editor: Editor) => void;
  creatingPro: boolean;
  onCreatingProChange: (open: boolean) => void;
}) {
  const { professionals, appointments, clients, now } = store;
  const [editingPro, setEditingPro] = useState<Professional | null>(null);

  // Citas próximas que quedaron fuera del horario o de los días de su profesional tras un cambio.
  const conflicts = appointments.filter((a) => a.status === "scheduled" && a.start > now && validateSlot(a, store, { allowPast: true }));

  function removePro(pro: Professional) {
    store.setProfessionals((list) => list.filter((p) => p.id !== pro.id));
    notify(`Profesional "${pro.name}" eliminada`);
  }

  const closePro = () => {
    setEditingPro(null);
    onCreatingProChange(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {conflicts.length > 0 && (
        <section aria-label="Citas fuera del horario" className="rounded-lg border border-warning/40 bg-warning-muted p-4">
          <h3 className="text-sm font-semibold text-warning">
            {conflicts.length === 1 ? "1 cita próxima quedó" : `${conflicts.length} citas próximas quedaron`} fuera del horario
          </h3>
          <p className="mt-1 text-[13px] text-text-muted">Reprográmalas o cancélalas para que no se pierdan.</p>
          <ul className="mt-2 flex flex-col gap-1">
            {conflicts.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => onEdit({ mode: "edit", id: a.id })} className="text-left text-sm text-text underline-offset-2 hover:underline">
                  {formatDate(a.start)}, {formatTime(a.start)} · {clients.find((c) => c.id === a.clientId)?.name ?? "Cliente"} · {a.serviceName}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ScheduleEditor key={JSON.stringify(store.schedule)} store={store} notify={notify} />

        <Panel
          title="Profesionales"
          actions={
            <Btn size="sm" onClick={() => onCreatingProChange(true)}>
              Nueva profesional
            </Btn>
          }
        >
          {professionals.length === 0 ? (
            <Empty>No hay profesionales. Agrega al menos una para recibir citas.</Empty>
          ) : (
            <ul className="-my-2 divide-y divide-border">
              {professionals.map((p) => {
                const upcoming = appointments.filter((a) => a.professionalId === p.id && a.status === "scheduled" && a.start > now).length;
                return (
                  <li key={p.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text">{p.name}</p>
                      <p className="text-[13px] text-text-muted">
                        {p.role || "Sin cargo"} · {upcoming} {upcoming === 1 ? "cita próxima" : "citas próximas"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1" aria-label={`Días que atiende ${p.name}`}>
                        {WEEK_ORDER.filter((d) => p.days.includes(d)).map((d) => (
                          <Pill key={d}>{WEEKDAYS_SHORT[d]}</Pill>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Btn size="sm" variant="ghost" onClick={() => setEditingPro(p)} aria-label={`Editar "${p.name}"`}>
                        Editar
                      </Btn>
                      {upcoming === 0 && professionals.length > 1 && (
                        <ConfirmButton
                          label="Eliminar"
                          ariaLabel={`Eliminar "${p.name}"`}
                          title="Eliminar profesional"
                          message={`Se eliminará a ${p.name}. Su historial de citas pasadas se conserva.`}
                          onConfirm={() => removePro(p)}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-[12px] text-text-subtle">Solo se puede eliminar una profesional sin citas próximas; el estudio necesita al menos una.</p>
        </Panel>
      </div>

      <Dialog open={creatingPro || editingPro !== null} onClose={closePro} title={editingPro ? "Editar profesional" : "Nueva profesional"}>
        {(creatingPro || editingPro) && <ProFields key={editingPro?.id ?? "nueva"} pro={editingPro} store={store} onClose={closePro} notify={notify} />}
      </Dialog>
    </div>
  );
}

function ScheduleEditor({ store, notify }: { store: ClientiaStore; notify: (msg: string) => void }) {
  const [draft, setDraft] = useState<Schedule>(store.schedule);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(store.schedule);

  function change(day: number, patch: Partial<DaySchedule>) {
    setDraft((d) => d.map((h, i) => (i === day ? { ...h, ...patch } : h)));
    setError("");
  }

  function save() {
    for (const day of WEEK_ORDER) {
      const h = draft[day];
      if (!h.open) continue;
      const name = WEEKDAYS[day];
      if (h.end <= h.start) return setError(`${name}: el cierre debe ser después de la apertura.`);
      if (h.hasBreak) {
        if (h.breakEnd <= h.breakStart) return setError(`${name}: el descanso debe terminar después de empezar.`);
        if (h.breakStart <= h.start || h.breakEnd >= h.end) return setError(`${name}: el descanso debe quedar dentro del horario de atención.`);
      }
    }
    if (!WEEK_ORDER.some((d) => draft[d].open)) return setError("El estudio debe abrir al menos un día.");
    store.setSchedule(draft);
    notify("Horario guardado");
  }

  const select = (label: string, value: number, onChange: (v: number) => void, disabled: boolean) => (
    <select aria-label={label} className="w-[7.5rem] rounded-md border border-border-strong bg-bg px-2 py-1.5 text-sm text-text disabled:opacity-50" value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))}>
      {HOURS.map((m) => (
        <option key={m} value={m}>
          {minutesLabel(m)}
        </option>
      ))}
    </select>
  );

  return (
    <Panel title="Horario de atención">
      <form
        aria-label="Horario de atención"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <ul className="-my-2 divide-y divide-border">
          {WEEK_ORDER.map((day) => {
            const h = draft[day];
            const name = WEEKDAYS[day].toLowerCase();
            return (
              <li key={day} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <label className="flex w-32 items-center gap-2 text-sm font-semibold text-text">
                  <input type="checkbox" checked={h.open} onChange={(e) => change(day, { open: e.target.checked })} aria-label={`Abierto el ${name}`} className="size-4 accent-brand" />
                  {WEEKDAYS[day]}
                </label>
                {h.open ? (
                  <>
                    <div className="flex items-center gap-1.5 text-sm text-text-muted">
                      {select(`Apertura del ${name}`, h.start, (v) => change(day, { start: v }), false)}
                      a
                      {select(`Cierre del ${name}`, h.end, (v) => change(day, { end: v }), false)}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={h.hasBreak} onChange={(e) => change(day, { hasBreak: e.target.checked })} aria-label={`Descanso el ${name}`} className="size-4 accent-brand" />
                        Descanso
                      </label>
                      {h.hasBreak && (
                        <>
                          {select(`Inicio del descanso del ${name}`, h.breakStart, (v) => change(day, { breakStart: v }), false)}a
                          {select(`Fin del descanso del ${name}`, h.breakEnd, (v) => change(day, { breakEnd: v }), false)}
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-text-subtle">Cerrado</span>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-3">
          <FormError>{error}</FormError>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          {dirty && <span className="mr-auto text-[13px] text-warning">Hay cambios sin guardar.</span>}
          <Btn variant="ghost" disabled={!dirty} onClick={() => setDraft(store.schedule)}>
            Descartar
          </Btn>
          <Btn variant="primary" type="submit" disabled={!dirty}>
            Guardar horario
          </Btn>
        </div>
      </form>
    </Panel>
  );
}

function ProFields({ pro, store, onClose, notify }: { pro: Professional | null; store: ClientiaStore; onClose: () => void; notify: (msg: string) => void }) {
  const [name, setName] = useState(pro?.name ?? "");
  const [role, setRole] = useState(pro?.role ?? "");
  const [days, setDays] = useState<number[]>(pro?.days ?? [1, 2, 3, 4, 5]);
  const [error, setError] = useState("");

  function save() {
    if (name.trim().length < 3) return setError("Escribe el nombre (mínimo 3 letras).");
    if (store.professionals.some((p) => p.id !== pro?.id && p.name.trim().toLowerCase() === name.trim().toLowerCase())) return setError("Ya hay una profesional con ese nombre.");
    if (days.length === 0) return setError("Elige al menos un día de atención.");
    const saved: Professional = { id: pro?.id ?? uid("p"), name: name.trim(), role: role.trim(), days: [...days].sort((a, b) => a - b) };
    store.setProfessionals((list) => (pro ? list.map((p) => (p.id === pro.id ? saved : p)) : [...list, saved]));
    notify(pro ? "Profesional actualizada" : "Profesional creada");
    onClose();
  }

  return (
    <form
      noValidate
      aria-label={pro ? "Editar profesional" : "Nueva profesional"}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="flex flex-col gap-4">
        <Field label="Nombre">{(id) => <input id={id} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}</Field>
        <Field label="Cargo o especialidad">{(id) => <input id={id} className={inputClass} value={role} onChange={(e) => setRole(e.target.value)} autoComplete="off" />}</Field>
        <fieldset className="min-w-0">
          <legend className="text-[13px] font-semibold text-text-muted">Días que atiende</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {WEEK_ORDER.map((d) => (
              <label key={d} className="flex items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1.5 text-sm text-text">
                <input
                  type="checkbox"
                  className="size-4 accent-brand"
                  checked={days.includes(d)}
                  onChange={(e) => setDays((list) => (e.target.checked ? [...list, d] : list.filter((x) => x !== d)))}
                />
                {WEEKDAYS[d]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="mt-3">
        <FormError>{error}</FormError>
      </div>
      <div className="-mx-5 mt-5 -mb-4 flex justify-end gap-2 border-t border-border px-5 py-3">
        <Btn variant="ghost" onClick={onClose}>
          Cancelar
        </Btn>
        <Btn variant="primary" type="submit">
          Guardar
        </Btn>
      </div>
    </form>
  );
}
