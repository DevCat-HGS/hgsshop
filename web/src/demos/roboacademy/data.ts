import { DAY_MS, daysFromToday, startOfDay } from "@/demos/kit/format";

export const SLUG = "roboacademy";
export const ACADEMY_NAME = "Academia Circuito";

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
  modules: Module[];
}

export type StudentStatus = "activo" | "retirado";

export interface Student {
  id: string;
  name: string;
  age: number;
  guardian: string;
  guardianPhone: string;
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
}

export function seedAcademy(): AcademyData {
  const rand = rng(20_260_115);
  const groups = seedGroups();
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

  return { groups, students, sessions, notes, payments };
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
