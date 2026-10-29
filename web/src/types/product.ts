export type ProductStatus = "available" | "in_development" | "prototype" | "quote_required";

export type CommercialModel = "purchase" | "subscription" | "custom";

export interface PricingInfo {
  /** "fixed": precio cerrado. "from": precio desde. "quote": requiere cotización, sin precio publicado. */
  type: "fixed" | "from" | "quote";
  amount?: number;
  currency?: "USD" | "COP";
  period?: "one_time" | "monthly" | "yearly";
  note?: string;
}

export interface DemoInfo {
  url: string;
  instructions: string;
  /** Qué tan aislada está la demo de cualquier dato real/productivo. */
  isolation: string;
  limitations: string[];
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface Screenshot {
  src: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  shortDescription: string;
  description: string[];
  problem: string;
  audience: string;
  status: ProductStatus;
  commercialModels: CommercialModel[];
  pricing: PricingInfo;
  coverImage: string;
  screenshots: Screenshot[];
  videoUrl?: string;
  features: string[];
  technologies?: string[];
  benefits: string[];
  requirements?: string[];
  limitations: string[];
  demo?: DemoInfo;
  faqs: ProductFaq[];
  relatedSlugs?: string[];
  /** Contenido ilustrativo (capturas, copys) pendiente de reemplazar antes de publicar en producción. */
  isSampleContent: boolean;
}
