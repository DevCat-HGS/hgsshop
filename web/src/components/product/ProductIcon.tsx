import type { ReactNode } from "react";
import { productThemes, themeStyle, type ProductTheme } from "@/demos/kit/themes";
import { Logo as StockFlowLogo } from "@/demos/stockflow/Logo";
import { ClientiaLogo } from "@/demos/clientia/Logo";
import { Logo as RoboAcademyLogo } from "@/demos/roboacademy/Logo";
import { Logo as TaskProLogo } from "@/demos/taskpro/Logo";

// Los isotipos dibujan con los tokens de color: al envolverlos en el tema de su producto toman su acento, y el
// trazo interior va en `brand-contrast` (navy), con contraste AA sobre cualquiera de estos acentos claros.
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

// Acentos claros, uno por producto y distintos entre sí, para que el navy del trazo se lea encima.
const ownThemes: Record<string, ProductTheme> = {
  flowauto: { brand: "#6fd3e8", hover: "#8cdcee", soft: "#b0e8f3" },
  mostrador: { brand: "#f6a96b", hover: "#f8ba87", soft: "#facca6" },
  "pedido-directo": { brand: "#b8e070", hover: "#c6e68b", soft: "#d6eeaa" },
  pase: { brand: "#f2d25c", hover: "#f5dc7f", soft: "#f8e7a5" },
  cotizador: { brand: "#f59393", hover: "#f7a9a9", soft: "#fac0c0" },
  cartera: { brand: "#6fe0c4", hover: "#8ce6cf", soft: "#aeeedd" },
  comanda: { brand: "#e3b0f0", hover: "#e9c1f3", soft: "#f0d3f7" },
};

const icons: Partial<Record<string, { theme: ProductTheme; draw: (px: number) => ReactNode }>> = {
  stockflow: { theme: productThemes.stockflow, draw: (px) => <StockFlowLogo size={px} /> },
  clientia: { theme: productThemes.clientia, draw: (px) => <ClientiaLogo size={px} /> },
  roboacademy: { theme: productThemes.roboacademy, draw: () => <RoboAcademyLogo className="size-full" /> },
  taskpro: { theme: productThemes.taskpro, draw: (px) => <TaskProLogo size={px} /> },
  ...Object.fromEntries(Object.entries(glyphs).map(([slug, draw]) => [slug, { theme: ownThemes[slug], draw }])),
};

export function hasProductIcon(slug: string): boolean {
  return Boolean(icons[slug]);
}

/** Solo el isotipo, en su acento. Para listas y filas donde el campo de color sobra. */
export function ProductMark({ slug, size }: { slug: string; size: number }) {
  const icon = icons[slug];
  if (!icon) return null;
  return (
    <span style={{ ...themeStyle(icon.theme), width: size, height: size }} className="block shrink-0">
      {icon.draw(size)}
    </span>
  );
}

/** Campo teñido con el acento del producto y su isotipo al centro. Sin isotipo propio no dibuja nada. */
export function ProductIcon({ slug, size, className = "" }: { slug: string; size: number; className?: string }) {
  const icon = icons[slug];
  if (!icon) return null;
  return (
    <div style={themeStyle(icon.theme)} className={`flex items-center justify-center bg-surface ${className}`}>
      <div className="flex size-full items-center justify-center bg-brand-muted">
        <span className="block transition-transform duration-500 group-hover:scale-[1.04]" style={{ width: size, height: size }}>
          {icon.draw(size)}
        </span>
      </div>
    </div>
  );
}
