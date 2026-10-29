/**
 * Trabajos ya entregados a empresas y negocios. Los textos vienen tal cual del portafolio
 * (hgsportafolio.site, `portfolio/src/content/data/projects.json` del repo DevCat-HGS): si allá cambian,
 * se cambian aquí. Solo entran trabajos para empresas y negocios: ni proyectos personales ni institucionales.
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
    name: "ARIA",
    tag: "IA generativa, SAP",
    summary:
      "Asistente de soporte SAP que responde desde más de 13.000 SAP Notes con Bedrock y RAG sobre AWS serverless. En el equipo hice la interfaz de chat, el panel de fuentes, la capa de API y la documentación.",
    result: "Respuesta completa en 5,9 s (antes 16,7 s)",
  },
  {
    name: "Farmacia Admin",
    tag: "Interno",
    summary: "Inventario, ventas y reportes privados para farmacias.",
    result: "Inventario, ventas y reportes",
  },
];
