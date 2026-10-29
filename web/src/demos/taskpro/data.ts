import { DAY_MS, daysFromToday, startOfDay } from "@/demos/kit/format";
import type { Tone } from "@/demos/kit/ui";

export const SLUG = "taskpro";

export type ProjectStatus = "active" | "paused" | "archived";
export type TaskStatus = "todo" | "doing" | "review" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Project {
  id: string;
  name: string;
  client: string;
  color: ProjectColor;
  status: ProjectStatus;
  /** Solo texto: la demo nunca abre el repositorio. */
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
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  entries: TimeEntry[];
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
  const projects: Project[] = [
    {
      id: "p-altamira",
      name: "Tienda Café Altamira",
      client: "Café Altamira S.A.S.",
      color: "azul",
      status: "active",
      repo: "https://git.ejemplo.co/estudio/cafe-altamira-tienda",
      createdAt: daysFromToday(-90),
    },
    {
      id: "p-recaudo",
      name: "API de pagos Recaudo+",
      client: "Cooperativa Recaudo+",
      color: "menta",
      status: "active",
      repo: "https://git.ejemplo.co/estudio/recaudo-api",
      createdAt: daysFromToday(-60),
    },
    {
      id: "p-bienestar",
      name: "App de citas Bienestar",
      client: "Clínica Dental Bienestar",
      color: "ambar",
      status: "active",
      repo: "https://git.ejemplo.co/estudio/bienestar-citas",
      createdAt: daysFromToday(-40),
    },
    {
      id: "p-habitar",
      name: "Portal Habitar",
      client: "Inmobiliaria Habitar Ltda.",
      color: "lila",
      status: "paused",
      repo: "https://git.ejemplo.co/estudio/habitar-portal",
      createdAt: daysFromToday(-120),
    },
  ];

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
      entries.push({ id: `e-${entries.length + 1}`, projectId: task.projectId, taskId: task.id, start, end, note: "" });
    }
  }
  entries.push({
    id: `e-${entries.length + 1}`,
    projectId: "p-bienestar",
    taskId: null,
    start: daysFromToday(-5, 17, 30),
    end: daysFromToday(-5, 18, 15),
    note: "Llamada con la clínica",
  });

  return { projects, tasks, notes, entries: entries.sort((a, b) => b.start - a.start) };
}
