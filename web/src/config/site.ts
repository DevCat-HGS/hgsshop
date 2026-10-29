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

  owner: {
    name: "Harol Guerrero Salgado",
    portfolioUrl: "https://hgsportafolio.site",
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
