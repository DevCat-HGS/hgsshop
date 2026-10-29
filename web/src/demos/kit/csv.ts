/**
 * Exportación a CSV pensada para abrir en Excel con configuración regional de Colombia: separador `;`, BOM UTF-8
 * para que las tildes se vean bien y saltos de línea CRLF. Se genera en el navegador; nada sale a la red.
 */
export type CsvCell = string | number | boolean | null | undefined;

function escape(cell: CsvCell): string {
  if (cell == null) return "";
  const text = typeof cell === "number" ? String(cell).replace(".", ",") : String(cell);
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  return [headers, ...rows].map((row) => row.map(escape).join(";")).join("\r\n");
}

/** Descarga `rows` como `<filename>.csv`. `filename` sin extensión; se le añade la fecha de hoy. */
export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]) {
  const blob = new Blob(["﻿", toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date();
  const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  link.href = url;
  link.download = `${filename}-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revocar después de que el navegador tome el enlace.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
