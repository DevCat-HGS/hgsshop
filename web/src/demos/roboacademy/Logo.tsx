/** Isotipo de RoboAcademy: la cabeza de un robot con antena, en el acento del producto. */
export function Logo({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true" focusable="false">
      <circle cx="14" cy="3.5" r="2" fill="var(--color-brand)" />
      <rect x="13" y="4.5" width="2" height="4" rx="1" fill="var(--color-brand)" />
      <rect x="3" y="8" width="22" height="17" rx="5" fill="var(--color-brand)" />
      <rect x="6.5" y="12" width="15" height="8" rx="4" fill="var(--color-brand-contrast)" />
      <circle cx="10.5" cy="16" r="1.8" fill="var(--color-brand)" />
      <circle cx="17.5" cy="16" r="1.8" fill="var(--color-brand)" />
      <rect x="0.5" y="13" width="2.5" height="6" rx="1.25" fill="var(--color-brand-soft)" />
      <rect x="25" y="13" width="2.5" height="6" rx="1.25" fill="var(--color-brand-soft)" />
    </svg>
  );
}
