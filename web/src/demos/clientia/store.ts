import { useEffect, useState } from "react";
import { usePersistentState } from "@/demos/kit/storage";
import { buildSeed, SLUG, validateSlot, type Appointment, type BookingRules, type BusinessSettings, type Client, type Professional, type ReminderSettings, type Schedule, type Service } from "./data";

/** Estado persistido de Clientia. La semilla se genera una vez por montaje (fechas relativas a hoy). */
export function useClientiaStore() {
  const [seed] = useState(buildSeed);
  const [clients, setClients] = usePersistentState<Client[]>(SLUG, "clientes.v1", () => seed.clients);
  const [services, setServices] = usePersistentState<Service[]>(SLUG, "servicios.v1", () => seed.services);
  const [professionals, setProfessionals] = usePersistentState<Professional[]>(SLUG, "profesionales.v1", () => seed.professionals);
  const [schedule, setSchedule] = usePersistentState<Schedule>(SLUG, "horario.v1", () => seed.schedule);
  const [appointments, setAppointments] = usePersistentState<Appointment[]>(SLUG, "citas.v2", () => seed.appointments);
  const [reminders, setReminders] = usePersistentState<ReminderSettings>(SLUG, "recordatorios.v1", () => seed.reminders);
  const [rules, setRules] = usePersistentState<BookingRules>(SLUG, "reglas-reserva.v1", () => seed.rules);
  const [business, setBusiness] = usePersistentState<BusinessSettings>(SLUG, "negocio.v1", () => seed.business);
  const now = useNow();

  return {
    clients,
    setClients,
    services,
    setServices,
    professionals,
    setProfessionals,
    schedule,
    setSchedule,
    appointments,
    setAppointments,
    reminders,
    setReminders,
    rules,
    setRules,
    business,
    setBusiness,
    now,
  };
}

export type ClientiaStore = ReturnType<typeof useClientiaStore>;

/** Hora actual, refrescada cada minuto para que "pasado" y "programado" se actualicen solos. */
function useNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

/** Pasa una solicitud en línea a programada (entra a los recordatorios). Devuelve el motivo si ya no se puede. */
export function confirmRequest(store: ClientiaStore, appt: Appointment): string | null {
  if (appt.start <= store.now) return "La hora de esta solicitud ya pasó: recházala o reprográmala desde la cita.";
  const problem = validateSlot(appt, store);
  if (problem) return `No se puede confirmar: ${problem}`;
  store.setAppointments((list) => list.map((a) => (a.id === appt.id ? { ...a, status: "scheduled" } : a)));
  return null;
}

/** Rechaza una solicitud con su motivo; la franja vuelve a quedar libre. */
export function rejectRequest(store: ClientiaStore, id: string, reason: string) {
  store.setAppointments((list) => list.map((a) => (a.id === id ? { ...a, status: "rejected", reason } : a)));
}
