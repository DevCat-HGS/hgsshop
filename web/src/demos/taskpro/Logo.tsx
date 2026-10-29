/**
 * Isotipo de TaskPro: una tarjeta del tablero con una marca de hecho y una franja de progreso, en el acento del
 * producto. Usa los tokens de color, así sigue el acento de la app y el texto sobre él (`brand-contrast`).
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--color-brand)" />
      <path d="M7.5 12.5l3.6 3.6L20 7.5" stroke="var(--color-brand-contrast)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="7.5" y="19.5" width="13" height="2.6" rx="1.3" fill="var(--color-brand-contrast)" opacity="0.35" />
      <rect x="7.5" y="19.5" width="8" height="2.6" rx="1.3" fill="var(--color-brand-contrast)" />
    </svg>
  );
}
