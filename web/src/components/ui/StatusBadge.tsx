import type { ProductStatus } from "@/types/product";
import { statusLabels, statusTone } from "@/lib/format";

const toneClasses: Record<(typeof statusTone)[ProductStatus], { pill: string; dot: string }> = {
  success: { pill: "border-success/25 bg-success-muted text-success", dot: "bg-success" },
  warning: { pill: "border-warning/25 bg-warning-muted text-warning", dot: "bg-warning animate-pulse-dot" },
  info: { pill: "border-info/25 bg-info-muted text-info", dot: "bg-info" },
  brand: { pill: "border-brand/30 bg-brand-muted text-brand-soft", dot: "bg-brand-soft" },
};

export function StatusBadge({ status, className = "" }: { status: ProductStatus; className?: string }) {
  const tone = toneClasses[statusTone[status]];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide ${tone.pill} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
      {statusLabels[status]}
    </span>
  );
}
