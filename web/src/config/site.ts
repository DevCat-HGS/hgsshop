/**
 * Configuración centralizada de la plataforma: marca, dominio y canales de contacto.
 * Nada de esto debería escribirse de nuevo en un componente o página; se importa de aquí.
 * El dominio y la marca son provisionales (ver README) y están aislados para poder
 * migrarlos sin tocar el resto de la aplicación.
 */

export const site = {
  brand: {
    name: "HGS Digital",
    shortName: "HGS",
    tagline: "Software a medida para quienes construyen un negocio digital",
  },

  domain: "products.hgsportafolio.site",
  url: "https://products.hgsportafolio.site",
  /** Imagen para compartir por defecto (design/scripts/generar-marca.py), 1200x630. */
  ogImage: "/og.png",

  owner: {
    name: "Harol Guerrero Salgado",
    portfolioUrl: "https://hgsportafolio.site",
  },

  /** Los formularios se envían al admin del portafolio, que los guarda y manda los correos (ver lib/formEndpoint.ts). */
  forms: {
    endpoint: "https://admin.hgsportafolio.site/api/shop-form",
  },

  contact: {
    email: "hdevelopergs@gmail.com",
  },

  locale: {
    default: "es",
    language: "es-ES",
  },
} as const;

export type SiteConfig = typeof site;
