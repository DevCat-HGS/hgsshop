import { useState } from "react";
import { formatDate, fromDateInput, toDateInput } from "@/demos/kit/format";
import { Btn, ConfirmButton, Dialog, Empty, Field, FormError, Pill, inputClass } from "@/demos/kit/ui";
import { activeIn, type Student, todayStart, nowMs } from "./data";
import { GroupSelect, StepBar } from "./shared";
import type { ScreenProps } from "./store";

export function Progress({ academy, notify }: ScreenProps) {
  const { groups, students, notes } = academy;
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [notesFor, setNotesFor] = useState<string | null>(null);

  const group = groups.find((g) => g.id === groupId) ?? groups[0];
  if (!group) return <Empty>Crea un grupo para seguir el progreso.</Empty>;

  const roster = activeIn(students, group.id).sort((a, b) => b.moduleIndex - a.moduleIndex || a.name.localeCompare(b.name, "es"));
  const total = group.modules.length;
  const notesOf = (id: string) => notes.filter((n) => n.studentId === id).sort((a, b) => b.date - a.date);

  function move(s: Student, delta: number) {
    const next = Math.max(0, Math.min(total, s.moduleIndex + delta));
    academy.setModule(s.id, next);
    notify(next >= total ? `${s.name} completó la ruta` : `${s.name} pasa a "${group!.modules[next].name}"`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Grupo" className="w-full sm:w-72">
          {(id) => <GroupSelect id={id} groups={groups} value={group.id} onChange={setGroupId} />}
        </Field>
        <p className="pb-2 text-sm text-text-muted">
          {total} módulos: {group.modules.map((m) => m.name).join(" → ")}
        </p>
      </div>

      {roster.length === 0 ? (
        <Empty>Este grupo no tiene estudiantes activos.</Empty>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-bg">
          {roster.map((s) => {
            const list = notesOf(s.id);
            return (
              <li key={s.id} className="grid gap-3 p-4 md:grid-cols-[12rem_1fr_auto] md:items-center">
                <div className="min-w-0">
                  <p className="font-semibold text-text">{s.name}</p>
                  {list[0] && (
                    <p className="truncate text-[12px] text-text-subtle" title={list[0].text}>
                      {formatDate(list[0].date)}: {list[0].text}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <StepBar group={group} index={s.moduleIndex} />
                  </div>
                  {s.moduleIndex >= total && <Pill tone="success">Completó</Pill>}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Btn size="sm" variant="ghost" aria-label={`Retroceder de módulo a ${s.name}`} disabled={s.moduleIndex === 0} onClick={() => move(s, -1)}>
                    Retroceder
                  </Btn>
                  <Btn size="sm" aria-label={`Avanzar de módulo a ${s.name}`} disabled={s.moduleIndex >= total} onClick={() => move(s, 1)}>
                    Avanzar
                  </Btn>
                  <Btn size="sm" variant="ghost" aria-label={`Notas de ${s.name}`} onClick={() => setNotesFor(s.id)}>
                    Notas ({list.length})
                  </Btn>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {notesFor && <NotesDialog key={notesFor} academy={academy} notify={notify} studentId={notesFor} onClose={() => setNotesFor(null)} />}
    </div>
  );
}

function NotesDialog({ academy, notify, studentId, onClose }: ScreenProps & { studentId: string; onClose: () => void }) {
  const student = academy.students.find((s) => s.id === studentId);
  const [date, setDate] = useState(toDateInput(nowMs()));
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const list = academy.notes.filter((n) => n.studentId === studentId).sort((a, b) => b.date - a.date);

  function add() {
    if (text.trim().length < 3) return setError("Escribe la nota antes de guardarla.");
    if (!date || fromDateInput(date) > todayStart()) return setError("La fecha de la nota no puede ser futura.");
    academy.addNote(studentId, fromDateInput(date), text.trim());
    setText("");
    setError("");
    notify("Nota agregada");
  }

  return (
    <Dialog open onClose={onClose} title={`Notas de ${student?.name ?? ""}`} wide>
      <form
        aria-label="Nueva nota"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="space-y-3"
      >
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <Field label="Fecha">{(id) => <input id={id} type="date" value={date} max={toDateInput(nowMs())} onChange={(e) => setDate(e.target.value)} className={inputClass} />}</Field>
          <Field label="Nota del profesor">
            {(id) => <textarea id={id} rows={2} value={text} onChange={(e) => setText(e.target.value)} className={inputClass} placeholder="Qué logró, qué le cuesta, qué sigue" />}
          </Field>
        </div>
        <FormError>{error}</FormError>
        <div className="flex justify-end">
          <Btn type="submit" variant="primary">
            Agregar nota
          </Btn>
        </div>
      </form>

      <h3 className="mt-5 mb-2 text-sm font-semibold text-text">Historial</h3>
      {list.length === 0 ? (
        <p className="text-sm text-text-muted">Sin notas todavía.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="text-[12px] text-text-subtle">{formatDate(n.date)}</p>
                <p className="text-text">{n.text}</p>
              </div>
              <ConfirmButton
                label="Borrar"
                ariaLabel={`Borrar nota del ${formatDate(n.date)}`}
                title="Borrar nota"
                message="¿Borrar esta nota del profesor?"
                confirmLabel="Borrar"
                onConfirm={() => {
                  academy.deleteNote(n.id);
                  notify("Nota borrada");
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
