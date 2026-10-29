import type { ReactNode } from "react";

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-brand-soft ${className}`}>
      <span className="h-px w-5 bg-brand/60" aria-hidden="true" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    <div className={`flex flex-wrap items-end justify-between gap-6 ${centered ? "flex-col items-center text-center" : ""}`}>
      <div className={centered ? "flex flex-col items-center" : ""}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-balance text-text sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 max-w-xl text-base text-pretty text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
