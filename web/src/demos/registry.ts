import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * Demos que corren dentro de esta misma aplicación, por slug de producto. Cada una se carga bajo
 * demanda (su código no entra en el bundle del catálogo). Una demo desplegada aparte —en su propio
 * subdominio, por ejemplo— no se registra aquí: basta con que `product.demo.url` sea una URL absoluta.
 */
export const inAppDemos: Partial<Record<string, LazyExoticComponent<ComponentType>>> = {
  devpanel: lazy(() => import("@/demos/devpanel/DevPanelDemo").then((m) => ({ default: m.DevPanelDemo }))),
};
