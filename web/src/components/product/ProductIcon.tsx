import type { ReactNode } from "react";
import { productThemes, themeStyle } from "@/demos/kit/themes";
import { Logo as StockFlowLogo } from "@/demos/stockflow/Logo";
import { ClientiaLogo } from "@/demos/clientia/Logo";
import { Logo as RoboAcademyLogo } from "@/demos/roboacademy/Logo";
import { Logo as TaskProLogo } from "@/demos/taskpro/Logo";

// Isotipo de cada app, el mismo que lleva dentro de su demo. Los logos usan los tokens de color, así que se
// dibujan con el acento del producto al envolverlos en su tema.
const icons: Partial<Record<string, { theme: keyof typeof productThemes; draw: (px: number) => ReactNode }>> = {
  stockflow: { theme: "stockflow", draw: (px) => <StockFlowLogo size={px} /> },
  clientia: { theme: "clientia", draw: (px) => <ClientiaLogo size={px} /> },
  roboacademy: { theme: "roboacademy", draw: () => <RoboAcademyLogo className="size-full" /> },
  taskpro: { theme: "taskpro", draw: (px) => <TaskProLogo size={px} /> },
};

export function hasProductIcon(slug: string): boolean {
  return Boolean(icons[slug]);
}

/** Campo teñido con el acento de la app y su isotipo al centro. Sin isotipo propio no dibuja nada. */
export function ProductIcon({ slug, size, className = "" }: { slug: string; size: number; className?: string }) {
  const icon = icons[slug];
  if (!icon) return null;
  return (
    <div style={themeStyle(productThemes[icon.theme])} className={`flex items-center justify-center bg-surface ${className}`}>
      <div className="flex size-full items-center justify-center bg-brand-muted">
        <span className="block transition-transform duration-500 group-hover:scale-[1.04]" style={{ width: size, height: size }}>
          {icon.draw(size)}
        </span>
      </div>
    </div>
  );
}
