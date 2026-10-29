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
