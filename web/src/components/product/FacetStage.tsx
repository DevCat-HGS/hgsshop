import type { ProductStatus } from "@/types/product";
import { assembledFacets, statusLabels } from "@/lib/format";

// Las seis facetas del isotipo de HGS (mismo hexágono que el logo), con la dirección hacia la que
// se separa cada una cuando todavía no está ensamblada.
const FACETS = [
  { d: "M16 2 28.12 9 16 16Z", fill: "#a9cbff", dx: 1.6, dy: -2.6 },
  { d: "M28.12 9v14L16 16Z", fill: "#6ea8ff", dx: 3, dy: 0 },
  { d: "M28.12 23 16 30V16Z", fill: "#3366a8", dx: 1.6, dy: 2.6 },
  { d: "M16 30 3.88 23 16 16Z", fill: "#4178c2", dx: -1.6, dy: 2.6 },
  { d: "M3.88 23V9L16 16Z", fill: "#48d6b0", dx: -3, dy: 0 },
  { d: "M3.88 9 16 2v14Z", fill: "#2a5490", dx: -1.6, dy: -2.6 },
];

/**
 * Estado de un producto como hexágono a medio ensamblar. Es la idea visual de la marca: un prototipo
 * tiene dos facetas colocadas y el resto sueltas; un producto disponible está completo. Los servicios a
 * medida se muestran como contorno vacío: se arman con cada cliente.
 */
export function FacetStage({ status, className = "size-10", label = true }: { status: ProductStatus; className?: string; label?: boolean }) {
  const placed = assembledFacets[status];
  const isService = status === "quote_required";

  return (
    <span className="inline-flex items-center gap-3">
      <svg
        viewBox="-4 -4 40 40"
        className={`${className} shrink-0 overflow-visible`}
        role="img"
        aria-label={isService ? "Servicio a medida" : `${statusLabels[status]}: ${placed} de 6 facetas ensambladas`}
      >
        {FACETS.map((facet, index) => {
          const isPlaced = index < placed;
          return (
            <path
              key={facet.d}
              d={facet.d}
              fill={isPlaced ? facet.fill : "none"}
              stroke={isPlaced ? "none" : isService ? "#6ea8ff" : "#2c3f63"}
              strokeWidth={isPlaced ? 0 : 1}
              strokeLinejoin="round"
              transform={isPlaced || isService ? undefined : `translate(${facet.dx} ${facet.dy})`}
            />
          );
        })}
      </svg>
      {label && (
        <span className="text-[15px] leading-tight">
          <span className="block font-semibold text-text">{statusLabels[status]}</span>
          <span className="block text-text-muted">{isService ? "Se arma con cada cliente" : `${placed} de 6 facetas`}</span>
        </span>
      )}
    </span>
  );
}
