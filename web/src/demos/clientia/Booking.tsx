import { useMemo, useRef, useState } from "react";
import { Btn, Field, FormError, inputClass, Panel } from "@/demos/kit/ui";
import { bookingLink, cancelSummary, rulesSummary, validateBusiness, validateRules, type BookingRules, type BusinessSettings } from "./data";
import { PublicBooking } from "./PublicBooking";
import { qrSvg } from "./qr";
import type { ClientiaStore } from "./store";

type Tab = "cliente" | "compartir" | "negocio";
const TABS: { id: Tab; label: string }[] = [
  { id: "cliente", label: "Así la ve tu cliente" },
  { id: "compartir", label: "Compartir y reglas" },
  { id: "negocio", label: "Datos del negocio" },
];

/** Reservas en línea: vista previa de la página pública, enlace con QR, reglas de reserva y datos del negocio. */
export function Booking({ store, notify, onOpenPublic }: { store: ClientiaStore; notify: (msg: string) => void; onOpenPublic: () => void }) {
  const [tab, setTab] = useState<Tab>("cliente");
  const link = bookingLink(typeof window === "undefined" ? "" : window.location.origin);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap rounded-md border border-border-strong p-0.5" role="group" aria-label="Secciones de reservas en línea">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded px-3 py-1 text-[13px] font-semibold ${tab === t.id ? "bg-surface-hover text-text" : "text-text-muted hover:text-text"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Btn size="sm" variant="ghost" className="sm:ml-auto" onClick={onOpenPublic}>
          Abrir como cliente
        </Btn>
      </div>

      {tab === "cliente" && (
        <div className="overflow-hidden rounded-lg border border-border-strong">
          <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-border-strong" />
            <span className="size-2.5 rounded-full bg-border-strong" />
            <span className="size-2.5 rounded-full bg-border-strong" />
            <span className="ml-2 min-w-0 flex-1 truncate rounded bg-bg px-2 py-0.5 text-[12px] text-text-subtle">{link}</span>
          </div>
          <div className="bg-bg-raised px-4 py-6 sm:px-6">
            <PublicBooking store={store} notify={notify} />
          </div>
        </div>
      )}
      {tab === "compartir" && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
          <ShareLink link={link} businessName={store.business.name} notify={notify} />
          <RulesForm key={JSON.stringify(store.rules)} rules={store.rules} onSave={(r) => {
            store.setRules(r);
            notify("Reglas de reserva guardadas");
          }} />
        </div>
      )}
      {tab === "negocio" && (
        <BusinessForm key={JSON.stringify(store.business)} business={store.business} onSave={(b) => {
          store.setBusiness(b);
          notify("Datos del negocio guardados");
        }} />
      )}
    </div>
  );
}

function ShareLink({ link, businessName, notify }: { link: string; businessName: string; notify: (msg: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const svg = useMemo(() => {
    try {
      return qrSvg(link);
    } catch {
      return null;
    }
  }, [link]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      notify("Enlace copiado");
    } catch {
      // Sin permiso de portapapeles: se selecciona para copiarlo a mano.
      input.current?.select();
      notify("Selecciona y copia el enlace con Ctrl+C");
    }
  }

  function download() {
    if (!svg) return;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientia-qr-reservas.svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Panel title="Enlace para compartir">
      <div className="flex flex-col gap-4 text-sm">
        <p className="text-text-muted">Ponlo en tu perfil de Instagram, en tu estado de WhatsApp o imprime el código QR para el mostrador.</p>
        <div className="flex gap-2">
          <input ref={input} readOnly value={link} aria-label="Enlace de la página de reservas" className={`${inputClass} min-w-0 flex-1`} onFocus={(e) => e.target.select()} />
          <Btn variant="primary" onClick={() => void copy()}>
            Copiar enlace
          </Btn>
        </div>
        {svg ? (
          <div className="flex flex-wrap items-end gap-4">
            <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} alt={`Código QR de la página de reservas de ${businessName}`} width={168} height={168} className="rounded-md" />
            <div className="flex flex-col gap-2">
              <p className="max-w-[16rem] text-[12px] text-text-subtle">El código se genera en tu navegador; ningún servicio externo ve tu enlace.</p>
              <Btn size="sm" onClick={download}>
                Descargar QR (SVG)
              </Btn>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-warning">El enlace es demasiado largo para generar el código QR.</p>
        )}
      </div>
    </Panel>
  );
}

function RulesForm({ rules, onSave }: { rules: BookingRules; onSave: (rules: BookingRules) => void }) {
  const [min, setMin] = useState(String(rules.minNoticeHours));
  const [max, setMax] = useState(String(rules.maxAdvanceDays));
  const [cancel, setCancel] = useState(String(rules.cancelHours));
  const [confirm, setConfirm] = useState(rules.requireConfirmation);
  const [error, setError] = useState("");
  const draft: BookingRules = { minNoticeHours: Number(min), maxAdvanceDays: Number(max), cancelHours: Number(cancel), requireConfirmation: confirm };

  return (
    <Panel title="Reglas de reserva">
      <form
        noValidate
        aria-label="Reglas de reserva"
        className="flex flex-col gap-4 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const problem = [min, max, cancel].some((v) => v.trim() === "") ? "Completa todas las reglas." : validateRules(draft);
          if (problem) return setError(problem);
          setError("");
          onSave(draft);
        }}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Anticipación mínima (horas)">
            {(id) => <input id={id} type="number" min={0} max={72} className={inputClass} value={min} onChange={(e) => setMin(e.target.value)} />}
          </Field>
          <Field label="Anticipación máxima (días)">
            {(id) => <input id={id} type="number" min={1} max={90} className={inputClass} value={max} onChange={(e) => setMax(e.target.value)} />}
          </Field>
          <Field label="Cancelar hasta (horas antes)">
            {(id) => <input id={id} type="number" min={0} max={72} className={inputClass} value={cancel} onChange={(e) => setCancel(e.target.value)} />}
          </Field>
        </div>
        <label className="flex items-start gap-2 text-text">
          <input type="checkbox" className="mt-1" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
          <span>
            Confirmar cada reserva antes de agendarla
            <span className="block text-[12px] text-text-subtle">Si lo desactivas, las reservas entran directo a la agenda como confirmadas.</span>
          </span>
        </label>
        {!validateRules(draft) && (
          <p className="rounded-md bg-surface px-3 py-2 text-[13px] text-text-muted">
            Tus clientes verán: “{rulesSummary(draft)} {cancelSummary(draft)}”
          </p>
        )}
        <FormError>{error}</FormError>
        <div className="flex justify-end">
          <Btn variant="primary" type="submit">
            Guardar reglas
          </Btn>
        </div>
      </form>
    </Panel>
  );
}

function BusinessForm({ business, onSave }: { business: BusinessSettings; onSave: (b: BusinessSettings) => void }) {
  const [draft, setDraft] = useState(business);
  const [error, setError] = useState("");
  const set = (key: keyof BusinessSettings) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  return (
    <Panel title="Datos del negocio">
      <form
        noValidate
        aria-label="Datos del negocio"
        className="flex flex-col gap-4 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const problem = validateBusiness(draft);
          if (problem) return setError(problem);
          setError("");
          onSave({ name: draft.name.trim(), address: draft.address.trim(), phone: draft.phone.trim(), welcome: draft.welcome.trim() });
        }}
      >
        <p className="text-text-muted">Aparecen en la página de reservas, en los comprobantes y en los recordatorios.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre del negocio">{(id) => <input id={id} className={inputClass} value={draft.name} onChange={set("name")} maxLength={60} />}</Field>
          <Field label="Teléfono del negocio">{(id) => <input id={id} className={inputClass} value={draft.phone} onChange={set("phone")} inputMode="tel" maxLength={20} />}</Field>
          <Field label="Dirección" className="sm:col-span-2">
            {(id) => <input id={id} className={inputClass} value={draft.address} onChange={set("address")} maxLength={120} />}
          </Field>
          <Field label="Mensaje de bienvenida" hint={`${draft.welcome.length}/240 caracteres`} className="sm:col-span-2">
            {(id) => <textarea id={id} rows={3} className={inputClass} value={draft.welcome} onChange={set("welcome")} maxLength={240} />}
          </Field>
        </div>
        <FormError>{error}</FormError>
        <div className="flex justify-end">
          <Btn variant="primary" type="submit">
            Guardar datos
          </Btn>
        </div>
      </form>
    </Panel>
  );
}
