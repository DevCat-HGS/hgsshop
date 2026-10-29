import type { ReactNode } from "react";

/**
 * Identidad visual de cada categoría: un color y un motivo abstracto. Vive en la capa de UI (no en
 * src/data) porque es presentación; una categoría nueva sin entrada aquí usa `fallbackVisual`.
 * Los motivos son ilustraciones, no capturas: no representan la interfaz real de ningún producto.
 */

export interface CategoryVisual {
  color: string;
  label: string;
  motif: ReactNode;
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const inventoryMotif = (
  <g {...stroke}>
    {[0, 1, 2].map((row) =>
      [0, 1, 2, 3].map((col) => (
        <rect
          key={`${row}-${col}`}
          x={110 + col * 46}
          y={52 + row * 42}
          width={38}
          height={34}
          rx={4}
          opacity={(row + col) % 3 === 0 ? 1 : 0.35}
          fill={(row + col) % 3 === 0 ? "currentColor" : "none"}
          fillOpacity={0.12}
        />
      )),
    )}
    <path d="M96 184h208" opacity={0.5} />
  </g>
);

const scheduleMotif = (
  <g {...stroke}>
    <rect x={104} y={44} width={192} height={140} rx={8} opacity={0.6} />
    <path d="M104 72h192" opacity={0.6} />
    {[0, 1, 2, 3].map((row) =>
      [0, 1, 2, 3, 4, 5].map((col) => {
        const active = (row === 1 && col === 2) || (row === 2 && col === 4) || (row === 0 && col === 5);
        return (
          <rect
            key={`${row}-${col}`}
            x={114 + col * 30}
            y={82 + row * 24}
            width={22}
            height={16}
            rx={3}
            opacity={active ? 1 : 0.25}
            fill={active ? "currentColor" : "none"}
            fillOpacity={0.25}
          />
        );
      }),
    )}
  </g>
);

const educationMotif = (
  <g {...stroke}>
    <path d="M120 150 170 100l60 30 50-60" opacity={0.5} />
    <path d="M170 100v70M230 130v40M120 150v20M280 70v100" opacity={0.25} />
    {[
      [120, 150],
      [170, 100],
      [230, 130],
      [280, 70],
    ].map(([cx, cy]) => (
      <g key={`${cx}-${cy}`}>
        <circle cx={cx} cy={cy} r={12} fill="currentColor" fillOpacity={0.12} />
        <circle cx={cx} cy={cy} r={4} fill="currentColor" />
      </g>
    ))}
    <path d="M104 184h192" opacity={0.5} />
  </g>
);

const devToolsMotif = (
  <g {...stroke}>
    <rect x={96} y={44} width={208} height={140} rx={8} opacity={0.6} />
    <circle cx={112} cy={58} r={3} fill="currentColor" opacity={0.6} />
    <circle cx={124} cy={58} r={3} fill="currentColor" opacity={0.4} />
    <circle cx={136} cy={58} r={3} fill="currentColor" opacity={0.25} />
    <path d="M96 72h208" opacity={0.4} />
    <path d="m114 94 10 8-10 8" />
    <path d="M134 110h44" opacity={0.9} />
    <path d="M114 128h96M114 144h64M114 160h120" opacity={0.3} />
    <rect x={226} y={124} width={58} height={44} rx={4} fill="currentColor" fillOpacity={0.12} opacity={0.8} />
  </g>
);

const automationMotif = (
  <g {...stroke}>
    <rect x={96} y={96} width={56} height={36} rx={6} fill="currentColor" fillOpacity={0.12} />
    <rect x={172} y={56} width={56} height={36} rx={6} opacity={0.5} />
    <rect x={172} y={136} width={56} height={36} rx={6} opacity={0.5} />
    <rect x={248} y={96} width={56} height={36} rx={6} fill="currentColor" fillOpacity={0.12} />
    <path d="M152 114h8a12 12 0 0 0 12-12v-28M152 114h8a12 12 0 0 1 12 12v28" opacity={0.6} />
    <path d="M228 74h8a12 12 0 0 1 12 12v28M228 154h8a12 12 0 0 0 12-12v-28" opacity={0.6} />
  </g>
);

const visuals: Record<string, CategoryVisual> = {
  "inventario-y-operaciones": { color: "#6ea8ff", label: "Inventario", motif: inventoryMotif },
  "agendas-y-clientes": { color: "#4fc3e0", label: "Agendas", motif: scheduleMotif },
  educacion: { color: "#48d6b0", label: "Educación", motif: educationMotif },
  "herramientas-dev": { color: "#8f9bff", label: "Dev tools", motif: devToolsMotif },
  automatizacion: { color: "#b4a7ff", label: "Automatización", motif: automationMotif },
};

const fallbackVisual: CategoryVisual = { color: "#6ea8ff", label: "Software", motif: devToolsMotif };

export function visualFor(categorySlug: string): CategoryVisual {
  return visuals[categorySlug] ?? fallbackVisual;
}
