/**
 * Isotipo de Clientia: una hoja de calendario redondeada con la "C" de la marca y un punto que marca la cita.
 * Usa el acento del producto (`--color-brand`), así que hereda el rosa del tema de la app.
 */
export function ClientiaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <rect x="2" y="4" width="28" height="26" rx="8" fill="var(--color-brand)" />
      <rect x="9" y="1.5" width="3" height="6" rx="1.5" fill="var(--color-brand-soft)" />
      <rect x="20" y="1.5" width="3" height="6" rx="1.5" fill="var(--color-brand-soft)" />
      <path d="M20.5 12.6a6 6 0 1 0 0 8.8" stroke="var(--color-brand-contrast)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="22.5" cy="17" r="2" fill="var(--color-brand-contrast)" />
    </svg>
  );
}
