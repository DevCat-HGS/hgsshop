import type { CSSProperties } from "react";
import { visualFor } from "@/components/product/categoryVisuals";

/**
 * Sustituto honesto de una captura: ningún producto del catálogo de ejemplo tiene todavía una UI
 * final que mostrar, así que se usa el motivo abstracto de su categoría y se rotula como ilustración,
 * en vez de inventar una interfaz que no existe.
 */
export function ProductCoverArt({
  categorySlug,
  className = "",
  showLabel = true,
  aspect = "aspect-[16/9]",
}: {
  categorySlug: string;
  className?: string;
  showLabel?: boolean;
  aspect?: string;
}) {
  const visual = visualFor(categorySlug);

  return (
    <div
      className={`relative ${aspect} w-full overflow-hidden bg-bg-raised ${className}`}
      style={{ "--hue": visual.color } as CSSProperties}
    >
      <svg viewBox="0 0 400 225" className="absolute inset-0 size-full" style={{ color: visual.color }} aria-hidden="true">
        {visual.motif}
      </svg>
      {showLabel && (
        <span className="absolute bottom-2.5 left-3 text-[13px] text-text-subtle">
          Ilustración · sin capturas reales aún
        </span>
      )}
    </div>
  );
}
