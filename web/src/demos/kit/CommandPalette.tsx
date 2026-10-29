import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { SearchIcon } from "@/components/icons";
import { matches } from "@/demos/kit/format";

export interface Command {
  id: string;
  label: string;
  /** Texto secundario: el tipo de registro o un dato que ayude a distinguirlo. */
  hint?: string;
  /** Grupo bajo el que se lista ("Pantallas", "Productos"…). */
  group: string;
  /** Palabras extra que también encuentran el comando (SKU, teléfono…). */
  keywords?: string;
  run: () => void;
}

const MAX_RESULTS = 40;

/**
 * Búsqueda global de la demo (Ctrl+K o Cmd+K). Combobox accesible: el foco se queda en el campo y las flechas
 * mueven la opción activa (`aria-activedescendant`); Enter la ejecuta y Esc cierra.
 */
export function CommandPalette({ commands, enableShortcut }: { commands: Command[]; enableShortcut: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enableShortcut) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enableShortcut]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-keyshortcuts={enableShortcut ? "Control+K Meta+K" : undefined}
        className="flex w-full items-center gap-2 rounded-md border border-border-strong bg-bg px-3 py-2 text-left text-sm text-text-subtle hover:text-text-muted"
      >
        <SearchIcon className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">Buscar en todo</span>
        {enableShortcut && <span className="hidden rounded-sm bg-surface-hover px-1.5 text-[12px] text-text-muted lg:inline">Ctrl K</span>}
      </button>
      {open && <PaletteDialog commands={commands} onClose={() => setOpen(false)} />}
    </>
  );
}

function PaletteDialog({ commands, onClose }: { commands: Command[]; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const results = useMemo(() => {
    const q = query.trim();
    const found = q ? commands.filter((c) => matches(`${c.label} ${c.hint ?? ""} ${c.keywords ?? ""} ${c.group}`, q)) : commands.filter((c) => c.group === "Pantallas");
    return found.slice(0, MAX_RESULTS);
  }, [commands, query]);

  const current = Math.min(active, Math.max(results.length - 1, 0));

  function run(command: Command) {
    onClose();
    command.run();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current + 1) % Math.max(results.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current - 1 + results.length) % Math.max(results.length, 1));
    } else if (event.key === "Enter" && results[current]) {
      event.preventDefault();
      run(results[current]);
    }
  }

  useEffect(() => {
    document.getElementById(`${listId}-${current}`)?.scrollIntoView({ block: "nearest" });
  }, [current, listId]);

  return (
    <dialog
      ref={ref}
      aria-label="Buscar en la demo"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl rounded-lg border border-border-strong bg-surface p-0 text-text shadow-[var(--shadow-float)] backdrop:bg-black/60"
    >
      <div className="flex items-center gap-2 border-b border-border px-4">
        <SearchIcon className="size-4 shrink-0 text-text-subtle" aria-hidden="true" />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results.length ? `${listId}-${current}` : undefined}
          aria-label="Buscar registros o pantallas"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Busca un registro o una pantalla…"
          className="w-full bg-transparent py-3.5 text-sm text-text placeholder:text-text-subtle focus:outline-none"
        />
      </div>
      <ul id={listId} role="listbox" aria-label="Resultados" className="max-h-[50dvh] overflow-y-auto p-2">
        {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-text-muted">Sin resultados para "{query}".</li>}
        {results.map((command, index) => {
          const heading = command.group !== results[index - 1]?.group ? command.group : null;
          return (
            <li key={command.id} role="presentation">
              {heading && <p className="px-3 pt-2 pb-1 text-[12px] font-semibold text-text-subtle" aria-hidden="true">{heading}</p>}
              <div
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === current}
                onMouseMove={() => setActive(index)}
                onClick={() => run(command)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${index === current ? "bg-surface-hover text-text" : "text-text-muted"}`}
              >
                <span className="truncate">{command.label}</span>
                {command.hint && <span className="shrink-0 text-[12px] text-text-subtle">{command.hint}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </dialog>
  );
}
