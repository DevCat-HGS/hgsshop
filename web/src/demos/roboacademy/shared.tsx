import type { ReactNode } from "react";
import { Pill, inputClass } from "@/demos/kit/ui";
import { RISK_THRESHOLD, type Group } from "./data";

/** Barra de pasos de los módulos: hechos, actual y pendientes. */
export function StepBar({ group, index, compact = false }: { group: Group; index: number; compact?: boolean }) {
  const total = group.modules.length;
  const done = Math.min(index, total);
  const label = index >= total ? `Ruta completada (${total} de ${total} módulos)` : `Módulo ${index + 1} de ${total}: ${group.modules[index].name}`;
  return (
    <div className="min-w-0">
      <ol aria-label={label} className="ra-steps flex gap-1">
        {group.modules.map((m, i) => (
          <li
            key={m.id}
            title={m.name}
            className={`h-2 flex-1 rounded-sm ${i < done ? "ra-step-done bg-success" : i === index ? "ra-step-current bg-brand" : "ra-step-todo bg-surface-hover"}`}
          >
            <span className="sr-only">
              {m.name}: {i < done ? "completado" : i === index ? "en curso" : "pendiente"}
            </span>
          </li>
        ))}
      </ol>
      {!compact && <p className="mt-1.5 truncate text-[13px] text-text-muted">{label}</p>}
    </div>
  );
}

/** Barra de ocupación del cupo. */
export function CapacityBar({ used, capacity }: { used: number; capacity: number }) {
  const pct = capacity ? Math.min(100, Math.round((used / capacity) * 100)) : 0;
  const tone = used >= capacity ? "bg-warning" : "bg-brand";
  return (
    <div>
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="text-text-muted">Ocupación</span>
        <span className="font-semibold text-text tabular-nums">
          {used} de {capacity}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-hover" role="progressbar" aria-label="Ocupación del cupo" aria-valuenow={used} aria-valuemin={0} aria-valuemax={capacity}>
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function RatePill({ rate }: { rate: number | null }) {
  if (rate === null) return <Pill>Sin registro</Pill>;
  return <Pill tone={rate < RISK_THRESHOLD ? "danger" : rate < 85 ? "warning" : "success"}>{rate} %</Pill>;
}

/** Selector de grupo reutilizado por varias pantallas. */
export function GroupSelect({ id, groups, value, onChange, allLabel }: { id: string; groups: Group[]; value: string; onChange: (id: string) => void; allLabel?: string }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      {allLabel && <option value="">{allLabel}</option>}
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </select>
  );
}

/** Estado vacío útil: qué falta y la acción para empezar. */
export function EmptyState({ title, children, actions }: { title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <section aria-label={title} className="rounded-lg border border-dashed border-border-strong bg-bg px-5 py-10 text-center">
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {children && <div className="mx-auto mt-1.5 max-w-md text-sm text-text-muted">{children}</div>}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </section>
  );
}

/**
 * Marco de las vistas "como las ve el acudiente": deja claro que es la pantalla del cliente final y que en la
 * demo no existe un enlace público real.
 */
export function ClientFrame({ label, address, notice, toolbar, children }: { label: string; address: string; notice: ReactNode; toolbar?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 text-sm">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-text">
            <Pill tone="brand">{label}</Pill>
            Así lo ve el acudiente
          </p>
          <p className="mt-1 text-text-muted">{notice}</p>
        </div>
        {toolbar}
      </div>
      <section aria-label={label} className="mx-auto max-w-3xl overflow-hidden rounded-xl border-2 border-brand/60 bg-bg shadow-[var(--shadow-float)]">
        <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2" aria-hidden="true">
          <span className="flex gap-1">
            <span className="size-2.5 rounded-full bg-surface-hover" />
            <span className="size-2.5 rounded-full bg-surface-hover" />
            <span className="size-2.5 rounded-full bg-surface-hover" />
          </span>
          <span className="min-w-0 flex-1 truncate rounded-md bg-bg px-3 py-1 text-center text-[12px] text-text-subtle">{address}</span>
        </div>
        <div className="p-4 sm:p-7">{children}</div>
      </section>
    </div>
  );
}
