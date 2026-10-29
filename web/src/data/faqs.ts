export interface GeneralFaq {
  question: string;
  answer: string;
}

export const generalFaqs: GeneralFaq[] = [
  {
    question: "¿Los productos del catálogo ya están terminados?",
    answer:
      "No todos. Cada producto muestra su estado real (prototipo, en desarrollo o que requiere cotización) en su propia página. Ninguno se presenta como terminado si no lo está.",
  },
  {
    question: "¿Puedo probar un producto antes de contratarlo?",
    answer:
      "Cuando existe una demo, se puede abrir directamente desde la página del producto. Si todavía no hay demo, la página lo indica claramente y puedes solicitar una sesión guiada o una cotización.",
  },
  {
    question: "¿Cómo funciona el proceso para contratar una solución?",
    answer:
      "Eliges un producto o describes tu necesidad en desarrollo a medida, me cuentas el contexto del negocio y el alcance, y te respondo con una propuesta concreta: qué se puede hacer, en qué tiempo aproximado y bajo qué modelo (compra, suscripción o desarrollo a medida).",
  },
  {
    question: "¿Qué modelos de contratación existen?",
    answer:
      "Compra o licencia para productos ya disponibles, suscripción para acceso recurrente cuando el producto lo permite, y desarrollo a medida para integraciones o funcionalidades específicas.",
  },
  {
    question: "¿Cómo se gestionan los pagos?",
    answer:
      "Todavía no hay una pasarela de pago integrada en la plataforma. Todo cobro se coordina directamente conmigo una vez se confirma el alcance, hasta que se habilite un método de pago definido.",
  },
];
