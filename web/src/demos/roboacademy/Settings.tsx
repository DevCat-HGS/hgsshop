import { useState } from "react";
import { Btn, Field, FormError, Panel, inputClass } from "@/demos/kit/ui";
import { FOOTER_MAX, digitsOnly, validateSettings, type Settings as AcademySettings } from "./data";
import { DocFooter, DocHeader } from "./Document";
import type { ScreenProps } from "./store";

/** Datos de la academia que salen en el encabezado y el pie de los recibos y reportes. */
export function Settings({ academy, notify }: ScreenProps) {
  const [draft, setDraft] = useState<AcademySettings>(academy.settings);
  const [error, setError] = useState("");
  const set = (key: keyof AcademySettings) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(academy.settings);

  function save() {
    const problem = validateSettings(draft);
    if (problem) return setError(problem);
    const clean: AcademySettings = {
      name: draft.name.trim(),
      nit: draft.nit.trim(),
      address: draft.address.trim(),
      city: draft.city.trim(),
      phone: digitsOnly(draft.phone),
      footer: draft.footer.trim(),
    };
    academy.setSettings(clean);
    setDraft(clean);
    setError("");
    notify("Ajustes guardados");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,28rem)_1fr]">
      <form
        aria-label="Ajustes de la academia"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-4"
      >
        <Panel title="Datos de la academia">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre de la academia" className="sm:col-span-2">
              {(id) => <input id={id} value={draft.name} onChange={(e) => set("name")(e.target.value)} className={inputClass} maxLength={60} />}
            </Field>
            <Field label="NIT" hint="Opcional. Con dígito de verificación.">
              {(id) => <input id={id} value={draft.nit} onChange={(e) => set("nit")(e.target.value)} className={inputClass} placeholder="901.456.789-3" />}
            </Field>
            <Field label="Teléfono" hint="Opcional.">
              {(id) => <input id={id} type="tel" value={draft.phone} onChange={(e) => set("phone")(e.target.value)} className={inputClass} placeholder="604 322 1188" />}
            </Field>
            <Field label="Dirección">
              {(id) => <input id={id} value={draft.address} onChange={(e) => set("address")(e.target.value)} className={inputClass} />}
            </Field>
            <Field label="Ciudad">{(id) => <input id={id} value={draft.city} onChange={(e) => set("city")(e.target.value)} className={inputClass} />}</Field>
            <Field label="Texto del pie de recibos y reportes" hint={`${draft.footer.length} de ${FOOTER_MAX} caracteres.`} className="sm:col-span-2">
              {(id) => <textarea id={id} rows={3} value={draft.footer} onChange={(e) => set("footer")(e.target.value)} className={inputClass} />}
            </Field>
          </div>
          <div className="mt-4 space-y-3">
            <FormError>{error}</FormError>
            <div className="flex flex-wrap justify-end gap-2">
              <Btn
                variant="ghost"
                disabled={!dirty}
                onClick={() => {
                  setDraft(academy.settings);
                  setError("");
                }}
              >
                Descartar cambios
              </Btn>
              <Btn type="submit" variant="primary" disabled={!dirty}>
                Guardar ajustes
              </Btn>
            </div>
          </div>
        </Panel>
      </form>

      <section aria-label="Vista previa del encabezado y el pie" className="space-y-2">
        <h3 className="text-sm font-semibold text-text-muted">Vista previa en recibos y reportes</h3>
        <div className="space-y-6 rounded-lg border border-border bg-bg p-5 text-sm sm:p-8">
          <DocHeader settings={{ ...draft, phone: digitsOnly(draft.phone) }} kind="Recibo de caja" />
          <p className="text-text-subtle">… contenido del documento …</p>
          <DocFooter settings={draft} />
        </div>
      </section>
    </div>
  );
}
