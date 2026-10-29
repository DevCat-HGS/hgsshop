import type { ProductStatus } from "@/types/product";
import { statusLabels, statusTone } from "@/lib/format";

const toneClasses: Record<(typeof statusTone)[ProductStatus], { pill: string; dot: string }> = {
  success: { pill: "bg-success-muted text-success", dot: "bg-success" },
  warning: { pill: "bg-warning-muted text-warning", dot: "bg-warning" },
  info: { pill: "bg-info-muted text-text-muted", dot: "bg-info" },
  brand: { pill: "bg-brand-muted text-brand-soft", dot: "bg-brand-soft" },
  muted: { pill: "bg-surface-hover text-text-muted", dot: "bg-text-subtle" },
};

export function StatusBadge({ status, className = "" }: { status: ProductStatus; className?: string }) {
  const tone = toneClasses[statusTone[status]];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1 text-[13px] font-semibold ${tone.pill} ${className}`}>
      <span className={`size-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
      {statusLabels[status]}
    </span>
  );
}
