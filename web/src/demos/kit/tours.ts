/**
 * Recorrido de la primera visita: qué probar en cada demo, en pocos pasos. Solo texto; cada paso lleva a una
 * acción concreta que muestra el valor del producto.
 */
export interface TourStep {
  title: string;
  body: string;
}

export const tours: Record<string, TourStep[]> = {
  stockflow: [
    { title: "Bienvenido a StockFlow", body: "Es el inventario de una ferretería ficticia. Todo lo que hagas se guarda solo en este navegador." },
    { title: "Registra un movimiento", body: "En Movimientos, registra una salida de un producto y mira cómo cambian el stock, las alertas del Panel y el historial." },
    { title: "Despacha un pedido", body: "En Pedidos, despacha uno pendiente: el stock se descuenta solo. Prueba también con uno que no tenga stock suficiente." },
    { title: "Cambia de rol", body: "Abajo en el menú, \"Usar la demo como\" cambia de usuario. Con Marta (caja) verás que no puede registrar entradas." },
  ],
  clientia: [
    { title: "Bienvenido a Clientia", body: "Es la agenda de un centro de estética ficticio con dos profesionales. Todo se guarda solo en este navegador." },
    { title: "Agenda una cita", body: "En Agenda, haz clic en una franja libre. Intenta luego ocupar un horario ya tomado o el almuerzo: Clientia no lo deja." },
    { title: "Mira la ficha de un cliente", body: "En Clientes, abre una ficha: próximas citas, historial, gasto e inasistencias en un solo lugar." },
    { title: "Configura los recordatorios", body: "En Recordatorios, cambia la plantilla y mira la bandeja de salida. En la demo los envíos son simulados." },
  ],
  roboacademy: [
    { title: "Bienvenido a RoboAcademy", body: "Es una academia ficticia con cuatro grupos. Todo lo que hagas se guarda solo en este navegador." },
    { title: "Toma asistencia", body: "En Asistencia, elige un grupo y una sesión, y marca presentes y ausentes. El Panel muestra quién está en riesgo." },
    { title: "Registra un pago", body: "En Pagos, marca como pagada una mensualidad pendiente y mira cómo cambia el recaudo." },
    { title: "Genera un reporte", body: "En Reportes, elige un estudiante y un periodo: sale un reporte listo para imprimir o guardar en PDF para su acudiente." },
  ],
  taskpro: [
    { title: "Bienvenido a TaskPro", body: "Es el panel de un desarrollador independiente con varios proyectos. Todo se guarda solo en este navegador." },
    { title: "Mueve una tarea", body: "En el Tablero, crea una tarea y muévela de columna con las flechas o arrastrándola." },
    { title: "Mide tu tiempo", body: "En Hoy, inicia el temporizador de una tarea, recarga la página y verás que sigue contando." },
    { title: "Escribe una nota", body: "En Notas, escribe con markdown y fíjala: aparece en Hoy, junto a lo que estás haciendo." },
  ],
};
