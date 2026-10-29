import type { ReactNode } from "react";

/** Props que reciben todas las demos. `embedded`: incrustada en la portada (S5), sin tocar la URL. */
export interface DemoAppProps {
  embedded?: boolean;
}

export interface NavItem<V extends string> {
  id: V;
  label: string;
  /** Contador opcional junto a la etiqueta (p. ej. alertas pendientes). */
  badge?: number;
}

/**
 * Marco de aplicación de las demos: navegación lateral en escritorio, pestañas desplazables en móvil, y la
 * pantalla actual con su título y acciones. Ocupa toda la altura de su contenedor.
 */
export function AppShell<V extends string>({
  appName,
  tagline,
  nav,
  view,
  onNavigate,
  title,
  actions,
  sidebarFooter,
  children,
}: {
  appName: string;
  tagline?: string;
  nav: NavItem<V>[];
  view: V;
  onNavigate: (view: V) => void;
  title: string;
  actions?: ReactNode;
  sidebarFooter?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div data-ui className="flex h-full min-h-0 flex-col bg-bg-raised text-text lg:flex-row">
      <nav aria-label={`Secciones de ${appName}`} className="shrink-0 border-b border-border bg-bg lg:flex lg:w-56 lg:flex-col lg:border-r lg:border-b-0">
        <div className="hidden px-5 pt-5 pb-4 lg:block">
          <p className="font-display text-xl text-text">{appName}</p>
          {tagline && <p className="text-[12px] text-text-subtle">{tagline}</p>}
        </div>
        <ul className="flex gap-1 overflow-x-auto px-2 py-2 lg:flex-1 lg:flex-col lg:overflow-x-visible lg:py-0">
          {nav.map((item) => {
            const active = item.id === view;
            return (
              <li key={item.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm whitespace-nowrap transition-colors ${
                    active ? "bg-surface-hover font-semibold text-text" : "text-text-muted hover:bg-surface hover:text-text"
                  }`}
                >
                  {item.label}
                  {item.badge ? (
                    <span className="rounded-full bg-warning-muted px-1.5 text-[12px] font-semibold text-warning tabular-nums">{item.badge}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
        {sidebarFooter && <div className="hidden border-t border-border p-4 lg:block">{sidebarFooter}</div>}
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <h2 className="font-display text-2xl text-text">{title}</h2>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
        {sidebarFooter && <div className="border-t border-border px-4 py-3 lg:hidden">{sidebarFooter}</div>}
      </div>
    </div>
  );
}
