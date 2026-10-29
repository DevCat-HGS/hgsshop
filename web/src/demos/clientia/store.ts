import { useEffect, useState } from "react";
import { usePersistentState } from "@/demos/kit/storage";
import { buildSeed, SLUG, type Appointment, type Client, type Professional, type ReminderSettings, type Schedule, type Service } from "./data";

/** Estado persistido de Clientia. La semilla se genera una vez por montaje (fechas relativas a hoy). */
export function useClientiaStore() {
  const [seed] = useState(buildSeed);
  const [clients, setClients] = usePersistentState<Client[]>(SLUG, "clientes.v1", () => seed.clients);
  const [services, setServices] = usePersistentState<Service[]>(SLUG, "servicios.v1", () => seed.services);
  const [professionals, setProfessionals] = usePersistentState<Professional[]>(SLUG, "profesionales.v1", () => seed.professionals);
  const [schedule, setSchedule] = usePersistentState<Schedule>(SLUG, "horario.v1", () => seed.schedule);
  const [appointments, setAppointments] = usePersistentState<Appointment[]>(SLUG, "citas.v1", () => seed.appointments);
  const [reminders, setReminders] = usePersistentState<ReminderSettings>(SLUG, "recordatorios.v1", () => seed.reminders);
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
