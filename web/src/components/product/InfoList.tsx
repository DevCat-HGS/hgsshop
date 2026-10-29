import type { ReactNode } from "react";
import { CheckIcon, AlertTriangleIcon } from "@/components/icons";

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-base text-text">
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
        <li key={item} className="flex items-start gap-2.5 text-base text-text">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="py-8 first:pt-0">
      <h2 className="font-display text-[length:var(--text-step-lead)] text-text">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
