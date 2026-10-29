import type { CommercialModel, PricingInfo, ProductStatus } from "@/types/product";

export const statusLabels: Record<ProductStatus, string> = {
  available: "Disponible",
  in_development: "En desarrollo",
  prototype: "Prototipo",
  quote_required: "Bajo cotización",
};

export const statusDescriptions: Record<ProductStatus, string> = {
  available: "Listo para contratar.",
  in_development: "Funciona, pero sigue en construcción activa.",
  prototype: "Primera versión funcional, pendiente de validar con uso real.",
  quote_required: "Se construye a medida según cada caso; no es un producto instalable tal cual.",
};

export const statusTone: Record<ProductStatus, "success" | "warning" | "info" | "brand"> = {
  available: "success",
  in_development: "warning",
  prototype: "info",
  quote_required: "brand",
};

/** Etapas de la línea de vida de un producto instalable. "quote_required" es un servicio y no tiene etapas. */
export const lifecycleStages: { status: ProductStatus; label: string }[] = [
  { status: "prototype", label: "Prototipo" },
  { status: "in_development", label: "En desarrollo" },
  { status: "available", label: "Disponible" },
];

/** Facetas del hexágono de HGS ensambladas por etapa: el producto se "arma" a medida que avanza. */
export const assembledFacets: Record<ProductStatus, number> = {
  prototype: 2,
  in_development: 4,
  available: 6,
  quote_required: 0,
};

export const commercialModelLabels: Record<CommercialModel, string> = {
  purchase: "Compra o licencia",
  subscription: "Suscripción",
  custom: "Desarrollo a medida",
};

const currencyFormatters: Record<NonNullable<PricingInfo["currency"]>, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat("es-CO", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
  COP: new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }),
};

const periodSuffix: Record<NonNullable<PricingInfo["period"]>, string> = {
  one_time: " (pago único)",
  monthly: " / mes",
  yearly: " / año",
};

export function formatPrice(pricing: PricingInfo): string {
  if (pricing.type === "quote") return "Precio bajo cotización";

  if (pricing.amount == null || !pricing.currency) return "Precio bajo cotización";

  const amount = currencyFormatters[pricing.currency].format(pricing.amount);
  const prefix = pricing.type === "from" ? "Desde " : "";
  const suffix = pricing.period ? periodSuffix[pricing.period] : "";
  return `${prefix}${amount}${suffix}`;
}
