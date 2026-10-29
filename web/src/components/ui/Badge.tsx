import type { ReactNode } from "react";

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-sm bg-surface-hover px-2.5 py-1 text-[13px] font-semibold text-text-muted ${className}`}>
      {children}
    </span>
  );
}
