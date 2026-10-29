import type { Product } from "@/types/product";

/**
 * Catálogo de ejemplo. Cada producto está marcado con `isSampleContent: true`: son ideas de
 * producto reales del dueño de la plataforma, pero ninguno está terminado ni a la venta todavía.
 * Se reemplaza o amplía desde aquí (o, cuando exista, desde el panel administrativo) sin tocar
 * ninguna página — todas leen el catálogo a través de `src/lib/catalog.ts`.
 */
export const products: Product[] = [
  {
    id: "stockflow",
    slug: "stockflow",
    name: "StockFlow",
    categorySlug: "inventario-y-operaciones",
    shortDescription: "Inventario y pedidos para negocios con stock físico, sin hojas de cálculo.",
    description: [
      "StockFlow centraliza existencias, entradas, salidas y pedidos de un negocio en un solo lugar, pensado para reemplazar el hilo de hojas de cálculo y mensajes de WhatsApp con el que muchos equipos controlan su inventario hoy.",
      "La idea es que cualquier persona del equipo pueda registrar un movimiento de stock en segundos desde el celular, y que el dueño del negocio tenga una vista clara de qué se está agotando antes de que sea un problema.",
    ],
    problem:
      "Negocios pequeños y medianos pierden ventas por quiebres de stock que no ven venir, o inmovilizan dinero en productos que no rotan, porque el control vive en hojas de cálculo que nadie actualiza a tiempo.",
    audience: "Tiendas, distribuidoras y pequeños negocios con inventario físico y más de una persona registrando movimientos.",
    status: "prototype",
    commercialModels: ["purchase", "custom"],
    pricing: { type: "quote" },
    coverImage: "",
    screenshots: [],
    features: [
      "Registro de entradas, salidas y ajustes de inventario",
      "Alertas de stock mínimo configurables por producto",
      "Historial de movimientos con responsable y fecha",
      "Reportes de rotación y productos sin movimiento",
      "Múltiples usuarios con permisos por rol",
    ],
    technologies: ["React", "Node.js", "PostgreSQL"],
    benefits: [
      "Visibilidad del inventario en tiempo real para todo el equipo",
      "Menos quiebres de stock y menos capital inmovilizado",
      "Trazabilidad: queda registro de quién movió qué y cuándo",
    ],
    requirements: ["Conexión a internet", "Navegador moderno (no requiere instalación)"],
    limitations: [
      "Es un prototipo funcional: el flujo de inventario y reportes básicos ya funcionan, pero no está validado con un negocio real todavía.",
      "No incluye todavía integración con lectores de código de barras ni facturación electrónica.",
    ],
    faqs: [
      {
        question: "¿Puedo probarlo antes de decidir?",
        answer:
          "Todavía no hay una demo pública disponible. Mientras tanto, puedes solicitar una sesión guiada o una cotización y te muestro el estado real del producto.",
      },
      {
        question: "¿Funciona para más de una bodega o sucursal?",
        answer: "El modelo de datos lo contempla, pero el soporte multi-sucursal se prioriza según la demanda real de quien lo contrate.",
      },
    ],
    relatedSlugs: ["flowauto", "clientia"],
    isSampleContent: true,
  },
  {
    id: "clientia",
    slug: "clientia",
    name: "Clientia",
    categorySlug: "agendas-y-clientes",
    shortDescription: "Agenda de citas y seguimiento de clientes para negocios de servicios.",
    description: [
      "Clientia es una agenda pensada para negocios que viven de citas y seguimiento: reservas, recordatorios y una ficha simple por cliente con su historial.",
      "El objetivo es evitar las citas dobles, los olvidos y el cuaderno físico, sin obligar al negocio a aprender un sistema complejo.",
    ],
    problem:
      "Profesionales y negocios de servicios agendan por WhatsApp o en papel, pierden el historial de cada cliente y dependen de recordar manualmente quién tiene cita y cuándo.",
    audience: "Profesionales independientes y negocios de servicios con agenda de citas (salud, estética, asesorías, talleres).",
    status: "in_development",
    commercialModels: ["subscription", "custom"],
    pricing: { type: "quote", note: "Se evalúa un plan de suscripción mensual una vez cerrado el alcance con el primer cliente." },
    coverImage: "",
    screenshots: [],
    features: [
      "Calendario de citas con disponibilidad configurable",
      "Ficha de cliente con historial de citas",
      "Recordatorios automáticos antes de cada cita",
      "Vista de agenda diaria y semanal",
    ],
    technologies: ["React", "Firebase"],
    benefits: [
      "Menos inasistencias gracias a los recordatorios",
      "Historial de cada cliente a la mano, sin buscar en chats",
      "Agenda compartida si hay más de una persona atendiendo",
    ],
    limitations: [
      "En desarrollo: el calendario y la ficha de cliente están implementados; los recordatorios automáticos todavía no.",
      "Por ahora no hay demo pública.",
    ],
    faqs: [
      {
        question: "¿Envía recordatorios por WhatsApp?",
        answer: "Es la idea, pero todavía no está implementado. Hoy el recordatorio es solo dentro de la agenda.",
      },
    ],
    relatedSlugs: ["roboacademy", "stockflow"],
    isSampleContent: true,
  },
  {
    id: "roboacademy",
    slug: "roboacademy",
    name: "RoboAcademy",
    categorySlug: "educacion",
    shortDescription: "Gestión de estudiantes, grupos y asistencia para academias de robótica.",
    description: [
      "RoboAcademy nació de una necesidad puntual: academias de robótica y programación para niños que gestionan grupos, asistencia y progreso de cada estudiante a mano.",
      "Busca darle a quien dirige la academia una vista clara de qué estudiante va en qué módulo, quién pagó y quién faltó, sin convertirse en un sistema académico pesado.",
    ],
    problem:
      "Las academias pequeñas gestionan grupos, asistencia y pagos en hojas sueltas o grupos de chat, y pierden de vista el progreso real de cada estudiante.",
    audience: "Academias y talleres de robótica o programación para niños y jóvenes, con grupos recurrentes.",
    status: "prototype",
    commercialModels: ["custom", "subscription"],
    pricing: { type: "quote" },
    coverImage: "",
    screenshots: [],
    features: [
      "Gestión de grupos y horarios",
      "Registro de asistencia por sesión",
      "Seguimiento del módulo o proyecto de cada estudiante",
      "Vista de pagos pendientes por estudiante",
    ],
    benefits: [
      "Una sola vista de grupos, asistencia y progreso",
      "Menos trabajo administrativo para quien dirige la academia",
    ],
    limitations: [
      "Prototipo construido a partir de un caso real; falta adaptarlo a academias distintas a la original.",
      "No incluye todavía reportes para entregar a los padres.",
    ],
    faqs: [
      {
        question: "¿Se adapta a mi academia aunque no sea de robótica?",
        answer: "Sí: el modelo de grupos, asistencia y progreso aplica a cualquier academia con clases recurrentes. Se ajusta el lenguaje y los campos al contratar.",
      },
    ],
    relatedSlugs: ["clientia"],
    isSampleContent: true,
  },
  {
    id: "devpanel",
    slug: "devpanel",
    name: "DevPanel",
    categorySlug: "herramientas-dev",
    shortDescription: "Panel de productividad para desarrolladores: tareas, proyectos y notas en un solo lugar.",
    description: [
      "DevPanel es una herramienta de productividad pensada para desarrolladores y equipos pequeños que necesitan ver sus tareas, proyectos activos y notas técnicas sin saltar entre cinco aplicaciones distintas.",
      "Es, a la vez, el panel con el que HGS Digital organiza su propio trabajo — por eso es el producto con la demo más avanzada del catálogo.",
    ],
    problem:
      "Los desarrolladores independientes y equipos pequeños reparten su trabajo entre apps de notas, tableros de tareas y hojas sueltas, y pierden tiempo buscando en qué estaban en lugar de trabajar.",
    audience: "Desarrolladores independientes y equipos pequeños de software.",
    status: "in_development",
    commercialModels: ["subscription", "custom"],
    pricing: { type: "quote", note: "La demo es de uso libre; el modelo de suscripción se define al cerrar el primer grupo de usuarios." },
    coverImage: "",
    screenshots: [],
    features: [
      "Tablero de tareas por proyecto",
      "Notas técnicas vinculadas a cada proyecto",
      "Vista rápida de lo que está en progreso",
    ],
    technologies: ["React", "TypeScript"],
    benefits: [
      "Un solo lugar para tareas y notas de cada proyecto",
      "Pensado para flujo de trabajo individual, sin fricción de herramientas corporativas",
    ],
    limitations: [
      "La demo usa datos ficticios guardados solo en tu navegador: se reinician si borras el caché o cambias de dispositivo.",
      "Todavía no hay sincronización en la nube ni cuentas de usuario.",
    ],
    demo: {
      url: "/demos/devpanel",
      instructions: "Se abre directamente en el navegador. Puedes crear, completar y eliminar tareas de ejemplo: ningún dato se envía a ningún servidor.",
      isolation: "100% local: el estado vive solo en la memoria de tu navegador durante la sesión.",
      limitations: [
        "No hay persistencia entre sesiones ni sincronización entre dispositivos.",
        "Las tareas y proyectos son de ejemplo; no representan datos reales de ningún cliente.",
      ],
    },
    faqs: [
      {
        question: "¿Mis tareas de la demo se guardan?",
        answer: "No. La demo es completamente local a tu navegador y se reinicia al recargar la página; es intencional, para no mezclar datos de prueba con datos reales.",
      },
      {
        question: "¿Cuándo habrá una versión con cuenta propia?",
        answer: "Todavía no tiene fecha. Si te interesa ser de los primeros en probarla con tus datos reales, escríbeme desde la página de contacto.",
      },
    ],
    relatedSlugs: ["flowauto"],
    isSampleContent: true,
  },
  {
    id: "flowauto",
    slug: "flowauto",
    name: "FlowAuto",
    categorySlug: "automatizacion",
    shortDescription: "Automatizaciones e integraciones a medida entre las herramientas que ya usas.",
    description: [
      "FlowAuto no es un producto cerrado, sino un servicio: automatizar tareas repetitivas conectando las herramientas que un negocio ya usa (formularios, hojas de cálculo, correo, APIs de terceros) para que dejen de hacerse a mano.",
      "Cada automatización se diseña según el caso real del cliente, así que no hay una versión genérica para probar — el punto de partida siempre es entender el proceso que se quiere automatizar.",
    ],
    problem:
      "Equipos pequeños dedican horas cada semana a copiar datos entre sistemas, revisar formularios manualmente o generar reportes a mano, tareas que son mecánicas y propensas a error.",
    audience: "Negocios y equipos que repiten manualmente una tarea entre dos o más sistemas (formularios, hojas de cálculo, correo, APIs).",
    status: "quote_required",
    commercialModels: ["custom"],
    pricing: { type: "quote", note: "El alcance y el precio dependen por completo del proceso a automatizar." },
    coverImage: "",
    screenshots: [],
    features: [
      "Integración entre formularios, hojas de cálculo y correo",
      "Conexión con APIs de terceros existentes",
      "Procesos programados o disparados por eventos",
    ],
    benefits: [
      "Horas de trabajo manual convertidas en un proceso automático",
      "Menos errores humanos en tareas repetitivas",
    ],
    limitations: [
      "Es un servicio a medida, no un producto instalable: cada automatización se cotiza según el caso.",
      "No hay demo genérica porque no hay un flujo único que mostrar.",
    ],
    faqs: [
      {
        question: "¿Cómo empiezo si no sé si se puede automatizar?",
        answer: "Cuéntame el proceso actual, paso a paso, desde la página de desarrollo a medida. Te digo con honestidad si tiene sentido automatizarlo y qué implicaría.",
      },
    ],
    relatedSlugs: ["stockflow", "devpanel"],
    isSampleContent: true,
  },
];
