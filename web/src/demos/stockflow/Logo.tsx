/**
 * Isotipo de StockFlow: tres cajas apiladas en una estantería, en el acento del producto. Usa los tokens de color,
 * así sigue el acento de la app y el texto sobre él (`brand-contrast`).
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--color-brand)" />
      <rect x="6" y="13" width="7" height="7" rx="1.2" fill="var(--color-brand-contrast)" />
      <rect x="15" y="13" width="7" height="7" rx="1.2" fill="var(--color-brand-contrast)" opacity="0.55" />
      <rect x="10.5" y="6" width="7" height="6" rx="1.2" fill="var(--color-brand-contrast)" opacity="0.8" />
      <rect x="4.5" y="21" width="19" height="2" rx="1" fill="var(--color-brand-contrast)" />
    </svg>
  );
}
