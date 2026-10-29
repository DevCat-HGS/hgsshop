import { useState, type FormEvent } from "react";
import { Btn, Field, FormError, inputClass, Panel } from "@/demos/kit/ui";
import type { Settings as BusinessSettings } from "./data";
import { RoleNote } from "./common";
import type { StockFlow } from "./store";

interface FormState {
  name: string;
  nit: string;
  address: string;
  city: string;
  phone: string;
  coverageDays: string;
}

const toForm = (s: BusinessSettings): FormState => ({
  name: s.name,
  nit: s.nit,
  address: s.address,
  city: s.city,
  phone: s.phone,
  coverageDays: String(s.coverageDays),
});

/** Ajustes del negocio: datos que salen en la orden de compra y la remisión, y la cobertura de la sugerencia de compra. */
export function Settings({ store, notify }: { store: StockFlow; notify: (m: string) => void }) {
  const [form, setForm] = useState<FormState>(() => toForm(store.settings));
  const [error, setError] = useState("");
  const manage = store.can("settings.manage");
  const set = (key: keyof FormState) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = store.saveSettings({ ...form, coverageDays: form.coverageDays.trim() === "" ? NaN : Number(form.coverageDays) });
    if (result) {
      setError(result);
      return;
    }
    setError("");
    notify("Ajustes del negocio guardados");
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <RoleNote store={store} permissions={["settings.manage"]} />
      <form onSubmit={submit} aria-label="Ajustes del negocio" className="flex flex-col gap-5">
        <Panel title="Datos del negocio">
          <p className="mb-4 text-[13px] text-text-muted">Salen en el encabezado de las órdenes de compra y de las remisiones de despacho.</p>
          <fieldset disabled={!manage} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del negocio" className="sm:col-span-2">
              {(id) => <input id={id} value={form.name} onChange={set("name")} maxLength={80} className={inputClass} />}
            </Field>
            <Field label="NIT" hint="Con dígito de verificación, p. ej. 900.123.456-7">
              {(id) => <input id={id} value={form.nit} onChange={set("nit")} maxLength={20} inputMode="numeric" className={inputClass} />}
            </Field>
            <Field label="Teléfono">
              {(id) => <input id={id} type="tel" value={form.phone} onChange={set("phone")} maxLength={20} className={inputClass} />}
            </Field>
            <Field label="Dirección">
              {(id) => <input id={id} value={form.address} onChange={set("address")} maxLength={80} className={inputClass} />}
            </Field>
            <Field label="Ciudad">
              {(id) => <input id={id} value={form.city} onChange={set("city")} maxLength={40} className={inputClass} />}
            </Field>
          </fieldset>
        </Panel>
        <Panel title="Sugerencia de compra">
          <fieldset disabled={!manage}>
            <Field
              label="Días de cobertura"
              hint="Además del plazo del proveedor, cuántos días de consumo debe cubrir cada compra (0 a 120)."
              className="sm:max-w-xs"
            >
              {(id) => (
                <input id={id} type="number" inputMode="numeric" min={0} max={120} step={1} value={form.coverageDays} onChange={set("coverageDays")} className={inputClass} />
              )}
            </Field>
          </fieldset>
        </Panel>
        <FormError>{error}</FormError>
        {manage && (
          <div className="flex justify-end gap-2">
            <Btn
              variant="ghost"
              onClick={() => {
                setForm(toForm(store.settings));
                setError("");
              }}
            >
              Descartar cambios
            </Btn>
            <Btn type="submit" variant="primary">
              Guardar ajustes
            </Btn>
          </div>
        )}
      </form>
    </div>
  );
}
