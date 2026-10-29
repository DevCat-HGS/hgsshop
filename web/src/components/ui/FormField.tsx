import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";

interface FieldWrapperProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (fieldProps: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}

const fieldClasses =
  "w-full rounded-md border bg-bg px-3.5 py-2.5 text-sm text-text placeholder:text-text-subtle transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand/40";

function borderFor(error?: string) {
  return error ? "border-danger focus:border-danger" : "border-border-strong focus:border-brand";
}

function FieldWrapper({ label, error, hint, required, children }: FieldWrapperProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-[13px] text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  error,
  hint,
  required,
  ...inputProps
}: Omit<FieldWrapperProps, "children"> & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      {(fieldProps) => (
        <input {...fieldProps} {...inputProps} required={required} className={`${fieldClasses} ${borderFor(error)}`} />
      )}
    </FieldWrapper>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  required,
  ...textareaProps
}: Omit<FieldWrapperProps, "children"> & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      {(fieldProps) => (
        <textarea
          {...fieldProps}
          {...textareaProps}
          required={required}
          className={`${fieldClasses} min-h-28 resize-y ${borderFor(error)}`}
        />
      )}
    </FieldWrapper>
  );
}

export function CheckboxField({
  label,
  error,
  ...inputProps
}: { label: ReactNode; error?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 size-4 shrink-0 accent-brand"
          {...inputProps}
        />
        <label htmlFor={id} className="text-sm text-text-muted">
          {label}
        </label>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  error,
  hint,
  required,
  children,
  ...selectProps
}: Omit<FieldWrapperProps, "children"> & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      {(fieldProps) => (
        <select {...fieldProps} {...selectProps} required={required} className={`${fieldClasses} ${borderFor(error)}`}>
          {children}
        </select>
      )}
    </FieldWrapper>
  );
}
