/**
 * Capa de analítica sin proveedor. Hoy no envía nada a ningún sitio: no hay proveedor configurado
 * y no se instala ninguno sin decidirlo antes (ver ARCHITECTURE.md, "Analítica"). Las páginas ya
 * llaman a `trackEvent` en los puntos que interesan comercialmente, así que conectar un proveedor
 * respetuoso con la privacidad (Plausible, Umami…) es cambiar solo este archivo y la CSP.
 *
 * Regla: los eventos nunca llevan datos personales (nombre, correo, texto libre de formularios).
 */

export type AnalyticsEvent =
  | "product_viewed"
  | "demo_opened"
  | "form_submitted"
  | "catalog_filtered"
  | "quote_cta_clicked";

type EventProps = Record<string, string | number | boolean>;

export function trackEvent(event: AnalyticsEvent, props: EventProps = {}): void {
  if (import.meta.env.DEV) {
    console.debug("[analytics]", event, props);
  }
}
