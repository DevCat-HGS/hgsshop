import { parseNumber } from "@/demos/kit/csvImport";

const longDate = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" });

/** "29 de octubre de 2026". */
export function formatLongDate(value: number) {
  return longDate.format(value);
}

const plainNumber = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

/** Valor en COP para un campo de texto: 120000 → "120.000". */
export function moneyInput(value: number) {
  return value ? plainNumber.format(value) : "";
}

/** Lee un valor en pesos escrito a la colombiana ("120.000", "$ 1.250.000"). Null si no es un entero positivo. */
export function parseMoney(raw: string): number | null {
  const value = parseNumber(raw);
  if (value == null || value <= 0 || !Number.isInteger(value)) return null;
  return value;
}

/** Correo con forma válida (no se comprueba que exista). */
export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}
