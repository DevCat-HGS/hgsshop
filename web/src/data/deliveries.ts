/**
 * Trabajos ya entregados a negocios e instituciones. Los textos vienen tal cual del portafolio
 * (hgsportafolio.site, `portfolio/src/content/data/projects.json` del repo DevCat-HGS): si allá cambian,
 * se cambian aquí. Solo entran trabajos para terceros; los proyectos personales viven en el portafolio.
 */
export interface Delivery {
  name: string;
  tag: string;
  summary: string;
  result: string;
  /** Sitio en vivo. Sin él, el trabajo es privado del cliente. */
  href?: string;
}

export const deliveries: Delivery[] = [
  {
    name: "Hecho en Sabaneta",
    tag: "Comercio",
    summary: "Plataforma de comercio local: directorio, catálogo, carrito y eventos del municipio.",
    result: "Entregado al cliente",
    href: "https://hechoensabaneta.com",
  },
  {
    name: "Arcoiris Zapatería",
    tag: "Servicios",
    summary: "Sitio de servicios para un taller familiar en Medellín. Más de cincuenta oficios, antes/después, diagnóstico guiado a WhatsApp.",
    result: "En vivo, con contactos por WhatsApp",
    href: "https://arcoiriszapateria.com",
  },
  {
    name: "SENA Cloud",
    tag: "Plataforma",
    summary: "Operación académica y administrativa para instructores, admins y superadmins.",
    result: "En vivo, con tres roles de usuario",
    href: "https://senacloud.netlify.app/",
  },
  {
    name: "Farmacia Admin",
    tag: "Interno",
    summary: "Inventario, ventas y reportes privados para farmacias.",
    result: "Inventario, ventas y reportes",
  },
];
