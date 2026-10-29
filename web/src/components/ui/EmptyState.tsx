import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm bg-surface px-6 py-14 text-center">
      {icon && <div className="text-text-subtle">{icon}</div>}
      <p className="text-lg font-semibold text-text">{title}</p>
      {description && <p className="max-w-md text-base text-text">{description}</p>}
      {action}
    </div>
  );
}
