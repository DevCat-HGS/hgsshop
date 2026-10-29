import { useState } from "react";
import { formatMoney } from "@/demos/kit/format";
import { uid } from "@/demos/kit/storage";
import { Btn, ConfirmButton, Dialog, Empty, Field, FormError, inputClass, Table, type Tone } from "@/demos/kit/ui";
import { durationLabel, TONE_DOT, TONES, type Service } from "./data";
import type { ClientiaStore } from "./store";

const DURATIONS = [30, 60, 90, 120, 150, 180, 240];

export function Services({
  store,
  notify,
  creating,
  onCreatingChange,
  focus,
}: {
  store: ClientiaStore;
  notify: (msg: string) => void;
  creating: boolean;
  onCreatingChange: (open: boolean) => void;
  /** Servicio a abrir en edición, pedido desde la búsqueda global (objeto nuevo en cada petición). */
  focus: { id: string } | null;
}) {
  const { services, appointments, now } = store;
  const [editing, setEditing] = useState<Service | null>(null);

  const [handledFocus, setHandledFocus] = useState<{ id: string } | null>(null);
  if (focus && focus !== handledFocus) {
    setHandledFocus(focus);
    setEditing(services.find((s) => s.id === focus.id) ?? null);
  }

  function remove(service: Service) {
    store.setServices((list) => list.filter((s) => s.id !== service.id));
    notify(`Servicio "${service.name}" eliminado`);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">La duración define cuántas franjas de 30 minutos ocupa la cita en la agenda. Los cambios de precio o duración aplican a las citas nuevas.</p>
      {services.length === 0 ? (
        <div className="rounded-lg border border-border bg-bg">
          <Empty>No hay servicios. Crea uno para poder agendar citas.</Empty>
        </div>
      ) : (
        <Table label="Servicios" head={["Servicio", "Duración", "Precio", "Citas próximas", "Acciones"]} minWidth="40rem">
          {services.map((s) => {
            const upcoming = appointments.filter((a) => a.serviceId === s.id && (a.status === "scheduled" || a.status === "pending") && a.start > now).length;
            return (
              <tr key={s.id}>
                <th scope="row" className="font-semibold text-text">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${TONE_DOT[s.tone]}`} />
                    {s.name}
                  </span>
                </th>
                <td className="whitespace-nowrap">{durationLabel(s.duration)}</td>
                <td className="tabular-nums">{formatMoney(s.price)}</td>
                <td className="tabular-nums">{upcoming}</td>
                <td className="whitespace-nowrap">
                  <Btn size="sm" variant="ghost" onClick={() => setEditing(s)} aria-label={`Editar "${s.name}"`}>
                    Editar
                  </Btn>
                  <ConfirmButton
                    label="Eliminar"
                    ariaLabel={`Eliminar "${s.name}"`}
                    title="Eliminar servicio"
                    message={
                      upcoming
                        ? `"${s.name}" tiene ${upcoming} ${upcoming === 1 ? "cita próxima" : "citas próximas"}. Esas citas se conservan con su duración y precio actuales, pero ya no podrás agendar este servicio.`
                        : `Se eliminará "${s.name}". El historial de citas pasadas se conserva.`
                    }
                    onConfirm={() => remove(s)}
                  />
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      <Dialog
        open={creating || editing !== null}
        onClose={() => {
          setEditing(null);
          onCreatingChange(false);
        }}
        title={editing ? "Editar servicio" : "Nuevo servicio"}
      >
        {(creating || editing) && (
          <ServiceFields
            key={editing?.id ?? "nuevo"}
            service={editing}
            store={store}
            onClose={() => {
              setEditing(null);
              onCreatingChange(false);
            }}
            notify={notify}
          />
        )}
      </Dialog>
    </div>
  );
}

function ServiceFields({ service, store, onClose, notify }: { service: Service | null; store: ClientiaStore; onClose: () => void; notify: (msg: string) => void }) {
  const [name, setName] = useState(service?.name ?? "");
  const [duration, setDuration] = useState(String(service?.duration ?? 60));
  const [price, setPrice] = useState(service ? String(service.price) : "");
  const [tone, setTone] = useState<Tone>(service?.tone ?? "brand");
  const [error, setError] = useState("");

  function save() {
    const amount = Number(price);
    if (name.trim().length < 3) return setError("Escribe el nombre del servicio (mínimo 3 letras).");
    if (store.services.some((s) => s.id !== service?.id && s.name.trim().toLowerCase() === name.trim().toLowerCase())) return setError("Ya existe un servicio con ese nombre.");
    if (!price.trim() || !Number.isFinite(amount) || amount <= 0) return setError("Escribe un precio mayor que cero.");
    if (!Number.isInteger(amount)) return setError("El precio va en pesos, sin decimales.");

    const saved: Service = { id: service?.id ?? uid("s"), name: name.trim(), duration: Number(duration), price: amount, tone };
    store.setServices((list) => (service ? list.map((s) => (s.id === service.id ? saved : s)) : [...list, saved]));
    notify(service ? "Servicio actualizado" : "Servicio creado");
    onClose();
  }

  return (
    <form
      noValidate
      aria-label={service ? "Editar servicio" : "Nuevo servicio"}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" className="sm:col-span-2">
          {(id) => <input id={id} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}
        </Field>
        <Field label="Duración">
          {(id) => (
            <select id={id} className={inputClass} value={duration} onChange={(e) => setDuration(e.target.value)}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {durationLabel(d)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Precio (COP)" hint={Number(price) > 0 ? formatMoney(Number(price)) : undefined}>
          {(id) => <input id={id} type="number" min={0} step={1000} inputMode="numeric" className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} />}
        </Field>
        <fieldset className="min-w-0 sm:col-span-2">
          <legend className="text-[13px] font-semibold text-text-muted">Color en la agenda</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {TONES.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm has-focus-visible:outline-2 has-focus-visible:outline-brand ${tone === t.id ? "border-brand bg-brand-muted text-text" : "border-border-strong text-text-muted"}`}
              >
                <input type="radio" name="tono" value={t.id} checked={tone === t.id} onChange={() => setTone(t.id)} className="sr-only" />
                <span aria-hidden="true" className={`size-3 rounded-full ${TONE_DOT[t.id]}`} />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="mt-3">
        <FormError>{error}</FormError>
      </div>
      <div className="-mx-5 mt-5 -mb-4 flex justify-end gap-2 border-t border-border px-5 py-3">
        <Btn variant="ghost" onClick={onClose}>
          Cancelar
        </Btn>
        <Btn variant="primary" type="submit">
          Guardar
        </Btn>
      </div>
    </form>
  );
}
