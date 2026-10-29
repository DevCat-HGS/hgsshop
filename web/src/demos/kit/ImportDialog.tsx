import { useMemo, useState, type ChangeEvent } from "react";
import { downloadCsv } from "@/demos/kit/csv";
import { normalizeHeader, parseCsv } from "@/demos/kit/csvImport";
import { Btn, Dialog, Field, FormError, Pill, inputClass } from "@/demos/kit/ui";

export interface ImportField<T> {
  key: keyof T & string;
  label: string;
  required?: boolean;
  /** Otros encabezados que también corresponden a este campo ("valor", "precio venta"…). */
  aliases?: string[];
  /** Ejemplo para la plantilla descargable. */
  example?: string;
}

/**
 * Resultado de validar una fila: el registro listo para guardar, o el motivo por el que no se puede importar.
 * `values` trae el texto de cada campo ya mapeado desde las columnas del archivo.
 */
export type RowResult<R> = { ok: true; record: R } | { ok: false; error: string };

const MAX_PREVIEW = 6;

/**
 * Importar desde Excel o CSV: elegir el archivo, mapear columnas (automático por nombre, editable), ver qué filas
 * entran y por qué no entran las demás, e importar solo las válidas. Genérico: cada app define sus campos y su
 * validación. Todo ocurre en el navegador.
 */
export function ImportDialog<R>({
  open,
  onClose,
  title,
  entityPlural,
  templateName,
  fields,
  validate,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** "productos", "clientes"… para los textos. */
  entityPlural: string;
  /** Nombre base de la plantilla CSV descargable. */
  templateName: string;
  fields: ImportField<Record<string, string>>[];
  /** Valida y convierte una fila. `index` es el número de fila del archivo (1 = primera fila de datos). */
  validate: (values: Record<string, string>, index: number) => RowResult<R>;
  /** Guarda los registros válidos. */
  onImport: (records: R[]) => void;
}) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  const headers = rows[0] ?? [];
  const dataRows = rows.slice(1);

  function reset() {
    setFileName("");
    setRows([]);
    setMapping({});
    setError("");
  }

  function close() {
    reset();
    onClose();
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2_000_000) {
      setError("El archivo pesa más de 2 MB. Para la demo, importa una parte.");
      return;
    }
    const parsed = parseCsv(await file.text());
    if (parsed.length < 2) {
      setError("El archivo no tiene filas de datos. La primera fila debe tener los nombres de las columnas.");
      return;
    }
    // Mapeo automático: cada campo toma la columna cuyo encabezado coincide con su etiqueta o un alias.
    const normalized = parsed[0].map(normalizeHeader);
    const auto: Record<string, number> = {};
    for (const field of fields) {
      const names = [field.label, field.key, ...(field.aliases ?? [])].map(normalizeHeader);
      const index = normalized.findIndex((h) => names.includes(h));
      if (index >= 0) auto[field.key] = index;
    }
    setFileName(file.name);
    setRows(parsed);
    setMapping(auto);
    setError("");
  }

  const results = useMemo(
    () =>
      dataRows.map((row, i) => {
        const values: Record<string, string> = {};
        for (const field of fields) {
          const column = mapping[field.key];
          values[field.key] = column == null ? "" : (row[column] ?? "");
        }
        const missing = fields.filter((f) => f.required && !values[f.key]).map((f) => f.label);
        if (missing.length) return { values, result: { ok: false, error: `Falta ${missing.join(", ")}` } as RowResult<R> };
        return { values, result: validate(values, i + 1) };
      }),
    [dataRows, fields, mapping, validate],
  );

  const valid = results.filter((r) => r.result.ok);
  const invalid = results.map((r, i) => ({ ...r, line: i + 2 })).filter((r) => !r.result.ok);
  const missingRequired = fields.filter((f) => f.required && mapping[f.key] == null);

  function importValid() {
    onImport(valid.map((r) => (r.result as { ok: true; record: R }).record));
    close();
  }

  return (
    <Dialog open={open} onClose={close} title={title} wide>
      <div className="flex flex-col gap-5 text-sm">
        <p className="text-text-muted">
          Trae tus {entityPlural} desde Excel o Google Sheets: guarda la hoja como CSV y súbela aquí. La primera fila debe tener los nombres de las
          columnas. El archivo se lee en tu navegador; no se sube a ningún servidor.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-brand-contrast hover:bg-brand-hover focus-within:outline-2 focus-within:outline-brand">
            {fileName ? "Elegir otro archivo" : "Elegir archivo CSV"}
            <input type="file" accept=".csv,text/csv" onChange={onFile} className="sr-only" />
          </label>
          <Btn
            variant="ghost"
            onClick={() =>
              downloadCsv(
                templateName,
                fields.map((f) => f.label),
                [fields.map((f) => f.example ?? "")],
              )
            }
          >
            Descargar plantilla
          </Btn>
          {fileName && <span className="text-text-muted">{fileName}</span>}
        </div>
        <FormError>{error}</FormError>

        {headers.length > 0 && (
          <>
            <section aria-label="Columnas">
              <h3 className="font-semibold text-text">Columnas</h3>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map((field) => (
                  <Field key={field.key} label={`${field.label}${field.required ? " (obligatorio)" : ""}`}>
                    {(id) => (
                      <select
                        id={id}
                        className={inputClass}
                        value={mapping[field.key] ?? ""}
                        onChange={(e) =>
                          setMapping((m) => {
                            const next = { ...m };
                            if (e.target.value === "") delete next[field.key];
                            else next[field.key] = Number(e.target.value);
                            return next;
                          })
                        }
                      >
                        <option value="">No importar</option>
                        {headers.map((h, i) => (
                          <option key={i} value={i}>
                            {h || `Columna ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                ))}
              </div>
            </section>

            <section aria-label="Resultado de la revisión" className="rounded-md border border-border bg-bg p-3">
              <p className="flex flex-wrap items-center gap-2 text-text">
                <Pill tone="success">{valid.length} listas para importar</Pill>
                {invalid.length > 0 && <Pill tone="danger">{invalid.length} con errores</Pill>}
              </p>
              {missingRequired.length > 0 && (
                <p className="mt-2 text-warning">Elige la columna de: {missingRequired.map((f) => f.label).join(", ")}.</p>
              )}
              {invalid.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1 text-[13px] text-text-muted">
                  {invalid.slice(0, MAX_PREVIEW).map((r) => (
                    <li key={r.line}>
                      Fila {r.line}: {(r.result as { ok: false; error: string }).error}
                    </li>
                  ))}
                  {invalid.length > MAX_PREVIEW && <li>…y {invalid.length - MAX_PREVIEW} más.</li>}
                </ul>
              )}
            </section>

            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={close}>
                Cancelar
              </Btn>
              <Btn variant="primary" disabled={valid.length === 0 || missingRequired.length > 0} onClick={importValid}>
                Importar {valid.length} {entityPlural}
              </Btn>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
