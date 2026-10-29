import { useState, type Dispatch, type SetStateAction } from "react";
import { formatDateTime, matches } from "@/demos/kit/format";
import { uid } from "@/demos/kit/storage";
import { Btn, ConfirmButton, Empty, Field, FormError, Pill, SearchField, inputClass } from "@/demos/kit/ui";
import type { Note, Project } from "./data";
import { Markdown } from "./Markdown";
import { plainExcerpt } from "./excerpt";
import { ProjectDot } from "./TaskDialog";

const NEW = "__nueva__";

export function NotesView({
  projects,
  notes,
  setNotes,
  selectedId,
  onSelect,
  notify,
}: {
  projects: Project[];
  notes: Note[];
  setNotes: Dispatch<SetStateAction<Note[]>>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  notify: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const byId = new Map(projects.map((p) => [p.id, p]));

  const visible = notes
    .filter((n) => projectFilter === "all" || n.projectId === projectFilter)
    .filter((n) => !query.trim() || matches(`${n.title} ${n.body}`, query))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);

  const selected = selectedId && selectedId !== NEW ? notes.find((n) => n.id === selectedId) : undefined;
  const editorOpen = selectedId === NEW || selected != null;

  function save(note: Note) {
    const exists = notes.some((n) => n.id === note.id);
    setNotes((list) => (exists ? list.map((n) => (n.id === note.id ? note : n)) : [note, ...list]));
    onSelect(note.id);
    notify(exists ? "Nota guardada" : "Nota creada");
  }

  function remove(note: Note) {
    setNotes((list) => list.filter((n) => n.id !== note.id));
    onSelect(null);
    notify("Nota eliminada");
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <section aria-label="Lista de notas" className={`flex-col gap-3 ${editorOpen ? "hidden lg:flex" : "flex"}`}>
        <Btn variant="primary" onClick={() => onSelect(NEW)}>
          Nueva nota
        </Btn>
        <div className="flex">
          <SearchField label="Buscar notas" placeholder="Buscar en notas…" value={query} onChange={setQuery} />
        </div>
        <Field label="Proyecto">
          {(id) => (
            <select id={id} className={inputClass} value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
              <option value="all">Todos</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        {visible.length === 0 ? (
          <Empty>No hay notas que coincidan.</Empty>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {visible.map((note) => {
              const active = note.id === selectedId;
              return (
                <li key={note.id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => onSelect(note.id)}
                    className={`flex w-full flex-col gap-1 rounded-md border p-3 text-left ${active ? "border-brand bg-brand-muted" : "border-border bg-bg hover:border-border-strong"}`}
                  >
                    <span className="flex w-full items-center gap-2">
                      <ProjectDot project={byId.get(note.projectId)} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text">{note.title}</span>
                      {note.pinned && <Pill tone="brand">Fijada</Pill>}
                    </span>
                    <span className="line-clamp-2 text-[13px] text-text-muted">{plainExcerpt(note.body, 90) || "Sin contenido"}</span>
                    <span className="text-[12px] text-text-subtle">
                      {byId.get(note.projectId)?.name ?? "Sin proyecto"} · {formatDateTime(note.updatedAt)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editorOpen ? (
        <NoteEditor
          key={selectedId}
          note={selected ?? null}
          projects={projects}
          defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
          onSave={save}
          onDelete={remove}
          onBack={() => onSelect(null)}
        />
      ) : (
        <div className="hidden rounded-lg border border-dashed border-border-strong lg:block">
          <Empty>Elige una nota de la lista o crea una nueva.</Empty>
        </div>
      )}
    </div>
  );
}

function NoteEditor({
  note,
  projects,
  defaultProjectId,
  onSave,
  onDelete,
  onBack,
}: {
  note: Note | null;
  projects: Project[];
  defaultProjectId?: string;
  onSave: (note: Note) => void;
  onDelete: (note: Note) => void;
  onBack: () => void;
}) {
  const choices = projects.filter((p) => p.status !== "archived" || p.id === note?.projectId);
  const [title, setTitle] = useState(note?.title ?? "");
  const [projectId, setProjectId] = useState(note?.projectId ?? (choices.some((p) => p.id === defaultProjectId) ? defaultProjectId! : (choices[0]?.id ?? "")));
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [body, setBody] = useState(note?.body ?? "");
  const [mode, setMode] = useState<"write" | "preview">(note ? "preview" : "write");
  const [error, setError] = useState("");

  const dirty = !note || title !== note.title || projectId !== note.projectId || pinned !== note.pinned || body !== note.body;

  function submit() {
    const cleanTitle = title.trim();
    if (!cleanTitle) return setError("Escribe un título para la nota.");
    if (!choices.some((p) => p.id === projectId)) return setError("Vincula la nota a un proyecto.");
    setError("");
    onSave({ id: note?.id ?? uid("n"), title: cleanTitle, projectId, pinned, body, updatedAt: Date.now() });
  }

  const tab = (id: "write" | "preview", label: string) => (
    <button
      type="button"
      aria-pressed={mode === id}
      onClick={() => setMode(id)}
      className={`rounded-md px-3 py-1.5 text-[13px] font-semibold ${mode === id ? "bg-surface-hover text-text" : "text-text-muted hover:text-text"}`}
    >
      {label}
    </button>
  );

  return (
    <form
      aria-label={note ? `Editar nota "${note.title}"` : "Nueva nota"}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-bg p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="text-sm text-brand hover:underline lg:hidden">
          ← Volver a notas
        </button>
        <p className="text-[12px] text-text-subtle">{note ? (dirty ? "Cambios sin guardar" : `Guardada ${formatDateTime(note.updatedAt)}`) : "Nota nueva"}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <Field label="Título">{(id) => <input id={id} className={inputClass} value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />}</Field>
        <Field label="Proyecto">
          {(id) => (
            <select id={id} className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {choices.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-text">
        <input type="checkbox" className="size-4 accent-[var(--color-brand)]" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
        Fijar en Hoy
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div role="group" aria-label="Modo del editor" className="flex gap-1">
            {tab("write", "Escribir")}
            {tab("preview", "Vista previa")}
          </div>
          <p className="hidden text-[12px] text-text-subtle sm:block">Markdown: # títulos, **negrita**, `código`, ``` bloques, - listas</p>
        </div>
        {mode === "write" ? (
          <textarea
            aria-label="Contenido de la nota"
            className={`${inputClass} min-h-72 leading-relaxed`}
            value={body}
            maxLength={10000}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"# Título\n\nTexto con **negrita** y `código`.\n\n- Punto uno\n- Punto dos"}
          />
        ) : (
          <div aria-label="Vista previa" role="region" className="min-h-72 rounded-md border border-border bg-bg-raised p-4">
            <Markdown source={body} />
          </div>
        )}
      </div>

      <FormError>{error}</FormError>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        {note ? (
          <ConfirmButton label="Eliminar nota" title="Eliminar nota" message={`¿Eliminar la nota "${note.title}"? Esta acción no se puede deshacer.`} onConfirm={() => onDelete(note)} />
        ) : (
          <span />
        )}
        <Btn variant="primary" type="submit" disabled={!dirty}>
          {note ? "Guardar cambios" : "Crear nota"}
        </Btn>
      </div>
    </form>
  );
}
