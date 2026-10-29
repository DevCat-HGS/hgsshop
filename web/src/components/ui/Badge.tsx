import type { ReactNode } from "react";

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-border-strong px-2.5 py-1 text-xs font-medium text-text-muted ${className}`}>
      {children}
    </span>
  );
}
