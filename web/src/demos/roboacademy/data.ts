import { DAY_MS, daysFromToday, startOfDay } from "@/demos/kit/format";
import { isBlankStart } from "@/demos/kit/storage";

export const SLUG = "roboacademy";

export interface Module {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  /** Día de la semana como `Date.getDay()`: 0 domingo … 6 sábado. */
  day: number;
  /** Hora de inicio "HH:MM" (24 h). */
  time: string;
  teacher: string;
  capacity: number;
  /** Mensualidad en COP. */
  fee: number;
  /** Edades recomendadas (incluidas): orientan el formulario de inscripción. */
  minAge: number;
  maxAge: number;
  modules: Module[];
}

export type StudentStatus = "activo" | "retirado";

export interface Student {
  id: string;
  name: string;
  age: number;
  guardian: string;
  guardianPhone: string;
  /** Opcional: los estudiantes creados antes de las inscripciones no lo tienen. */
  guardianEmail?: string;
  groupId: string;
  joinedAt: number;
  status: StudentStatus;
  /** Posición en la lista de módulos del grupo; igual a su longitud = ruta completada. */
  moduleIndex: number;
}

export type Mark = "presente" | "ausente" | "excusa";

export interface Session {
  /** `<groupId>@<AAAA-MM-DD>`: una sesión por grupo y fecha. */
  id: string;
  groupId: string;
  date: number;
  marks: Record<string, Mark>;
}

export interface Note {
  id: string;
  studentId: string;
  date: number;
  text: string;
}

export type PayMethod = "efectivo" | "transferencia" | "nequi";

export interface Payment {
  id: string;
  studentId: string;
  /** Mes "AAAA-MM". */
  month: string;
  amount: number;
  paidAt: number;
  method: PayMethod;
  /** Número consecutivo del recibo de caja (RC-0001…). Nunca se reutiliza. */
  receipt: number;
}

/** Recibo de un pago deshecho: el número queda anulado para que la numeración no tenga huecos sin explicar. */
export interface VoidedReceipt {
  receipt: number;
  studentId: string;
  studentName: string;
  month: string;
  amount: number;
  paidAt: number;
  voidedAt: number;
}

/* ---------- Inscripciones ---------- */

export type ApplicantStatus = "nuevo" | "contactado" | "prueba" | "inscrito" | "descartado";

export const APPLICANT_STATUS: { id: ApplicantStatus; label: string; tone: "brand" | "neutral" | "warning" | "success" | "danger" }[] = [
  { id: "nuevo", label: "Nuevo", tone: "warning" },
  { id: "contactado", label: "Contactado", tone: "neutral" },
  { id: "prueba", label: "Clase de prueba", tone: "brand" },
  { id: "inscrito", label: "Inscrito", tone: "success" },
  { id: "descartado", label: "Descartado", tone: "danger" },
];

export const SOURCES = ["Instagram", "Facebook", "Google", "Recomendación de otro acudiente", "Volante o feria escolar", "Otro"];

export const DISCARD_REASONS = ["El horario no le sirve", "Precio", "No respondió", "Se inscribió en otro lugar", "Edad fuera de rango", "Otro"];

/** Entrada del seguimiento: una nota escrita a mano o un cambio de estado. */
export interface FollowUp {
  id: string;
  at: number;
  kind: "nota" | "estado";
  text: string;
}

export interface Applicant {
  id: string;
  childName: string;
  age: number;
  guardian: string;
  phone: string;
  email: string;
  /** Grupo de interés; vacío si el acudiente pidió recomendación. */
  groupId: string;
  source: string;
  message: string;
  createdAt: number;
  status: ApplicantStatus;
  /** Fecha y hora de la clase de prueba. */
  trialAt: number | null;
  discardReason: string;
  /** Estudiante creado al inscribir. */
  studentId: string | null;
  log: FollowUp[];
}

export function statusInfo(status: ApplicantStatus) {
  return APPLICANT_STATUS.find((x) => x.id === status)!;
}

/** Grupos recomendados para una edad. */
export function groupsForAge(groups: Group[], age: number) {
  return groups.filter((g) => age >= g.minAge && age <= g.maxAge);
}

/* ---------- Ajustes de la academia ---------- */

export interface Settings {
  name: string;
  nit: string;
  address: string;
  city: string;
  phone: string;
  /** Texto al pie de recibos y reportes. */
  footer: string;
}

export const DEFAULT_SETTINGS: Settings = {
  name: "Academia Circuito",
  nit: "901.456.789-3",
  address: "Calle 10 # 43D-25, oficina 302",
  city: "Medellín",
  phone: "6043221188",
  footer: "Gracias por confiar en nosotros. Las mensualidades se pagan dentro de los primeros 10 días de cada mes.",
};

export const FOOTER_MAX = 300;

/** Valida los ajustes; devuelve el mensaje de error o null. */
export function validateSettings(s: Settings): string | null {
  if (s.name.trim().length < 3) return "El nombre de la academia debe tener al menos 3 caracteres.";
  if (s.name.trim().length > 60) return "El nombre de la academia no puede pasar de 60 caracteres.";
  // NIT colombiano: 9 dígitos y dígito de verificación, con o sin puntos y guion ("901.456.789-3").
  if (s.nit.trim() && !/^\d{1,3}(\.?\d{3}){2}-?\d$/.test(s.nit.trim())) return 'El NIT debe tener 9 dígitos y el de verificación, por ejemplo "901.456.789-3".';
  const phone = digitsOnly(s.phone);
  if (s.phone.trim() && (phone.length < 7 || phone.length > 10)) return "El teléfono debe tener entre 7 y 10 dígitos.";
  if (s.footer.length > FOOTER_MAX) return `El texto del pie no puede pasar de ${FOOTER_MAX} caracteres.`;
  return null;
}

/** Día del mes hasta el que se paga la mensualidad sin quedar en mora. */
export const DUE_DAY = 10;

export function receiptLabel(n: number) {
  return `RC-${String(n).padStart(4, "0")}`;
}
export const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const PAY_METHODS: { id: PayMethod; label: string }[] = [
  { id: "efectivo", label: "Efectivo" },
  { id: "transferencia", label: "Transferencia" },
  { id: "nequi", label: "Nequi" },
];
export const MARK_LABEL: Record<Mark, string> = { presente: "Presente", ausente: "Ausente", excusa: "Excusa" };

/* ---------- Fechas, meses y sesiones ---------- */

const pad = (n: number) => String(n).padStart(2, "0");

export function dateKey(value: number) {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function sessionId(groupId: string, date: number) {
  return `${groupId}@${dateKey(date)}`;
}

export function monthKey(value: number) {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthStart(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).getTime();
}

/** Último instante del mes. */
export function monthEnd(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 1).getTime() - 1;
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1).getTime());
}

const monthFmt = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" });
export function monthLabel(month: string) {
  const text = monthFmt.format(monthStart(month));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Sábados, 9:00 a. m." */
export function scheduleLabel(group: Pick<Group, "day" | "time">) {
  return `${WEEKDAYS[group.day]}${group.day === 0 || group.day === 6 ? "s" : ""}, ${timeLabel(group.time)}`;
}

export function timeLabel(time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" }).format(d);
}

/** Fechas (medianoche) en que el grupo tiene clase entre `from` y `to`, ambas incluidas, de la más reciente a la más antigua. */
export function sessionDates(group: Group, from: number, to: number) {
  const dates: number[] = [];
  let d = startOfDay(to);
  while (new Date(d).getDay() !== group.day) d = startOfDay(d - DAY_MS / 2);
  for (; d >= startOfDay(from); d = startOfDay(d - 6.5 * DAY_MS)) dates.push(d);
  return dates;
}

/** Fecha y hora exacta de una clase. */
export function sessionDateTime(group: Group, date: number) {
  const [h, m] = group.time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/** "310 452 8831" */
export function formatPhone(value: string) {
  const d = digitsOnly(value);
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d;
}

/* ---------- Asistencia ---------- */

export interface AttendanceSummary {
  presente: number;
  ausente: number;
  excusa: number;
  /** Porcentaje de presencia sin contar excusas; null si no hay sesiones con registro. */
  rate: number | null;
}

export function summarize(sessions: Session[], studentId: string, from = -Infinity, to = Infinity): AttendanceSummary {
  const s: AttendanceSummary = { presente: 0, ausente: 0, excusa: 0, rate: null };
  for (const session of sessions) {
    if (session.date < from || session.date > to) continue;
    const mark = session.marks[studentId];
    if (mark) s[mark]++;
  }
  const counted = s.presente + s.ausente;
  s.rate = counted ? Math.round((s.presente / counted) * 100) : null;
  return s;
}

export const RISK_THRESHOLD = 70;
export const RISK_WINDOW_DAYS = 56;

/** Estudiantes que cuentan en el cupo. */
export function activeIn(students: Student[], groupId: string) {
  return students.filter((s) => s.groupId === groupId && s.status === "activo");
}

/** Quién debe la mensualidad de un mes: activos que ya habían ingresado, más quien haya pagado ese mes. */
export function billedStudents(students: Student[], payments: Payment[], month: string) {
  const end = monthEnd(month);
  return students.filter((s) => (s.status === "activo" && s.joinedAt <= end) || payments.some((p) => p.studentId === s.id && p.month === month));
}

/* ---------- Datos de ejemplo ---------- */

/** Generador pseudoaleatorio con semilla: la demo se siembra igual cada vez. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mods = (prefix: string, names: string[]) => names.map((name, i) => ({ id: `${prefix}-m${i + 1}`, name }));

function seedGroups(): Group[] {
  return [
    {
      id: "g-inicial",
      name: "Robótica inicial",
      day: 6,
      time: "09:00",
      teacher: "Laura Méndez",
      capacity: 8,
      fee: 180_000,
      minAge: 7,
      maxAge: 10,
      modules: mods("ini", ["Motores y engranajes", "Sensores de luz", "Sensores de distancia", "Proyecto: carro seguidor de línea"]),
    },
    {
      id: "g-bloques",
      name: "Programación con bloques",
      day: 3,
      time: "16:00",
      teacher: "Andrés Rojas",
      capacity: 6,
      fee: 160_000,
      minAge: 9,
      maxAge: 12,
      modules: mods("blo", ["Secuencias", "Ciclos", "Condicionales", "Variables", "Proyecto: videojuego"]),
    },
    {
      id: "g-avanzada",
      name: "Robótica avanzada",
      day: 6,
      time: "11:00",
      teacher: "Camila Ortiz",
      capacity: 5,
      fee: 220_000,
      minAge: 12,
      maxAge: 16,
      modules: mods("ava", ["Arduino básico", "Servomotores", "Comunicación serial", "Proyecto: brazo robótico"]),
    },
    {
      id: "g-inventores",
      name: "Club de inventores",
      day: 2,
      time: "17:00",
      teacher: "Laura Méndez",
      capacity: 6,
      fee: 200_000,
      minAge: 10,
      maxAge: 13,
      modules: mods("inv", ["Electrónica básica", "Impresión 3D", "Micro:bit", "Proyecto libre"]),
    },
  ];
}

// [nombre, edad, acudiente, teléfono, grupo, días desde el ingreso, módulo, probabilidad de asistir]
type SeedStudent = [string, number, string, string, string, number, number, number];
const SEED_STUDENTS: SeedStudent[] = [
  ["Mateo Pardo", 9, "Diana Pardo", "3104528831", "g-inicial", 200, 2, 0.92],
  ["Sofía Restrepo", 8, "Julián Restrepo", "3157710294", "g-inicial", 180, 3, 0.96],
  ["Tomás Guerrero", 10, "Paola Guerrero", "3002216647", "g-inicial", 150, 1, 0.55],
  ["Valentina Cano", 9, "Luis Cano", "3186643012", "g-inicial", 120, 1, 0.88],
  ["Jerónimo Vélez", 8, "Marcela Vélez", "3013348875", "g-inicial", 25, 0, 0.9],
  ["Antonia Salazar", 7, "Ricardo Salazar", "3129985410", "g-inicial", 90, 1, 0.85],
  ["Emilio Herrera", 11, "Natalia Herrera", "3165521098", "g-bloques", 240, 3, 0.94],
  ["Isabella Montoya", 12, "Carlos Montoya", "3207734451", "g-bloques", 300, 4, 0.97],
  ["Samuel Ospina", 11, "Gloria Ospina", "3045516620", "g-bloques", 160, 1, 0.6],
  ["Mariana Quintero", 10, "Felipe Quintero", "3112287743", "g-bloques", 70, 1, 0.9],
  ["Lucía Bermúdez", 14, "Sandra Bermúdez", "3176604128", "g-avanzada", 330, 3, 0.95],
  ["Martín Arango", 15, "Jorge Arango", "3018872365", "g-avanzada", 280, 2, 0.86],
  ["Gabriela Torres", 13, "Ana María Torres", "3133349081", "g-avanzada", 210, 2, 0.9],
  ["Nicolás Zapata", 14, "Hernán Zapata", "3229906634", "g-avanzada", 140, 1, 0.82],
  ["Sara Londoño", 13, "Beatriz Londoño", "3058814472", "g-avanzada", 100, 1, 0.93],
  ["Daniel Giraldo", 12, "Patricia Giraldo", "3142257719", "g-inventores", 190, 2, 0.89],
  ["Manuela Ríos", 11, "Óscar Ríos", "3195568820", "g-inventores", 170, 2, 0.91],
  ["Juan José Castaño", 12, "Liliana Castaño", "3026639917", "g-inventores", 45, 0, 0.62],
  ["Salomé Aguirre", 10, "Diego Aguirre", "3168831106", "g-inventores", 110, 1, 0.94],
  ["Simón Patiño", 9, "Viviana Patiño", "3109924438", "g-inicial", 60, 0, 0.87],
];

const NOTE_TEXTS = [
  "Armó el mecanismo sin ayuda y explicó a sus compañeros cómo funciona.",
  "Le cuesta concentrarse al final de la clase; probaremos con pausas cortas.",
  "Terminó el reto del módulo antes que el resto del grupo.",
  "Necesita repasar en casa la parte de conexiones; le enviamos una guía.",
  "Muy buen trabajo en equipo; lideró la presentación del proyecto.",
  "Faltó a dos sesiones seguidas; conviene hablar con el acudiente.",
  "Avanza bien con la lógica, pero debe documentar mejor sus pasos.",
  "Mostró mucha creatividad en el diseño del prototipo.",
];

export interface AcademyData {
  groups: Group[];
  students: Student[];
  sessions: Session[];
  notes: Note[];
  payments: Payment[];
  applicants: Applicant[];
  /** Próximo número de recibo. */
  nextReceipt: number;
}

/**
 * Datos de ejemplo. Con "Empezar vacío" solo quedan los grupos con sus módulos y horarios (la configuración que
 * la academia necesita para inscribir estudiantes); sin estudiantes, asistencia, pagos ni aspirantes.
 */
export function seedAcademy(): AcademyData {
  const groups = seedGroups();
  if (isBlankStart(SLUG)) return { groups, students: [], sessions: [], notes: [], payments: [], applicants: [], nextReceipt: 1 };
  const rand = rng(20_260_115);
  const today = startOfDay(Date.now());

  const students: Student[] = SEED_STUDENTS.map(([name, age, guardian, guardianPhone, groupId, since, moduleIndex], i) => ({
    id: `e-${i + 1}`,
    name,
    age,
    guardian,
    guardianPhone,
    groupId,
    joinedAt: daysFromToday(-since),
    status: "activo",
    moduleIndex,
  }));
  // Un estudiante retirado, con historial antiguo.
  students.push({
    id: "e-21",
    name: "Felipe Duque",
    age: 11,
    guardian: "Adriana Duque",
    guardianPhone: "3121147756",
    groupId: "g-bloques",
    joinedAt: daysFromToday(-150),
    status: "retirado",
    moduleIndex: 1,
  });
  const reliability = new Map(SEED_STUDENTS.map((s, i) => [`e-${i + 1}`, s[7]]));
  reliability.set("e-21", 0.8);

  // Ocho semanas de sesiones ya dictadas (hasta ayer).
  const sessions: Session[] = [];
  for (const group of groups) {
    for (const date of sessionDates(group, today - RISK_WINDOW_DAYS * DAY_MS, today - DAY_MS)) {
      const marks: Record<string, Mark> = {};
      for (const s of students) {
        if (s.groupId !== group.id || s.joinedAt > date) continue;
        if (s.status === "retirado" && date > today - 30 * DAY_MS) continue;
        const r = rand();
        marks[s.id] = r < (reliability.get(s.id) ?? 0.9) ? "presente" : rand() < 0.3 ? "excusa" : "ausente";
      }
      sessions.push({ id: sessionId(group.id, date), groupId: group.id, date, marks });
    }
  }

  // Tres meses de mensualidades: los anteriores casi completos, el actual a medias.
  const payments: Payment[] = [];
  const current = monthKey(today);
  const methods: PayMethod[] = ["efectivo", "transferencia", "nequi", "nequi", "transferencia"];
  for (const offset of [-2, -1, 0]) {
    const month = shiftMonth(current, offset);
    const start = monthStart(month);
    const maxDay = offset === 0 ? Math.min(new Date(today).getDate() - 1, 9) : 12;
    for (const s of students) {
      if (s.joinedAt > monthEnd(month)) continue;
      if (s.status === "retirado" && offset === 0) continue;
      const weak = (reliability.get(s.id) ?? 1) < 0.7;
      const pays = offset === -2 ? true : offset === -1 ? !weak : rand() < 0.6 && !weak;
      if (!pays) continue;
      const group = groups.find((g) => g.id === s.groupId)!;
      payments.push({
        id: `p-${s.id}-${month}`,
        studentId: s.id,
        month,
        amount: group.fee,
        paidAt: Math.min(start + Math.floor(rand() * (maxDay + 1)) * DAY_MS + 10 * 3_600_000, Date.now()),
        method: methods[Math.floor(rand() * methods.length)],
        receipt: 0,
      });
    }
  }

  // Notas del profesor repartidas en las últimas semanas.
  const notes: Note[] = [];
  const general = NOTE_TEXTS.filter((_, k) => k !== 5);
  students.forEach((s, i) => {
    if (s.status === "retirado") return;
    const count = i % 3 === 0 ? 2 : 1;
    for (let n = 0; n < count; n++) {
      const daysAgo = Math.min(Math.floor(rand() * 50) + 1, Math.floor((today - s.joinedAt) / DAY_MS));
      notes.push({ id: `n-${s.id}-${n}`, studentId: s.id, date: today - daysAgo * DAY_MS, text: general[(i + n * 3) % general.length] });
    }
  });
  // Las notas sobre faltas, para quienes de verdad faltan.
  for (const id of ["e-3", "e-9", "e-18"]) notes.push({ id: `n-${id}-riesgo`, studentId: id, date: today - 4 * DAY_MS, text: NOTE_TEXTS[5] });

  // Recibos consecutivos en el orden en que se pagó.
  payments.sort((a, b) => a.paidAt - b.paidAt).forEach((p, i) => (p.receipt = i + 1));

  return { groups, students, sessions, notes, payments, applicants: seedApplicants(), nextReceipt: payments.length + 1 };
}

function seedApplicants(): Applicant[] {
  const at = (days: number, h = 10, m = 0) => daysFromToday(days, h, m);
  const log = (entries: [number, FollowUp["kind"], string][]) => entries.map(([days, kind, text], i) => ({ id: `f-${days}-${i}`, at: at(days, 9 + i), kind, text }));
  // Próxima clase del grupo de bloques (miércoles) para la clase de prueba agendada.
  let trial = startOfDay(Date.now()) + DAY_MS;
  while (new Date(trial).getDay() !== 3) trial += DAY_MS;
  const trialAt = new Date(trial).setHours(16, 0, 0, 0);
  const base = { email: "", message: "", trialAt: null, discardReason: "", studentId: null };
  return [
    {
      ...base,
      id: "a-1",
      childName: "Emiliano Correa",
      age: 8,
      guardian: "Juliana Correa",
      phone: "3117742290",
      email: "juliana.correa@correo.com",
      groupId: "g-inicial",
      source: "Instagram",
      message: "Le encantan los legos. ¿Hay cupo los sábados?",
      createdAt: at(0, 7, 40),
      status: "nuevo",
      log: [],
    },
    {
      ...base,
      id: "a-2",
      childName: "Renata Villegas",
      age: 13,
      guardian: "Mauricio Villegas",
      phone: "3046619935",
      email: "mvillegas@correo.com",
      groupId: "",
      source: "Recomendación de otro acudiente",
      createdAt: at(-1, 18, 15),
      status: "nuevo",
      log: [],
    },
    {
      ...base,
      id: "a-3",
      childName: "Pablo Henao",
      age: 11,
      guardian: "Carolina Henao",
      phone: "3205581147",
      email: "carohenao@correo.com",
      groupId: "g-inventores",
      source: "Google",
      createdAt: at(-4),
      status: "contactado",
      log: log([
        [-3, "estado", "Marcado como contactado"],
        [-3, "nota", "Llamada: quiere saber si puede pagar por trimestre. Le enviamos la información por WhatsApp."],
      ]),
    },
    {
      ...base,
      id: "a-4",
      childName: "Violeta Arias",
      age: 10,
      guardian: "Esteban Arias",
      phone: "3152238804",
      email: "earias@correo.com",
      groupId: "g-bloques",
      source: "Volante o feria escolar",
      createdAt: at(-6),
      status: "prueba",
      trialAt,
      log: log([
        [-5, "estado", "Marcado como contactado"],
        [-5, "estado", "Clase de prueba agendada"],
      ]),
    },
    {
      ...base,
      id: "a-5",
      childName: "Jerónimo Vélez",
      age: 8,
      guardian: "Marcela Vélez",
      phone: "3013348875",
      email: "marcela.velez@correo.com",
      groupId: "g-inicial",
      source: "Facebook",
      createdAt: at(-32),
      status: "inscrito",
      studentId: "e-5",
      log: log([
        [-31, "estado", "Marcado como contactado"],
        [-29, "estado", "Clase de prueba agendada"],
        [-25, "estado", "Inscrito en Robótica inicial"],
      ]),
    },
    {
      ...base,
      id: "a-6",
      childName: "Martina Gómez",
      age: 6,
      guardian: "Laura Gómez",
      phone: "3008853316",
      email: "",
      groupId: "",
      source: "Instagram",
      createdAt: at(-12),
      status: "descartado",
      discardReason: "Edad fuera de rango",
      log: log([
        [-11, "estado", "Marcado como contactado"],
        [-11, "estado", "Descartado: Edad fuera de rango"],
        [-11, "nota", "Le ofrecimos avisarle cuando abramos el grupo de 6 años."],
      ]),
    },
  ];
}

/** Medianoche de hoy y el instante actual (fuera del render, para las reglas de pureza). */
export function todayStart() {
  return startOfDay(Date.now());
}
export function nowMs() {
  return Date.now();
}

const dateYear = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" });
/** "3 de dic de 2025": para fechas que pueden ser de otro año, como el ingreso. */
export function formatDateYear(value: number) {
  return dateYear.format(value);
}

/** "1 ausencia", "3 ausencias". */
export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/* ---------- Valor en letras (recibos) ---------- */

const UNITS = [
  "", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince",
  "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco",
  "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];
const TENS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const HUNDREDS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function below1000(n: number) {
  if (n === 100) return "cien";
  const rest = n % 100;
  const tens = rest < 30 ? UNITS[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? ` y ${UNITS[rest % 10]}` : ""}`;
  return [HUNDREDS[Math.floor(n / 100)], tens].filter(Boolean).join(" ");
}

/** "uno" pierde la última sílaba delante de "mil" y "millones": veintiún mil, un millón. */
const apocope = (text: string) => text.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");

/** 180000 → "Ciento ochenta mil pesos m/cte". Hasta 999.999.999. */
export function amountInWords(value: number) {
  const n = Math.round(Math.abs(value));
  if (n === 0) return "Cero pesos m/cte";
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (millions) parts.push(millions === 1 ? "un millón" : `${apocope(below1000(millions))} millones`);
  if (thousands) parts.push(thousands === 1 ? "mil" : `${apocope(below1000(thousands))} mil`);
  if (rest) parts.push(below1000(rest));
  const text = `${parts.join(" ")}${millions && !thousands && !rest ? " de" : ""} ${n === 1 ? "peso" : "pesos"} m/cte`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Fecha escrita en un CSV: "2025-03-14", "14/03/2025" o "14-03-2025". Medianoche local, o null si no es válida. */
export function parseDateText(raw: string): number | null {
  const text = raw.trim();
  let y: number, m: number, d: number;
  let match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(text);
  if (match) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(text))) [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else return null;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date.getTime() : null;
}

/** Compara nombres sin tildes, mayúsculas ni espacios de más (para detectar duplicados). */
export function sameName(a: string, b: string) {
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
  return norm(a) === norm(b);
}
