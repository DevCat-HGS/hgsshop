import type { CSSProperties, ReactNode } from "react";
import type { ProductStatus } from "@/types/product";
import { themeStyle, type ProductTheme } from "@/demos/kit/themes";
import { Logo as StockFlowLogo } from "@/demos/stockflow/Logo";
import { ClientiaLogo } from "@/demos/clientia/Logo";
import { Logo as RoboAcademyLogo } from "@/demos/roboacademy/Logo";
import { Logo as TaskProLogo } from "@/demos/taskpro/Logo";

// Los isotipos dibujan con los tokens de color: toman el tono con que se los envuelve, y el trazo interior va en
// `brand-contrast` (navy), con contraste AA sobre Ice Blue, Emerald Mint y Steel Blue.
const C = "var(--color-brand-contrast)";
const B = "var(--color-brand)";

function Tile({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="26" height="26" rx="7" fill={B} />
      {children}
    </svg>
  );
}

// Isotipos de los productos que todavía no tienen app propia, en el mismo idioma que los de las demos.
const glyphs: Record<string, (size: number) => ReactNode> = {
  // FlowAuto: un dato que sale de una herramienta y llega a otra.
  flowauto: (size) => (
    <Tile size={size}>
      <circle cx="8.5" cy="9" r="3" fill={C} />
      <circle cx="19.5" cy="19.5" r="3" fill={C} />
      <path d="M11.5 9h5a3 3 0 0 1 3 3v2.5" stroke={C} strokeWidth="2" strokeLinecap="round" />
      <path d="M17 12.6l2.5 2.5 2.5-2.5" stroke={C} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Tile>
  ),
  // Mostrador: el tiquete de una venta.
  mostrador: (size) => (
    <Tile size={size}>
      <path d="M8 5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z" fill={C} />
      <rect x="10.5" y="8.5" width="7" height="1.6" rx="0.8" fill={B} />
      <rect x="10.5" y="12" width="4.5" height="1.6" rx="0.8" fill={B} />
      <rect x="10.5" y="15.5" width="7" height="1.6" rx="0.8" fill={B} />
    </Tile>
  ),
  // Pedido Directo: un mensaje que ya es una lista de pedido.
  "pedido-directo": (size) => (
    <Tile size={size}>
      <path d="M8.5 5h11A2.5 2.5 0 0 1 22 7.5v8a2.5 2.5 0 0 1-2.5 2.5h-7L8 22v-4h-.5A2.5 2.5 0 0 1 5 15.5v-8A2.5 2.5 0 0 1 7.5 5z" fill={C} />
      <circle cx="9.5" cy="9.5" r="1.1" fill={B} />
      <rect x="11.5" y="8.75" width="7" height="1.5" rx="0.75" fill={B} />
      <circle cx="9.5" cy="13.5" r="1.1" fill={B} />
      <rect x="11.5" y="12.75" width="5" height="1.5" rx="0.75" fill={B} />
    </Tile>
  ),
  // Pase: la tarjeta de membresía, al día.
  pase: (size) => (
    <Tile size={size}>
      <rect x="4" y="8" width="20" height="13" rx="2.5" fill={C} />
      <circle cx="4" cy="14.5" r="2" fill={B} />
      <circle cx="24" cy="14.5" r="2" fill={B} />
      <path d="M10.5 14.5l2.5 2.5 5-5" stroke={B} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Tile>
  ),
  // Cotizador: un documento con su total.
  cotizador: (size) => (
    <Tile size={size}>
      <path d="M8.5 4.5h8l4 4v14a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1z" fill={C} />
      <rect x="10" y="10.5" width="8" height="1.5" rx="0.75" fill={B} />
      <rect x="10" y="14" width="8" height="1.5" rx="0.75" fill={B} />
      <rect x="13" y="18.5" width="5" height="2.2" rx="1.1" fill={B} />
    </Tile>
  ),
  // Cartera: la billetera de lo que falta por cobrar.
  cartera: (size) => (
    <Tile size={size}>
      <path d="M7 9.5L17 5l2.5 4.5" fill={C} opacity="0.6" />
      <rect x="4" y="9" width="20" height="14" rx="3" fill={C} />
      <rect x="16" y="13.5" width="8" height="5" rx="2.5" fill={B} />
      <circle cx="19" cy="16" r="1.2" fill={C} />
    </Tile>
  ),
  // Comanda: el plato que sale de cocina.
  comanda: (size) => (
    <Tile size={size}>
      <circle cx="14" cy="8.5" r="1.6" fill={C} />
      <path d="M5 19a9 9 0 0 1 18 0z" fill={C} />
      <rect x="3.5" y="20" width="21" height="2.2" rx="1.1" fill={C} />
      <path d="M9 16a5 5 0 0 1 3-3.5" stroke={B} strokeWidth="1.5" strokeLinecap="round" />
    </Tile>
  ),
};

// Fuera de las demos, los isotipos usan solo la paleta de la marca y el color dice qué es cada cosa:
// Ice Blue para el software que ya existe, Emerald Mint para el servicio a medida y Steel Blue para las
// ideas que todavía no existen. Dentro de cada demo, la app conserva su acento propio (kit/themes.ts).
const tones: Record<"software" | "service" | "idea", ProductTheme> = {
  software: { brand: "#6ea8ff", hover: "#8cbbff", soft: "#a9cbff" },
  service: { brand: "#48d6b0", hover: "#6ddfc0", soft: "#9be9d4" },
  idea: { brand: "#a9b6cb", hover: "#bcc6d6", soft: "#cfd6e2" },
};

function toneFor(status: ProductStatus): ProductTheme {
  if (status === "idea") return tones.idea;
  if (status === "quote_required") return tones.service;
  return tones.software;
}

// El trazo va siempre en Midnight Navy, también dentro de una franja clara, que invierte `brand-contrast`.
function toneStyle(status: ProductStatus): CSSProperties {
  return { ...themeStyle(toneFor(status)), "--color-brand-contrast": "#080d18" } as CSSProperties;
}

const icons: Partial<Record<string, (px: number) => ReactNode>> = {
  stockflow: (px) => <StockFlowLogo size={px} />,
  clientia: (px) => <ClientiaLogo size={px} />,
  roboacademy: () => <RoboAcademyLogo className="size-full" />,
  taskpro: (px) => <TaskProLogo size={px} />,
  ...glyphs,
};

export function hasProductIcon(slug: string): boolean {
  return Boolean(icons[slug]);
}

/** Solo el isotipo, en su acento. Para listas y filas donde el campo de color sobra. */
export function ProductMark({ slug, status, size }: { slug: string; status: ProductStatus; size: number }) {
  const draw = icons[slug];
  if (!draw) return null;
  return (
    <span style={{ ...toneStyle(status), width: size, height: size }} className="block shrink-0">
      {draw(size)}
    </span>
  );
}

/** Campo teñido con el tono del producto y su isotipo al centro. Sin isotipo propio no dibuja nada. */
export function ProductIcon({
  slug,
  status,
  size,
  className = "",
}: {
  slug: string;
  status: ProductStatus;
  size: number;
  className?: string;
}) {
  const draw = icons[slug];
  if (!draw) return null;
  return (
    <div style={toneStyle(status)} className={`flex items-center justify-center bg-surface ${className}`}>
      <div className="flex size-full items-center justify-center bg-brand-muted">
        <span className="block transition-transform duration-500 group-hover:scale-[1.04]" style={{ width: size, height: size }}>
          {draw(size)}
        </span>
      </div>
    </div>
  );
}
