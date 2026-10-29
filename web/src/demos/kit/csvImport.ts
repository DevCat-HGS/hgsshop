/**
 * Lectura de CSV guardados desde Excel o Google Sheets: detecta el separador (`;` en Excel es-CO, `,` en el
 * resto), quita el BOM, respeta comillas (con comillas dobles escapadas y saltos de línea dentro) y descarta
 * las filas vacías. Sin dependencias.
 */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (quoted) {
      if (char === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ""));
}

/** Normaliza un encabezado para compararlo: sin tildes, mayúsculas, signos ni espacios extra. */
export function normalizeHeader(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9ñ]+/g, " ")
    .trim();
}

/** Número escrito a la colombiana o a la inglesa: "1.250.000", "$ 1.250.000", "10,5", "10.5". */
export function parseNumber(raw: string): number | null {
  const text = raw.replace(/[$\s]/g, "").replace(/COP/i, "");
  if (!text) return null;
  let normalized = text;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) normalized = text.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d+,\d+$/.test(text)) normalized = text.replace(",", ".");
  else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) normalized = text.replace(/,/g, "");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
