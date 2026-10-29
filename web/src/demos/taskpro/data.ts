import { DAY_MS, daysFromToday, startOfDay } from "@/demos/kit/format";
import { isBlankStart, storageKey } from "@/demos/kit/storage";
import type { Tone } from "@/demos/kit/ui";
import { buildTimeLines, billTotal } from "./billing";

export const SLUG = "taskpro";

/** Nombres de almacén. Proyectos y tiempo pasaron a v2 al llegar los clientes y las tarifas. */
export const STORES = {
  clients: "clientes.v1",
  projects: "proyectos.v2",
  tasks: "tareas.v1",
  notes: "notas.v1",
  entries: "tiempo.v2",
  bills: "cuentas.v1",
  issuer: "emisor.v1",
  timer: "temporizador.v1",
} as const;

export type DocType = "NIT" | "CC" | "CE" | "PP";

export const DOC_TYPES: { id: DocType; label: string }[] = [
  { id: "NIT", label: "NIT" },
  { id: "CC", label: "Cédula de ciudadanía" },
  { id: "CE", label: "Cédula de extranjería" },
  { id: "PP", label: "Pasaporte" },
];

/** "NIT 900.123.456-7", "C.C. 1.036.987.654". */
export function docLabel(type: DocType, number: string) {
  const prefix = type === "NIT" ? "NIT" : type === "CC" ? "C.C." : type === "CE" ? "C.E." : "Pasaporte";
  return number ? `${prefix} ${number}` : `${prefix} sin registrar`;
}

export interface Client {
  id: string;
  /** Nombre o razón social. */
  name: string;
  docType: DocType;
  docNumber: string;
  /** Persona de contacto. */
  contact: string;
  email: string;
  city: string;
  createdAt: number;
}

export type BillingMode = "hourly" | "fixed";

export type ProjectStatus = "active" | "paused" | "archived";
export type TaskStatus = "todo" | "doing" | "review" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Project {
  id: string;
  name: string;
  clientId: string;
  color: ProjectColor;
  status: ProjectStatus;
  /** Solo texto: la demo nunca abre el repositorio. */
  repo: string;
  createdAt: number;
  /** Por hora (COP por hora) o por precio fijo. */
  billing: BillingMode;
  /** Por hora: la tarifa. Precio fijo: tarifa de las horas adicionales que se marquen facturables (0 = no se cobran). */
  hourlyRate: number;
  /** Solo en precio fijo: el valor total pactado. */
  fixedPrice: number;
}

/** Forma de la v1, antes de los clientes: el cliente era un texto libre. */
interface LegacyProject {
  id: string;
  name: string;
  client: string;
  color: ProjectColor;
  status: ProjectStatus;
  repo: string;
  createdAt: number;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  tags: string[];
  /** Medianoche local del día límite, o null si no tiene. */
  dueDate: number | null;
  subtasks: Subtask[];
  createdAt: number;
  updatedAt: number;
  /** Cuándo pasó a "Hecho"; sirve para el resumen semanal. */
  completedAt: number | null;
}

export interface Note {
  id: string;
  projectId: string;
  title: string;
  body: string;
  pinned: boolean;
  updatedAt: number;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  taskId: string | null;
  start: number;
  end: number;
  note: string;
  /** Se puede cobrar. Por defecto, sí en los proyectos por hora. */
  billable: boolean;
  /** Cuenta de cobro que la incluye (borrador, enviada o pagada). Null: sin cobrar. */
  billId: string | null;
}

export type BillStatus = "draft" | "sent" | "paid" | "void";

export const BILL_STATUS: Record<BillStatus, { label: string; tone: Tone }> = {
  draft: { label: "Borrador", tone: "neutral" },
  sent: { label: "Enviada", tone: "warning" },
  paid: { label: "Pagada", tone: "success" },
  void: { label: "Anulada", tone: "danger" },
};

export interface BillLine {
  id: string;
  /** "time": horas × tarifa, a partir de entradas de tiempo. "manual": concepto con valor (precio fijo, otros). */
  kind: "time" | "manual";
  projectId: string | null;
  /** Nombre del proyecto al crear la cuenta: el documento no cambia si luego se renombra. */
  projectName: string;
  description: string;
  /** Solo en líneas de tiempo. */
  minutes: number;
  rate: number;
  amount: number;
}

/** Cuenta de cobro (Colombia): documento de cobro de quien no está obligado a facturar. No es factura electrónica. */
export interface Bill {
  id: string;
  /** Consecutivo: 1 = CC-0001. */
  number: number;
  clientId: string;
  /** Medianoche local del día de expedición. */
  issuedAt: number;
  periodFrom: number;
  periodTo: number;
  status: BillStatus;
  lines: BillLine[];
  total: number;
  notes: string;
  /** Entradas de tiempo cobradas en esta cuenta (se liberan al anularla). */
  entryIds: string[];
  createdAt: number;
  sentAt: number | null;
  paidAt: number | null;
  voidedAt: number | null;
}

export type AccountType = "ahorros" | "corriente";

/** Datos de quien cobra: salen en las cuentas de cobro y en los informes. */
export interface Issuer {
  name: string;
  docType: DocType;
  docNumber: string;
  city: string;
  email: string;
  phone: string;
  bank: string;
  accountType: AccountType;
  accountNumber: string;
  footer: string;
}

export const DEFAULT_FOOTER =
  "Declaro que no soy responsable del impuesto sobre las ventas (IVA) ni estoy obligado a expedir factura electrónica, y que no contraté ni vinculé a dos o más trabajadores para esta actividad. Para la retención en la fuente, solicito aplicar la tabla del artículo 383 del Estatuto Tributario.";

export function defaultIssuer(): Issuer {
  return {
    name: "Daniel Restrepo Ortiz",
    docType: "CC",
    docNumber: "1.036.987.654",
    city: "Medellín",
    email: "daniel@estudio.ejemplo.co",
    phone: "300 123 4567",
    bank: "Banco de Ejemplo",
    accountType: "ahorros",
    accountNumber: "000-123456-78",
    footer: DEFAULT_FOOTER,
  };
}

/** Ajustes iniciales del emisor. Con "Empezar vacío" quedan en blanco (salvo el pie sugerido) para poner los propios. */
export function createIssuer(): Issuer {
  if (!isBlankStart(SLUG)) return defaultIssuer();
  return { name: "", docType: "CC", docNumber: "", city: "", email: "", phone: "", bank: "", accountType: "ahorros", accountNumber: "", footer: DEFAULT_FOOTER };
}

/** Temporizador activo: solo se guarda la marca de inicio, así sobrevive a la recarga. */
export interface RunningTimer {
  taskId: string;
  start: number;
}

export type ProjectColor = "azul" | "menta" | "ambar" | "coral" | "lila" | "gris";

export const PROJECT_COLORS: { id: ProjectColor; label: string; hex: string }[] = [
  { id: "azul", label: "Azul", hex: "#6ea8ff" },
  { id: "menta", label: "Menta", hex: "#48d6b0" },
  { id: "ambar", label: "Ámbar", hex: "#f2c46d" },
  { id: "coral", label: "Coral", hex: "#ff8a8a" },
  { id: "lila", label: "Lila", hex: "#b79bff" },
  { id: "gris", label: "Gris", hex: "#a9b6cb" },
];

export function colorHex(color: ProjectColor) {
  return PROJECT_COLORS.find((c) => c.id === color)?.hex ?? "#a9b6cb";
}

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: Tone }> = {
  active: { label: "Activo", tone: "success" },
  paused: { label: "En pausa", tone: "warning" },
  archived: { label: "Archivado", tone: "neutral" },
};

export const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "Pendiente" },
  { id: "doing", label: "En progreso" },
  { id: "review", label: "En revisión" },
  { id: "done", label: "Hecho" },
];

export function statusLabel(status: TaskStatus) {
  return COLUMNS.find((c) => c.id === status)?.label ?? status;
}

export const PRIORITIES: { id: Priority; label: string; tone: Tone }[] = [
  { id: "urgent", label: "Urgente", tone: "danger" },
  { id: "high", label: "Alta", tone: "warning" },
  { id: "medium", label: "Media", tone: "brand" },
  { id: "low", label: "Baja", tone: "neutral" },
];

export function priorityInfo(priority: Priority) {
  return PRIORITIES.find((p) => p.id === priority) ?? PRIORITIES[2];
}

// ---------- Utilidades de tiempo ----------

/** Lunes 00:00 de la semana actual. */
export function startOfWeek(now = Date.now()) {
  const today = startOfDay(now);
  const weekday = (new Date(today).getDay() + 6) % 7; // lunes = 0
  return today - weekday * DAY_MS;
}

/** "2 h 15 min", "45 min". */
export function formatDuration(ms: number) {
  const totalMin = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Reloj del temporizador: "1:02:09". */
export function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${Math.floor(total / 3600)}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

export function isOverdue(task: Task, now = Date.now()) {
  return task.status !== "done" && task.dueDate != null && task.dueDate < startOfDay(now);
}

export function isDueToday(task: Task, now = Date.now()) {
  return task.status !== "done" && task.dueDate != null && startOfDay(task.dueDate) === startOfDay(now);
}

// ---------- Datos de ejemplo ----------

export interface Seed {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  entries: TimeEntry[];
  bills: Bill[];
}

type TaskRow = [
  projectId: string,
  title: string,
  status: TaskStatus,
  priority: Priority,
  tags: string[],
  due: number | null,
  completedDaysAgo: number | null,
  subtasks: [string, boolean][],
  description?: string,
];

export function createSeed(): Seed {
  const clients: Client[] = [
    { id: "c-altamira", name: "Café Altamira S.A.S.", docType: "NIT", docNumber: "901.234.567-1", contact: "Laura Gómez", email: "laura@cafealtamira.ejemplo.co", city: "Manizales", createdAt: daysFromToday(-95) },
    { id: "c-recaudo", name: "Cooperativa Recaudo+", docType: "NIT", docNumber: "800.456.789-3", contact: "Andrés Pineda", email: "tesoreria@recaudomas.ejemplo.co", city: "Bogotá", createdAt: daysFromToday(-65) },
    { id: "c-bienestar", name: "Clínica Dental Bienestar", docType: "NIT", docNumber: "900.876.543-2", contact: "Paula Ríos", email: "administracion@bienestar.ejemplo.co", city: "Medellín", createdAt: daysFromToday(-45) },
    { id: "c-habitar", name: "Inmobiliaria Habitar Ltda.", docType: "NIT", docNumber: "830.112.233-5", contact: "Jorge Salcedo", email: "jsalcedo@habitar.ejemplo.co", city: "Cali", createdAt: daysFromToday(-125) },
  ];

  const projects: Project[] = [
    {
      id: "p-altamira",
      name: "Tienda Café Altamira",
      clientId: "c-altamira",
      color: "azul",
      status: "active",
      repo: "https://git.ejemplo.co/estudio/cafe-altamira-tienda",
      createdAt: daysFromToday(-90),
      billing: "hourly",
      hourlyRate: 120_000,
      fixedPrice: 0,
    },
    {
      id: "p-recaudo",
      name: "API de pagos Recaudo+",
      clientId: "c-recaudo",
      color: "menta",
      status: "active",
      repo: "https://git.ejemplo.co/estudio/recaudo-api",
      createdAt: daysFromToday(-60),
      billing: "hourly",
      hourlyRate: 150_000,
      fixedPrice: 0,
    },
    {
      id: "p-bienestar",
      name: "App de citas Bienestar",
      clientId: "c-bienestar",
      color: "ambar",
      status: "active",
      repo: "https://git.ejemplo.co/estudio/bienestar-citas",
      createdAt: daysFromToday(-40),
      billing: "fixed",
      hourlyRate: 0,
      fixedPrice: 9_600_000,
    },
    {
      id: "p-habitar",
      name: "Portal Habitar",
      clientId: "c-habitar",
      color: "lila",
      status: "paused",
      repo: "https://git.ejemplo.co/estudio/habitar-portal",
      createdAt: daysFromToday(-120),
      billing: "hourly",
      hourlyRate: 110_000,
      fixedPrice: 0,
    },
  ];
  const hourly = new Set(projects.filter((p) => p.billing === "hourly").map((p) => p.id));

  const rows: TaskRow[] = [
    // Tienda Café Altamira
    ["p-altamira", "Carrito persistente entre sesiones", "doing", "high", ["frontend"], daysFromToday(1), null, [["Guardar carrito en el servidor", true], ["Fusionar carrito anónimo al iniciar sesión", false], ["Pruebas en Safari", false]], "El cliente pierde el carrito al cambiar de dispositivo. Guardarlo ligado a la cuenta."],
    ["p-altamira", "Cupones de descuento por porcentaje", "todo", "medium", ["backend", "pagos"], daysFromToday(6), null, [["Modelo de cupón", false], ["Validación en el checkout", false]]],
    ["p-altamira", "Optimizar imágenes del catálogo", "review", "medium", ["rendimiento"], daysFromToday(0), null, [["Convertir a WebP", true], ["Tamaños responsivos", true]]],
    ["p-altamira", "Corregir total con envío gratis", "todo", "urgent", ["bug", "pagos"], daysFromToday(-2), null, [], "Cuando el pedido supera el mínimo, el total sigue sumando el envío."],
    ["p-altamira", "Página de suscripción mensual", "todo", "low", ["frontend"], daysFromToday(14), null, []],
    ["p-altamira", "Integrar pasarela de pagos", "done", "high", ["pagos", "backend"], daysFromToday(-3), 1, [["Credenciales de prueba", true], ["Webhook de confirmación", true]]],
    ["p-altamira", "Filtros por origen del café", "done", "medium", ["frontend"], null, 3, []],
    ["p-altamira", "Correo de pedido confirmado", "done", "medium", ["backend"], null, 6, []],
    // API de pagos Recaudo+
    ["p-recaudo", "Reintentos con backoff exponencial", "doing", "high", ["backend"], daysFromToday(0), null, [["Política de reintentos", true], ["Tope de 5 intentos", false]], "Los webhooks del banco fallan de vez en cuando; reintentar sin duplicar cobros."],
    ["p-recaudo", "Idempotencia en POST /cobros", "review", "urgent", ["backend", "pagos"], daysFromToday(-1), null, [["Cabecera Idempotency-Key", true], ["Pruebas de concurrencia", true]]],
    ["p-recaudo", "Documentar endpoints de conciliación", "todo", "medium", ["docs"], daysFromToday(3), null, []],
    ["p-recaudo", "Rotar claves del entorno de pruebas", "todo", "high", ["seguridad"], daysFromToday(-4), null, []],
    ["p-recaudo", "Reporte diario de conciliación", "todo", "medium", ["backend"], daysFromToday(9), null, [["Consulta agregada", false], ["Exportar CSV", false]]],
    ["p-recaudo", "Migrar a la nueva versión del ORM", "done", "medium", ["backend"], null, 0, []],
    ["p-recaudo", "Pruebas de carga del endpoint de cobros", "done", "high", ["rendimiento"], null, 2, []],
    ["p-recaudo", "Alertas de errores 5xx", "done", "medium", ["infra"], null, 4, []],
    // App de citas Bienestar
    ["p-bienestar", "Calendario semanal del odontólogo", "doing", "medium", ["frontend"], daysFromToday(4), null, [["Vista semana", true], ["Arrastrar para reprogramar", false]]],
    ["p-bienestar", "Recordatorio de cita por SMS", "todo", "high", ["backend"], daysFromToday(0), null, [], "Enviar 24 h antes. Proveedor de SMS por definir con el cliente."],
    ["p-bienestar", "Formulario de historia clínica", "todo", "medium", ["frontend"], daysFromToday(10), null, []],
    ["p-bienestar", "Revisar accesibilidad del agendamiento", "review", "low", ["frontend", "accesibilidad"], daysFromToday(5), null, []],
    ["p-bienestar", "Login con correo y código", "done", "high", ["backend", "seguridad"], null, 1, []],
    ["p-bienestar", "Pantalla de inicio del paciente", "done", "medium", ["frontend"], null, 5, []],
    ["p-bienestar", "Configurar despliegue continuo", "done", "medium", ["infra"], null, 9, []],
    // Portal Habitar (en pausa)
    ["p-habitar", "Mapa de inmuebles con filtros", "todo", "medium", ["frontend"], daysFromToday(20), null, []],
    ["p-habitar", "Importar inmuebles desde Excel", "done", "medium", ["backend"], null, 12, []],
    ["p-habitar", "Ficha del inmueble con galería", "doing", "low", ["frontend"], null, null, [["Galería", true], ["Mapa", false]]],
  ];

  const tasks: Task[] = rows.map(([projectId, title, status, priority, tags, due, doneAgo, subtasks, description], i) => {
    const createdAt = daysFromToday(-20 + (i % 10), 9, 0);
    const completedAt = doneAgo == null ? null : daysFromToday(-doneAgo, 10 + (i % 7), 15);
    return {
      id: `t-${i + 1}`,
      projectId,
      title,
      description: description ?? "",
      status,
      priority,
      tags,
      dueDate: due,
      subtasks: subtasks.map(([st, done], j) => ({ id: `st-${i + 1}-${j + 1}`, title: st, done })),
      createdAt,
      updatedAt: completedAt ?? createdAt,
      completedAt,
    };
  });

  const notes: Note[] = [
    {
      id: "n-1",
      projectId: "p-recaudo",
      title: "Idempotencia en cobros",
      pinned: true,
      updatedAt: daysFromToday(-1, 16, 20),
      body: [
        "# Idempotencia en cobros",
        "",
        "Cada `POST /cobros` debe llevar la cabecera `Idempotency-Key`. Si la clave ya existe, devolvemos la **misma respuesta** sin cobrar otra vez.",
        "",
        "## Reglas",
        "- La clave vive 24 horas",
        "- Mismo cuerpo, misma respuesta",
        "- Cuerpo distinto con la misma clave: error 422",
        "",
        "```",
        "const previo = await claves.buscar(clave);",
        "if (previo) return previo.respuesta;",
        "```",
      ].join("\n"),
    },
    {
      id: "n-2",
      projectId: "p-altamira",
      title: "Variables de entorno de la tienda",
      pinned: true,
      updatedAt: daysFromToday(-3, 11, 5),
      body: [
        "# Variables de entorno",
        "",
        "Nunca subir el archivo `.env` al repositorio. Las de producción las tiene **el cliente** en su panel de hosting.",
        "",
        "```",
        "PASARELA_LLAVE_PUBLICA=pk_prueba_xxx",
        "PASARELA_LLAVE_SECRETA=sk_prueba_xxx",
        "URL_WEBHOOK=https://tienda.ejemplo.co/api/webhook",
        "```",
      ].join("\n"),
    },
    {
      id: "n-3",
      projectId: "p-bienestar",
      title: "Reunión con la clínica",
      pinned: true,
      updatedAt: daysFromToday(-2, 15, 40),
      body: [
        "## Acuerdos",
        "1. Los recordatorios salen 24 h antes de la cita",
        "2. El paciente puede cancelar hasta 4 h antes",
        "3. Revisión de avances cada viernes",
        "",
        "Pendiente: el cliente confirma el **proveedor de SMS** antes del lunes.",
      ].join("\n"),
    },
    {
      id: "n-4",
      projectId: "p-altamira",
      title: "Pasos de despliegue",
      pinned: false,
      updatedAt: daysFromToday(-6, 18, 0),
      body: [
        "# Despliegue a producción",
        "",
        "- Correr las pruebas",
        "- Construir la versión",
        "- Subir y limpiar caché",
        "",
        "```",
        "npm run test",
        "npm run build",
        "npm run deploy -- --prod",
        "```",
      ].join("\n"),
    },
    {
      id: "n-5",
      projectId: "p-recaudo",
      title: "Errores comunes del banco",
      pinned: false,
      updatedAt: daysFromToday(-8, 10, 30),
      body: [
        "## Códigos que reintentamos",
        "- `503` servicio no disponible",
        "- `504` tiempo de espera agotado",
        "",
        "Los `4xx` **no** se reintentan: se registran y se avisa al cliente.",
      ].join("\n"),
    },
    {
      id: "n-6",
      projectId: "p-habitar",
      title: "Por qué está en pausa",
      pinned: false,
      updatedAt: daysFromToday(-15, 9, 10),
      body: "El cliente está renegociando el alcance del mapa. Retomamos cuando aprueben la nueva cotización.\n\nÚltimo avance: importación desde Excel **terminada**.",
    },
  ];

  // Entradas de tiempo de las últimas dos semanas, en días hábiles, sobre tareas abiertas o recién hechas.
  const workable = tasks.filter((t) => t.projectId !== "p-habitar");
  const entries: TimeEntry[] = [];
  const now = Date.now();
  let k = 0;
  for (let d = -13; d <= 0; d++) {
    const day = daysFromToday(d);
    const weekday = new Date(day).getDay();
    if (weekday === 0 || weekday === 6) continue;
    const slots: [number, number, number][] = [
      [8, 30, 90 + (k % 4) * 15],
      [11, 0, 60 + (k % 3) * 20],
      [14, 30, 75 + (k % 5) * 20],
    ];
    for (const [h, m, minutes] of slots) {
      if ((k + d) % 5 === 0 && h === 14) {
        k++;
        continue;
      }
      const task = workable[(k * 7) % workable.length];
      const start = daysFromToday(d, h, m);
      const end = start + minutes * 60_000;
      k++;
      if (end > now) continue;
      entries.push({ id: `e-${entries.length + 1}`, projectId: task.projectId, taskId: task.id, start, end, note: "", billable: hourly.has(task.projectId), billId: null });
    }
  }
  entries.push({
    id: `e-${entries.length + 1}`,
    projectId: "p-bienestar",
    taskId: null,
    start: daysFromToday(-5, 17, 30),
    end: daysFromToday(-5, 18, 15),
    note: "Llamada con la clínica",
    billable: false,
    billId: null,
  });

  // Dos cuentas de cobro de ejemplo: el anticipo del proyecto de precio fijo (pagada) y la primera semana de
  // horas de Recaudo+ (enviada, sin pagar). Sus horas quedan marcadas como cobradas.
  const bills: Bill[] = [];
  const advanceIssued = daysFromToday(-24);
  bills.push({
    id: "b-1",
    number: 1,
    clientId: "c-bienestar",
    issuedAt: advanceIssued,
    periodFrom: daysFromToday(-40),
    periodTo: advanceIssued,
    status: "paid",
    lines: [{ id: "bl-1", kind: "manual", projectId: "p-bienestar", projectName: "App de citas Bienestar", description: "Anticipo del 50 % del desarrollo", minutes: 0, rate: 0, amount: 4_800_000 }],
    total: 4_800_000,
    notes: "",
    entryIds: [],
    createdAt: daysFromToday(-24, 10),
    sentAt: daysFromToday(-24, 10, 30),
    paidAt: daysFromToday(-18, 9),
    voidedAt: null,
  });
  const from = daysFromToday(-13);
  const to = daysFromToday(-7);
  const firstWeek = entries.filter((e) => e.projectId === "p-recaudo" && e.billable && e.start >= from && e.start < to + DAY_MS);
  if (firstWeek.length) {
    const { lines } = buildTimeLines(firstWeek, projects, tasks);
    bills.push({
      id: "b-2",
      number: 2,
      clientId: "c-recaudo",
      issuedAt: daysFromToday(-6),
      periodFrom: from,
      periodTo: to,
      status: "sent",
      lines,
      total: billTotal(lines),
      notes: "",
      entryIds: firstWeek.map((e) => e.id),
      createdAt: daysFromToday(-6, 9),
      sentAt: daysFromToday(-6, 9, 20),
      paidAt: null,
      voidedAt: null,
    });
    const billed = new Set(firstWeek.map((e) => e.id));
    for (const e of entries) if (billed.has(e.id)) e.billId = "b-2";
  }

  return { clients, projects, tasks, notes, entries: entries.sort((a, b) => b.start - a.start), bills };
}

/** "Empezar vacío": sin registros de negocio. Los ajustes del emisor van aparte (`createIssuer`). */
export function createBlankSeed(): Seed {
  return { clients: [], projects: [], tasks: [], notes: [], entries: [], bills: [] };
}

function readStored<T>(name: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(storageKey(SLUG, name));
    return raw == null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

/**
 * Datos iniciales de la app. Si hay datos de la v1 (proyectos con el cliente como texto) y aún no de la v2, los
 * migra: un cliente por cada nombre distinto, cada proyecto ligado a su cliente y cobrado por hora (sin tarifa
 * hasta que se defina), y las entradas de tiempo facturables y sin cobrar. Si no hay nada guardado, usa los datos
 * de ejemplo o, con "Empezar vacío", ninguno.
 */
export function createInitialData(): Seed & { migrated: boolean } {
  const legacyProjects = readStored<LegacyProject[]>("proyectos.v1");
  if (Array.isArray(legacyProjects) && readStored(STORES.projects) === undefined) {
    const now = Date.now();
    const clients: Client[] = [];
    const byName = new Map<string, Client>();
    for (const p of legacyProjects) {
      const name = (p.client ?? "").trim() || "Cliente sin nombre";
      const key = name.toLowerCase();
      if (!byName.has(key)) {
        const client: Client = { id: `c-m${clients.length + 1}`, name, docType: "NIT", docNumber: "", contact: "", email: "", city: "", createdAt: now };
        byName.set(key, client);
        clients.push(client);
      }
    }
    const projects: Project[] = legacyProjects.map((p) => ({
      id: p.id,
      name: p.name,
      clientId: byName.get(((p.client ?? "").trim() || "Cliente sin nombre").toLowerCase())!.id,
      color: p.color,
      status: p.status,
      repo: p.repo ?? "",
      createdAt: p.createdAt,
      billing: "hourly",
      hourlyRate: 0,
      fixedPrice: 0,
    }));
    const legacyEntries = readStored<Omit<TimeEntry, "billable" | "billId">[]>("tiempo.v1") ?? [];
    const entries: TimeEntry[] = legacyEntries.map((e) => ({ ...e, billable: true, billId: null }));
    // Las tareas y las notas no cambiaron de forma: siguen en sus almacenes y no se tocan.
    return { clients, projects, entries, bills: [], tasks: [], notes: [], migrated: true };
  }
  return { ...(isBlankStart(SLUG) ? createBlankSeed() : createSeed()), migrated: false };
}

/** Borra los almacenes de la v1 ya migrados, para que la copia de seguridad no los arrastre. */
export function dropLegacyStores() {
  try {
    window.localStorage.removeItem(storageKey(SLUG, "proyectos.v1"));
    window.localStorage.removeItem(storageKey(SLUG, "tiempo.v1"));
  } catch {
    // Sin almacenamiento: nada que borrar.
  }
}
