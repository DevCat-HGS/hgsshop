import { DAY_MS, daysFromToday, formatDateLong, formatTime, startOfDay } from "@/demos/kit/format";
import type { Tone } from "@/demos/kit/ui";

/** Tipos, semilla y reglas de negocio de Clientia (sin componentes). */

export const SLUG = "clientia";
export const BUSINESS = "Estudio Brisa";
export const SLOT = 30;

export type Channel = "whatsapp" | "email" | "none";
export type ApptStatus = "scheduled" | "attended" | "no_show" | "cancelled";
export type ReminderLead = "24" | "3" | "both";

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  channel: Channel;
}

export interface Service {
  id: string;
  name: string;
  /** Minutos, múltiplo de 30. */
  duration: number;
  price: number;
  tone: Tone;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  /** Días que atiende, como `Date.getDay()` (0 = domingo). */
  days: number[];
}

export interface DaySchedule {
  open: boolean;
  /** Minutos desde medianoche. */
  start: number;
  end: number;
  hasBreak: boolean;
  breakStart: number;
  breakEnd: number;
}

/** Índice = `Date.getDay()`. */
export type Schedule = DaySchedule[];

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  /** Copias del servicio al agendar: el historial no cambia si luego se edita o borra el servicio. */
  serviceName: string;
  duration: number;
  price: number;
  professionalId: string;
  start: number;
  note: string;
  status: ApptStatus;
}

export interface ReminderSettings {
  enabled: boolean;
  lead: ReminderLead;
  template: string;
}

export const CHANNEL_LABEL: Record<Channel, string> = { whatsapp: "WhatsApp", email: "Correo", none: "Ninguno" };
export const STATUS_LABEL: Record<ApptStatus, string> = { scheduled: "Agendada", attended: "Asistió", no_show: "No asistió", cancelled: "Cancelada" };
export const STATUS_TONE: Record<ApptStatus, Tone> = { scheduled: "brand", attended: "success", no_show: "danger", cancelled: "neutral" };
export const LEAD_LABEL: Record<ReminderLead, string> = { "24": "24 horas antes", "3": "3 horas antes", both: "24 y 3 horas antes" };

export const TONES: { id: Tone; label: string }[] = [
  { id: "brand", label: "Azul" },
  { id: "success", label: "Menta" },
  { id: "warning", label: "Arena" },
  { id: "danger", label: "Coral" },
  { id: "neutral", label: "Gris" },
];

/** Clases del bloque de cita en la agenda según el tono del servicio. */
export const TONE_BLOCK: Record<Tone, string> = {
  brand: "border-l-brand bg-[color-mix(in_srgb,var(--color-brand)_18%,var(--color-bg))]",
  success: "border-l-success bg-[color-mix(in_srgb,var(--color-success)_16%,var(--color-bg))]",
  warning: "border-l-warning bg-[color-mix(in_srgb,var(--color-warning)_16%,var(--color-bg))]",
  danger: "border-l-danger bg-[color-mix(in_srgb,var(--color-danger)_16%,var(--color-bg))]",
  neutral: "border-l-text-subtle bg-surface-hover",
};

export const TONE_DOT: Record<Tone, string> = {
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-text-subtle",
};

export const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
/** Lunes a domingo, para listar los días en orden local. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const DEFAULT_TEMPLATE =
  "Hola {cliente}, te recordamos tu cita de {servicio} en Estudio Brisa el {fecha} a las {hora}. Si no puedes asistir, respóndenos para reprogramar.";

// ---------- Fechas y horas ----------

/** Suma días respetando la hora local. */
export function addDays(value: number, days: number) {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/** Lunes de la semana de `value`, a medianoche. */
export function startOfWeek(value: number) {
  const day = new Date(value).getDay();
  return startOfDay(addDays(value, -((day + 6) % 7)));
}

export function minutesOfDay(value: number) {
  const d = new Date(value);
  return d.getHours() * 60 + d.getMinutes();
}

export function atMinutes(day: number, minutes: number) {
  const d = new Date(startOfDay(day));
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d.getTime();
}

/** "9:30 a. m." a partir de minutos desde medianoche. */
export function minutesLabel(minutes: number) {
  return formatTime(atMinutes(Date.now(), minutes));
}

export function durationLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function apptEnd(a: Pick<Appointment, "start" | "duration">) {
  return a.start + a.duration * 60_000;
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

// ---------- Reglas de agenda ----------

export interface SlotRequest {
  id?: string;
  clientId: string;
  professionalId: string;
  start: number;
  duration: number;
}

/** Devuelve un mensaje de error si la cita no se puede agendar; `null` si es válida. */
export function validateSlot(
  req: SlotRequest,
  ctx: { schedule: Schedule; professionals: Professional[]; appointments: Appointment[]; clients: Client[]; now: number },
  { allowPast = false }: { allowPast?: boolean } = {},
): string | null {
  const day = new Date(req.start).getDay();
  const hours = ctx.schedule[day];
  const begin = minutesOfDay(req.start);
  const finish = begin + req.duration;
  const pro = ctx.professionals.find((p) => p.id === req.professionalId);

  if (!allowPast && req.start < ctx.now) return "No se pueden agendar citas en el pasado. Elige una fecha y hora futuras.";
  if (!hours.open) return `${BUSINESS} no atiende los ${WEEKDAYS[day].toLowerCase()}.`;
  if (pro && !pro.days.includes(day)) return `${pro.name} no atiende los ${WEEKDAYS[day].toLowerCase()}.`;
  if (begin < hours.start || finish > hours.end)
    return `La cita queda fuera del horario de atención (los ${WEEKDAYS[day].toLowerCase()}, de ${minutesLabel(hours.start)} a ${minutesLabel(hours.end)}).`;
  if (hours.hasBreak && begin < hours.breakEnd && finish > hours.breakStart)
    return `La cita cruza el descanso (de ${minutesLabel(hours.breakStart)} a ${minutesLabel(hours.breakEnd)}).`;

  const end = req.start + req.duration * 60_000;
  const active = ctx.appointments.filter((a) => a.id !== req.id && a.status !== "cancelled" && a.start < end && apptEnd(a) > req.start);
  const clash = active.find((a) => a.professionalId === req.professionalId);
  if (clash) {
    const who = ctx.clients.find((c) => c.id === clash.clientId)?.name ?? "otro cliente";
    return `${pro?.name ?? "La profesional"} ya tiene una cita de ${formatTime(clash.start)} a ${formatTime(apptEnd(clash))} con ${who}.`;
  }
  const clientClash = active.find((a) => a.clientId === req.clientId);
  if (clientClash) {
    const other = ctx.professionals.find((p) => p.id === clientClash.professionalId)?.name ?? "otra profesional";
    return `El cliente ya tiene una cita a esa hora (${formatTime(clientClash.start)} con ${other}).`;
  }
  return null;
}

/** Minutos disponibles de una profesional en un día (horario menos descanso). */
export function availableMinutes(schedule: Schedule, pro: Professional, day: number) {
  const weekday = new Date(day).getDay();
  const h = schedule[weekday];
  if (!h.open || !pro.days.includes(weekday)) return 0;
  return h.end - h.start - (h.hasBreak ? h.breakEnd - h.breakStart : 0);
}

// ---------- Recordatorios ----------

export interface Reminder {
  id: string;
  appointment: Appointment;
  client: Client | undefined;
  lead: 24 | 3;
  sendAt: number;
  state: "scheduled" | "sent" | "skipped";
}

export function renderTemplate(template: string, a: Appointment, client: Client | undefined, pro: Professional | undefined) {
  return template
    .replaceAll("{cliente}", client ? firstName(client.name) : "cliente")
    .replaceAll("{servicio}", a.serviceName.toLowerCase())
    .replaceAll("{fecha}", formatDateLong(a.start))
    .replaceAll("{hora}", formatTime(a.start))
    .replaceAll("{profesional}", pro ? firstName(pro.name) : "")
    // "a las 3:00 p. m.." → un solo punto.
    .replace(/m\.\./g, "m.");
}

/** Recordatorios de las citas próximas según la configuración y el canal de cada cliente. */
export function buildReminders(settings: ReminderSettings, appointments: Appointment[], clients: Client[], now: number): Reminder[] {
  if (!settings.enabled) return [];
  const leads: (24 | 3)[] = settings.lead === "both" ? [24, 3] : [Number(settings.lead) as 24 | 3];
  const list: Reminder[] = [];
  for (const a of appointments) {
    if (a.status !== "scheduled" || a.start <= now) continue;
    const client = clients.find((c) => c.id === a.clientId);
    for (const lead of leads) {
      const sendAt = a.start - lead * 3_600_000;
      const state = !client || client.channel === "none" ? "skipped" : sendAt <= now ? "sent" : "scheduled";
      list.push({ id: `${a.id}-${lead}`, appointment: a, client, lead, sendAt, state });
    }
  }
  return list.sort((x, y) => x.sendAt - y.sendAt);
}

// ---------- Semilla ----------

/** Generador pseudoaleatorio con semilla fija: la demo se ve igual en cada reinicio. */
function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Seed {
  clients: Client[];
  services: Service[];
  professionals: Professional[];
  schedule: Schedule;
  appointments: Appointment[];
  reminders: ReminderSettings;
}

const weekday = (start: number, end: number): DaySchedule => ({ open: true, start, end, hasBreak: true, breakStart: 12 * 60, breakEnd: 13 * 60 });

export function buildSeed(): Seed {
  const now = Date.now();
  const schedule: Schedule = [
    { open: false, start: 9 * 60, end: 13 * 60, hasBreak: false, breakStart: 12 * 60, breakEnd: 13 * 60 },
    weekday(8 * 60, 18 * 60),
    weekday(8 * 60, 18 * 60),
    weekday(8 * 60, 18 * 60),
    weekday(8 * 60, 18 * 60),
    weekday(8 * 60, 18 * 60),
    { open: true, start: 8 * 60, end: 14 * 60, hasBreak: false, breakStart: 11 * 60, breakEnd: 11 * 60 + 30 },
  ];

  const professionals: Professional[] = [
    { id: "p-1", name: "Valentina Ríos", role: "Esteticista", days: [1, 2, 3, 4, 5] },
    { id: "p-2", name: "Daniela Ortiz", role: "Cosmetóloga y masajista", days: [2, 3, 4, 5, 6] },
  ];

  const services: Service[] = [
    { id: "s-1", name: "Limpieza facial profunda", duration: 60, price: 120_000, tone: "brand" },
    { id: "s-2", name: "Masaje relajante", duration: 90, price: 150_000, tone: "success" },
    { id: "s-3", name: "Manicure y pedicure", duration: 60, price: 70_000, tone: "warning" },
    { id: "s-4", name: "Depilación con cera", duration: 30, price: 45_000, tone: "danger" },
    { id: "s-5", name: "Valoración de piel", duration: 30, price: 40_000, tone: "neutral" },
  ];

  const clients: Client[] = [
    { id: "c-1", name: "Laura Gómez Pardo", phone: "300 555 0101", email: "laura.gomez@ejemplo.com", notes: "Piel sensible: evitar exfoliantes fuertes.", channel: "whatsapp" },
    { id: "c-2", name: "Andrés Rojas", phone: "301 555 0102", email: "andres.rojas@ejemplo.com", notes: "Prefiere citas temprano.", channel: "whatsapp" },
    { id: "c-3", name: "Camila Torres", phone: "310 555 0103", email: "camila.torres@ejemplo.com", notes: "Llegó por recomendación de Laura.", channel: "email" },
    { id: "c-4", name: "Jorge Méndez", phone: "312 555 0104", email: "", notes: "Paga con transferencia.", channel: "none" },
    { id: "c-5", name: "Natalia Herrera", phone: "315 555 0105", email: "natalia.h@ejemplo.com", notes: "", channel: "whatsapp" },
    { id: "c-6", name: "Sebastián Vargas", phone: "316 555 0106", email: "sebas.vargas@ejemplo.com", notes: "Alergia al látex.", channel: "email" },
    { id: "c-7", name: "Mariana Castaño", phone: "318 555 0107", email: "mariana.c@ejemplo.com", notes: "Plan de 4 sesiones de limpieza facial.", channel: "whatsapp" },
    { id: "c-8", name: "Felipe Ospina", phone: "320 555 0108", email: "", notes: "", channel: "whatsapp" },
    { id: "c-9", name: "Isabela Moreno", phone: "321 555 0109", email: "isabela.moreno@ejemplo.com", notes: "Cumpleaños en diciembre.", channel: "email" },
    { id: "c-10", name: "Carolina Duque", phone: "304 555 0110", email: "caro.duque@ejemplo.com", notes: "", channel: "whatsapp" },
    { id: "c-11", name: "Tomás Restrepo", phone: "305 555 0111", email: "", notes: "Viene con su pareja los sábados.", channel: "none" },
    { id: "c-12", name: "Paula Quintero", phone: "311 555 0112", email: "paula.q@ejemplo.com", notes: "", channel: "whatsapp" },
  ];

  const rand = mulberry32(20_241);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const appointments: Appointment[] = [];
  const ctx = { schedule, professionals, appointments, clients, now };
  let pastIndex = 0;

  for (let offset = -21; offset <= 13; offset++) {
    const day = daysFromToday(offset);
    const dow = new Date(day).getDay();
    const hours = schedule[dow];
    if (!hours.open) continue;
    // Más citas cerca de hoy, para que la semana actual se vea con movimiento.
    const target = offset === 0 ? 4 : Math.abs(offset) <= 4 ? 2 : 1;
    let placed = 0;
    for (let attempt = 0; attempt < 30 && placed < target; attempt++) {
      const pro = pick(professionals.filter((p) => p.days.includes(dow)));
      const service = pick(services);
      const slots = (hours.end - hours.start) / SLOT;
      const start = atMinutes(day, hours.start + Math.floor(rand() * slots) * SLOT);
      const client = pick(clients);
      const req = { clientId: client.id, professionalId: pro.id, start, duration: service.duration };
      if (validateSlot(req, ctx, { allowPast: true })) continue;

      let status: ApptStatus = "scheduled";
      if (start < now) {
        // Las de hoy que ya pasaron quedan "por marcar" para mostrar ese flujo.
        if (offset === 0) status = placed === 0 ? "attended" : "scheduled";
        else if (offset >= -2 && placed === 0) status = "scheduled";
        else status = pastIndex % 6 === 2 ? "no_show" : pastIndex % 13 === 7 ? "cancelled" : "attended";
        pastIndex++;
      }
      appointments.push({
        id: `a-${appointments.length + 1}`,
        clientId: client.id,
        serviceId: service.id,
        serviceName: service.name,
        duration: service.duration,
        price: service.price,
        professionalId: pro.id,
        start,
        note: "",
        status,
      });
      placed++;
    }
  }
  appointments.sort((a, b) => a.start - b.start);
  const withNote = appointments.find((a) => a.start > now);
  if (withNote) withNote.note = "Primera sesión del plan; llegar 10 minutos antes.";

  return { clients, services, professionals, schedule, appointments, reminders: { enabled: true, lead: "both", template: DEFAULT_TEMPLATE } };
}

/** Días desde hoy (negativo = pasado), para textos relativos. */
export function dayDiff(value: number, now: number) {
  return Math.round((startOfDay(value) - startOfDay(now)) / DAY_MS);
}

/** Qué cita se está creando o editando en el diálogo de cita. */
export type Editor = { mode: "new"; start?: number; professionalId?: string; clientId?: string } | { mode: "edit"; id: string };

/** Opciones de hora de 6:00 a 21:30, cada 30 minutos. */
export const TIME_OPTIONS = Array.from({ length: 32 }, (_, i) => 6 * 60 + i * SLOT);

/** Resumen de un cliente derivado de sus citas. */
export function clientStats(clientId: string, appointments: Appointment[], now: number) {
  const mine = appointments.filter((a) => a.clientId === clientId);
  const upcoming = mine.filter((a) => a.start > now && a.status === "scheduled").sort((a, b) => a.start - b.start);
  const history = mine.filter((a) => a.start <= now || a.status !== "scheduled").filter((a) => !upcoming.includes(a)).sort((a, b) => b.start - a.start);
  const attended = mine.filter((a) => a.status === "attended");
  const noShows = mine.filter((a) => a.status === "no_show").length;
  const marked = attended.length + noShows;
  return {
    upcoming,
    history,
    spent: attended.reduce((sum, a) => sum + a.price, 0),
    attended: attended.length,
    noShows,
    noShowRate: marked ? noShows / marked : 0,
    lastVisit: attended.reduce((max, a) => Math.max(max, a.start), 0),
  };
}

export function percent(value: number) {
  return `${Math.round(value * 100)} %`;
}
