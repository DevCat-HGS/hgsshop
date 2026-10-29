import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { DemoAppProps } from "@/demos/kit/AppShell";

/**
 * Demos que corren dentro de esta misma aplicación, por slug de producto. Cada una se carga bajo
 * demanda (su código no entra en el bundle del catálogo) y se abre a pantalla completa en `/demos/<slug>`. Una demo desplegada aparte —en su propio
 * subdominio, por ejemplo— no se registra aquí: basta con que `product.demo.url` sea una URL absoluta.
 */
export const inAppDemos: Partial<Record<string, LazyExoticComponent<ComponentType<DemoAppProps>>>> = {
  stockflow: lazy(() => import("@/demos/stockflow/StockFlowDemo").then((m) => ({ default: m.StockFlowDemo }))),
  clientia: lazy(() => import("@/demos/clientia/ClientiaDemo").then((m) => ({ default: m.ClientiaDemo }))),
  roboacademy: lazy(() => import("@/demos/roboacademy/RoboAcademyDemo").then((m) => ({ default: m.RoboAcademyDemo }))),
  taskpro: lazy(() => import("@/demos/taskpro/TaskProDemo").then((m) => ({ default: m.TaskProDemo }))),
};
