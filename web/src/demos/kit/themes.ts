import type { CSSProperties } from "react";

/**
 * Identidad de cada producto dentro de su app: un acento propio que reemplaza al Ice Blue de HGS en botones,
 * selección y gráficos. Todos son claros, así que el texto sobre el acento sigue siendo navy (`brand-contrast`)
 * con contraste AA. Se aplica redefiniendo los tokens en el contenedor de la app: los diálogos y avisos que
 * cuelgan de él heredan el mismo acento.
 */
export interface ProductTheme {
  brand: string;
  hover: string;
  soft: string;
}

export const productThemes = {
  stockflow: { brand: "#f5b84a", hover: "#f8c86f", soft: "#f9d58f" },
  clientia: { brand: "#f49ab8", hover: "#f7b2c9", soft: "#f9c7d8" },
  roboacademy: { brand: "#5fd39a", hover: "#7ddcae", soft: "#a3e8c6" },
  taskpro: { brand: "#b49cff", hover: "#c4b1ff", soft: "#d4c6ff" },
} satisfies Record<string, ProductTheme>;

export function themeStyle(theme: ProductTheme): CSSProperties {
  return {
    "--color-brand": theme.brand,
    "--color-brand-hover": theme.hover,
    "--color-brand-soft": theme.soft,
    "--color-brand-muted": `${theme.brand}1f`,
  } as CSSProperties;
}
