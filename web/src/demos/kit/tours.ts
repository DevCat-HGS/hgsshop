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
    { title: "Pide a tu proveedor", body: "En Compras, la sugerencia calcula cuánto pedir según la rotación y el plazo del proveedor. Crea la orden, recíbela en parte y mira cómo cambian el stock y el costo promedio." },
    { title: "Cambia de rol", body: "Abajo en el menú, \"Usar la demo como\" cambia de usuario. Con Marta (caja) verás que no puede registrar entradas." },
  ],
  clientia: [
    { title: "Bienvenido a Clientia", body: "Es la agenda de un centro de estética ficticio con dos profesionales. Todo se guarda solo en este navegador." },
    { title: "Agenda una cita", body: "En Agenda, haz clic en una franja libre. Intenta luego ocupar un horario ya tomado o el almuerzo: Clientia no lo deja." },
    { title: "Mira la ficha de un cliente", body: "En Clientes, abre una ficha: próximas citas, historial, gasto e inasistencias en un solo lugar." },
    { title: "Reserva como cliente", body: "En Reservas en línea, abre \"Así la ve tu cliente\" y pide una cita. Después confírmala en Solicitudes y aparece en la Agenda." },
  ],
  roboacademy: [
    { title: "Bienvenido a RoboAcademy", body: "Es una academia ficticia con cuatro grupos. Todo lo que hagas se guarda solo en este navegador." },
    { title: "Toma asistencia", body: "En Asistencia, elige un grupo y una sesión, y marca presentes y ausentes. El Panel muestra quién está en riesgo." },
    { title: "Registra un pago", body: "En Pagos, marca como pagada una mensualidad pendiente y mira cómo cambia el recaudo." },
    { title: "Inscribe a un aspirante", body: "En Inscripciones, llena el formulario como lo vería un acudiente e inscribe al aspirante en un grupo con cupo. Luego míralo en el Portal del acudiente." },
  ],
  taskpro: [
    { title: "Bienvenido a TaskPro", body: "Es el panel de un desarrollador independiente con varios proyectos. Todo se guarda solo en este navegador." },
    { title: "Mueve una tarea", body: "En el Tablero, crea una tarea y muévela de columna con las flechas o arrastrándola." },
    { title: "Mide tu tiempo", body: "En Hoy, inicia el temporizador de una tarea, recarga la página y verás que sigue contando." },
    { title: "Cobra tus horas", body: "En Cobros, genera una cuenta de cobro con las horas facturables de un cliente y márcala como enviada: esas horas ya no se cobran dos veces." },
  ],
};
