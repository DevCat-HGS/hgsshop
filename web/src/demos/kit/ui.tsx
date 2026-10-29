import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type FormEvent, type ReactNode } from "react";
import { CloseIcon, SearchIcon } from "@/components/icons";

/**
 * Piezas de interfaz de las demos. Son "interfaz de producto" (data-ui en la página), no el sitio de marketing:
 * más densas, con bordes visibles y radio de 6 px. Usan los mismos tokens de color del sitio.
 */

export const inputClass =
  "w-full rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-text placeholder:text-text-subtle disabled:opacity-50";

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";

const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-brand text-brand-contrast hover:bg-brand-hover",
  secondary: "bg-surface-hover text-text hover:bg-depth",
  ghost: "text-text-muted hover:bg-surface-hover hover:text-text",
  danger: "bg-danger-muted text-danger hover:bg-danger hover:text-bg",
};

export function Btn({
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" }) {
  const sizes = size === "sm" ? "px-2.5 py-1 text-[13px]" : "px-3.5 py-2 text-sm";
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizes} ${btnVariants[variant]} ${className}`}
    />
  );
}

/** Etiqueta + control. `children` recibe el id para el `htmlFor`. */
export function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-semibold text-text-muted">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-[12px] text-text-subtle">{hint}</p>}
    </div>
  );
}

export function SearchField({ value, onChange, label, placeholder }: { value: string; onChange: (value: string) => void; label: string; placeholder?: string }) {
  return (
    <div className="relative min-w-0 flex-1 sm:max-w-xs">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-subtle" aria-hidden="true" />
      <input type="search" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? "Buscar…"} className={`${inputClass} pl-9`} />
    </div>
  );
}

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-hover text-text-muted",
  brand: "bg-brand-muted text-brand-soft",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  danger: "bg-danger-muted text-danger",
};

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex shrink-0 items-center rounded-sm px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap ${toneClasses[tone]}`}>{children}</span>;
}

export function Stat({ label, value, detail, tone }: { label: string; value: ReactNode; detail?: ReactNode; tone?: Tone }) {
  const valueTone = tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-text";
  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <p className="text-[13px] text-text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${valueTone}`}>{value}</p>
      {detail && <p className="mt-1 text-[12px] text-text-subtle">{detail}</p>}
    </div>
  );
}

/** Contenedor con título para bloques dentro de una pantalla. */
export function Panel({ title, actions, children, className = "" }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={`rounded-lg border border-border bg-bg ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          {title && <h3 className="text-sm font-semibold text-text">{title}</h3>}
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-2 py-8 text-center text-sm text-text-muted">{children}</p>;
}

/** Tabla con desplazamiento horizontal propio: la página nunca se desborda en móvil. */
export function Table({ label, head, children, minWidth = "40rem" }: { label: string; head: ReactNode[]; children: ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-bg">
      <table aria-label={label} className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="text-[13px] text-text-muted">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-3 py-2.5 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-t [&>tr]:border-border [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-2.5">{children}</tbody>
      </table>
    </div>
  );
}

/**
 * Diálogo modal nativo (`<dialog>`): atrapa el foco, cierra con Esc y devuelve el foco al cerrar.
 * Con `onSubmit`, el contenido va dentro de un formulario y el botón principal lo envía.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = "Guardar",
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit?.();
  }

  const body = (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 id={titleId} className="text-base font-semibold text-text">
          {title}
        </h2>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text">
          <CloseIcon className="size-4" />
        </button>
      </div>
      <div className="max-h-[70dvh] overflow-y-auto px-5 py-4">{children}</div>
      {onSubmit && (
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn variant="primary" type="submit">
            {submitLabel}
          </Btn>
        </div>
      )}
    </>
  );

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] rounded-lg border border-border-strong bg-surface p-0 text-text shadow-[var(--shadow-float)] backdrop:bg-black/60 ${wide ? "max-w-2xl" : "max-w-lg"}`}
    >
      {open && (onSubmit ? <form onSubmit={submit}>{body}</form> : body)}
    </dialog>
  );
}

/** Botón que pide confirmación antes de una acción destructiva. */
export function ConfirmButton({
  label,
  title,
  message,
  confirmLabel = "Eliminar",
  onConfirm,
  size = "sm",
  ariaLabel,
}: {
  label: ReactNode;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  size?: "sm" | "md";
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn variant="ghost" size={size} onClick={() => setOpen(true)} aria-label={ariaLabel}>
        {label}
      </Btn>
      <Dialog open={open} onClose={() => setOpen(false)} title={title}>
        <p className="text-sm text-text">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Btn>
          <Btn
            variant="danger"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Btn>
        </div>
      </Dialog>
    </>
  );
}

/** Mensaje de error de validación dentro de un formulario. */
export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}
