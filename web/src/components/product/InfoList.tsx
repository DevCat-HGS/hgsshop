import type { ReactNode } from "react";
import { CheckIcon, AlertTriangleIcon } from "@/components/icons";

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-text-muted">
          <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function LimitationsList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-text-muted">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border py-8 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
