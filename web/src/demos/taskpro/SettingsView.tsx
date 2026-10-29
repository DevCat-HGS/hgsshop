import { useState } from "react";
import { Btn, Field, FormError, Panel, inputClass } from "@/demos/kit/ui";
import { DEFAULT_FOOTER, DOC_TYPES, type AccountType, type DocType, type Issuer } from "./data";
import { isEmail } from "./util";

/** Mismas reglas que el documento de los clientes: números y puntos, con dígito de verificación opcional. */
function validDoc(type: DocType, value: string) {
  if (type === "PP") return /^[A-Za-z0-9-]{5,20}$/.test(value);
  return /^\d{1,3}(\.?\d{3}){1,4}(-\d)?$/.test(value);
}

/**
 * Ajustes del emisor: los datos de quien cobra. Salen en cada cuenta de cobro y en los informes para el cliente.
 * Se guardan al pulsar Guardar, con validación; cambiarlos no altera los números de las cuentas ya creadas.
 */
export function SettingsView({ issuer, onSave }: { issuer: Issuer; onSave: (issuer: Issuer) => void }) {
  const [draft, setDraft] = useState<Issuer>(issuer);
  const [error, setError] = useState("");
  const set = <K extends keyof Issuer>(key: K, value: Issuer[K]) => setDraft((d) => ({ ...d, [key]: value }));

  function submit() {
    const clean: Issuer = {
      name: draft.name.trim(),
      docType: draft.docType,
      docNumber: draft.docNumber.trim(),
      city: draft.city.trim(),
      email: draft.email.trim().toLowerCase(),
      phone: draft.phone.trim(),
      bank: draft.bank.trim(),
      accountType: draft.accountType,
      accountNumber: draft.accountNumber.trim(),
      footer: draft.footer.trim(),
    };
    if (!clean.name) return setError("Escribe tu nombre o el de tu negocio.");
    if (!clean.docNumber) return setError("Escribe tu número de documento.");
    if (!validDoc(clean.docType, clean.docNumber)) return setError("El documento solo lleva números y puntos, con el dígito de verificación opcional tras un guion.");
    if (!clean.city) return setError("Escribe la ciudad: va en la fecha de cada cuenta de cobro.");
    if (clean.email && !isEmail(clean.email)) return setError("El correo no tiene una forma válida (nombre@dominio.co).");
    if (clean.phone && !/^[\d\s+()-]{7,20}$/.test(clean.phone)) return setError("El teléfono solo lleva números, espacios y los signos + ( ) -.");
    if (clean.accountNumber && !/^[\d-]{4,24}$/.test(clean.accountNumber)) return setError("El número de cuenta solo lleva números y guiones.");
    if (clean.accountNumber && !clean.bank) return setError("Escribe el banco de la cuenta.");
    setError("");
    setDraft(clean);
    onSave(clean);
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(issuer);

  return (
    <form
      aria-label="Ajustes del emisor"
      className="flex max-w-3xl flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <p className="text-sm text-text-muted">Estos datos salen en tus cuentas de cobro y en los informes para tus clientes. Los datos bancarios de ejemplo son ficticios: cámbialos por los tuyos.</p>

      <Panel title="Quién cobra">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre o razón social" className="sm:col-span-2">
            {(id) => <input id={id} className={inputClass} value={draft.name} maxLength={100} onChange={(e) => set("name", e.target.value)} />}
          </Field>
          <Field label="Tipo de documento">
            {(id) => (
              <select id={id} className={inputClass} value={draft.docType} onChange={(e) => set("docType", e.target.value as DocType)}>
                {DOC_TYPES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Número de documento">{(id) => <input id={id} className={inputClass} value={draft.docNumber} maxLength={20} onChange={(e) => set("docNumber", e.target.value)} />}</Field>
          <Field label="Ciudad">{(id) => <input id={id} className={inputClass} value={draft.city} maxLength={60} onChange={(e) => set("city", e.target.value)} />}</Field>
          <Field label="Teléfono" hint="Opcional">
            {(id) => <input id={id} type="tel" className={inputClass} value={draft.phone} maxLength={20} onChange={(e) => set("phone", e.target.value)} />}
          </Field>
          <Field label="Correo" hint="Opcional" className="sm:col-span-2">
            {(id) => <input id={id} type="text" inputMode="email" autoComplete="off" className={inputClass} value={draft.email} maxLength={120} onChange={(e) => set("email", e.target.value)} />}
          </Field>
        </div>
      </Panel>

      <Panel title="Datos para el pago">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Banco">{(id) => <input id={id} className={inputClass} value={draft.bank} maxLength={60} onChange={(e) => set("bank", e.target.value)} />}</Field>
          <Field label="Tipo de cuenta">
            {(id) => (
              <select id={id} className={inputClass} value={draft.accountType} onChange={(e) => set("accountType", e.target.value as AccountType)}>
                <option value="ahorros">Ahorros</option>
                <option value="corriente">Corriente</option>
              </select>
            )}
          </Field>
          <Field label="Número de cuenta">{(id) => <input id={id} className={inputClass} value={draft.accountNumber} maxLength={24} onChange={(e) => set("accountNumber", e.target.value)} />}</Field>
        </div>
      </Panel>

      <Panel
        title="Texto legal del pie"
        actions={
          <Btn variant="ghost" size="sm" onClick={() => set("footer", DEFAULT_FOOTER)}>
            Usar el texto sugerido
          </Btn>
        }
      >
        <Field label="Pie de las cuentas de cobro" hint="Revísalo con tu contador: depende de tu régimen tributario.">
          {(id) => <textarea id={id} className={`${inputClass} min-h-28`} value={draft.footer} maxLength={800} onChange={(e) => set("footer", e.target.value)} />}
        </Field>
      </Panel>

      <FormError>{error}</FormError>
      <div className="flex flex-wrap gap-2">
        <Btn variant="primary" type="submit">
          Guardar ajustes
        </Btn>
        <Btn
          variant="ghost"
          disabled={!dirty}
          onClick={() => {
            setDraft(issuer);
            setError("");
          }}
        >
          Descartar cambios
        </Btn>
      </div>
    </form>
  );
}
