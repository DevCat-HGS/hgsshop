/** Formatos compartidos por las demos. Todo en español de Colombia, como el resto del sitio. */

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });
const dateLong = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" });
const time = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" });

export const DAY_MS = 86_400_000;

export function formatMoney(value: number) {
  return money.format(value);
}

export function formatDate(value: number | Date) {
  return date.format(value);
}

export function formatDateLong(value: number | Date) {
  return dateLong.format(value);
}

export function formatTime(value: number | Date) {
  return time.format(value);
}

export function formatDateTime(value: number | Date) {
  return `${date.format(value)}, ${time.format(value)}`;
}

/** Medianoche local del día de `value`. */
export function startOfDay(value: number | Date) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Fecha relativa a hoy a una hora dada: `daysFromToday(-2, 9, 30)` = anteayer a las 9:30. */
export function daysFromToday(days: number, hours = 0, minutes = 0) {
  const d = new Date(startOfDay(Date.now()) + days * DAY_MS);
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}

/** "hoy", "ayer", "hace 5 días". */
export function relativeDays(value: number) {
  const days = Math.round((startOfDay(Date.now()) - startOfDay(value)) / DAY_MS);
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days === -1) return "mañana";
  return days > 0 ? `hace ${days} días` : `en ${-days} días`;
}

/** Valor para un `<input type="date">` (AAAA-MM-DD, hora local). */
export function toDateInput(value: number) {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Lee un `<input type="date">` como medianoche local (no UTC, que movería el día). */
export function fromDateInput(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** Compara textos sin mayúsculas ni tildes, para los buscadores de las demos. */
export function matches(haystack: string, needle: string) {
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return norm(haystack).includes(norm(needle.trim()));
}
