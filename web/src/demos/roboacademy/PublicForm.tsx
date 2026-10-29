import { useState } from "react";
import { formatMoney } from "@/demos/kit/format";
import { Btn, Field, FormError, inputClass } from "@/demos/kit/ui";
import { SOURCES, activeIn, digitsOnly, groupsForAge, sameName, scheduleLabel, type Group } from "./data";
import { ClientFrame } from "./shared";
import type { GoTo, ScreenProps } from "./store";

interface Draft {
  childName: string;
  age: string;
  guardian: string;
  phone: string;
  email: string;
  groupId: string;
  source: string;
  message: string;
}

const emptyDraft = (): Draft => ({ childName: "", age: "", guardian: "", phone: "", email: "", groupId: "", source: "", message: "" });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Dirección ficticia del formulario a partir del nombre de la academia. */
function formAddress(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
  return `${slug || "miacademia"}.co/inscripciones`;
}

/**
 * Formulario público de inscripción, tal como lo ve el acudiente. Lo que se envía llega a Inscripciones como
 * aspirante nuevo. La academia también puede llenarlo cuando un acudiente llama o escribe.
 */
export function PublicForm({ academy, notify, goTo }: ScreenProps & { goTo: GoTo }) {
  const { groups, students, applicants, settings } = academy;
  const [d, setD] = useState<Draft>(emptyDraft);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const set = (key: keyof Draft) => (value: string) => setD((x) => ({ ...x, [key]: value }));

  const age = Number(d.age);
  const validAge = d.age.trim() !== "" && Number.isInteger(age) && age >= 4 && age <= 18;
  const suggested = validAge ? groupsForAge(groups, age) : groups;
  const free = (g: Group) => g.capacity - activeIn(students, g.id).length;

  function submit() {
    const childName = d.childName.trim();
    const guardian = d.guardian.trim();
    const phone = digitsOnly(d.phone);
    const email = d.email.trim();
    if (childName.length < 3) return setError("Escribe el nombre completo del niño o la niña.");
    if (!validAge) return setError("La edad debe ser un número entero entre 4 y 18 años.");
    if (guardian.length < 3) return setError("Escribe el nombre del acudiente.");
    if (phone.length !== 10) return setError("El celular debe tener 10 dígitos.");
    if (email && !EMAIL.test(email)) return setError("El correo no parece válido.");
    if (!d.source) return setError("Cuéntanos cómo nos conociste.");
    if (d.message.length > 500) return setError("El mensaje no puede pasar de 500 caracteres.");
    const open = applicants.find((a) => sameName(a.childName, childName) && a.phone === phone && a.status !== "descartado" && a.status !== "inscrito");
    if (open) return setError(`Ya recibimos una inscripción de ${open.childName}. Te contactaremos pronto.`);
    academy.addApplicant({ childName, age, guardian, phone, email, groupId: d.groupId, source: d.source, message: d.message.trim() });
    notify(`Nueva inscripción: ${childName}`);
    setSent(childName);
    setD(emptyDraft());
    setError("");
  }

  return (
    <ClientFrame
      label="Formulario de inscripción"
      address={formAddress(settings.name)}
      notice="En la demo no hay un enlace público: lo que envíes aquí llega a Inscripciones como aspirante nuevo, igual que si lo llenara un acudiente."
      toolbar={
        <Btn size="sm" className="shrink-0" onClick={() => goTo("inscripciones")}>
          Ver aspirantes
        </Btn>
      }
    >
      <header className="mb-6">
        <p className="text-[13px] font-semibold tracking-wide text-brand-soft uppercase">{settings.name}</p>
        <h3 className="font-display text-2xl text-text">Inscribe a tu hijo o hija</h3>
        <p className="mt-1 text-sm text-text-muted">
          Clases de robótica y programación para niños y jóvenes de {Math.min(...groups.map((g) => g.minAge), 7)} a {Math.max(...groups.map((g) => g.maxAge), 16)} años.
          Déjanos tus datos y te escribimos para agendar una clase de prueba gratis.
        </p>
      </header>

      {sent ? (
        <div role="status" className="space-y-4 rounded-lg border border-success bg-success-muted p-5 text-sm">
          <p className="text-base font-semibold text-text">¡Gracias! Recibimos la inscripción de {sent}.</p>
          <p className="text-text-muted">Te escribiremos por WhatsApp en las próximas horas para agendar la clase de prueba.</p>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => setSent(null)}>Enviar otra inscripción</Btn>
            <Btn variant="primary" onClick={() => goTo("inscripciones")}>
              Ver en Inscripciones
            </Btn>
          </div>
        </div>
      ) : (
        <form
          aria-label="Inscripción"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Nombre del niño o la niña" className="sm:col-span-2">
            {(id) => <input id={id} value={d.childName} onChange={(e) => set("childName")(e.target.value)} className={inputClass} autoComplete="off" />}
          </Field>
          <Field label="Edad">
            {(id) => <input id={id} type="number" min={4} max={18} value={d.age} onChange={(e) => set("age")(e.target.value)} className={inputClass} />}
          </Field>
          <Field label="Nombre del acudiente">
            {(id) => <input id={id} value={d.guardian} onChange={(e) => set("guardian")(e.target.value)} className={inputClass} autoComplete="name" />}
          </Field>
          <Field label="Celular (WhatsApp)">
            {(id) => <input id={id} type="tel" value={d.phone} onChange={(e) => set("phone")(e.target.value)} className={inputClass} placeholder="300 123 4567" autoComplete="tel" />}
          </Field>
          <Field label="Correo (opcional)">
            {(id) => <input id={id} type="email" value={d.email} onChange={(e) => set("email")(e.target.value)} className={inputClass} autoComplete="email" />}
          </Field>
          <Field label="Grupo de interés" hint={validAge && suggested.length === 0 ? `No tenemos un grupo para ${age} años; te recomendamos uno.` : undefined} className="sm:col-span-2">
            {(id) => (
              <select id={id} value={d.groupId} onChange={(e) => set("groupId")(e.target.value)} className={inputClass}>
                <option value="">Recomiéndenme uno</option>
                {suggested.map((g) => (
                  <option key={g.id} value={g.id}>
                    {`${g.name} · ${scheduleLabel(g)} · ${formatMoney(g.fee)} al mes${free(g) <= 0 ? " · sin cupo (lista de espera)" : ""}`}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="¿Cómo nos conociste?" className="sm:col-span-2">
            {(id) => (
              <select id={id} value={d.source} onChange={(e) => set("source")(e.target.value)} className={inputClass}>
                <option value="">Elige una opción</option>
                {SOURCES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Mensaje (opcional)" className="sm:col-span-2">
            {(id) => (
              <textarea id={id} rows={3} value={d.message} onChange={(e) => set("message")(e.target.value)} className={inputClass} maxLength={500} placeholder="Preguntas, horarios que te sirven, intereses del niño…" />
            )}
          </Field>
          <div className="space-y-3 sm:col-span-2">
            <FormError>{error}</FormError>
            <Btn type="submit" variant="primary" className="w-full sm:w-auto">
              Enviar inscripción
            </Btn>
            <p className="text-[12px] text-text-subtle">Usamos tus datos solo para contactarte sobre la inscripción.</p>
          </div>
        </form>
      )}
    </ClientFrame>
  );
}
