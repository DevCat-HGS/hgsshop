import { describe, expect, it } from "vitest";
import {
  atMinutes,
  bookableSlots,
  bookOnline,
  cancelOnline,
  DEFAULT_RULES,
  receiptNumber,
  validateBusiness,
  validateRules,
  type Appointment,
  type BookingState,
  type DaySchedule,
} from "./data";

const open = (start: number, end: number): DaySchedule => ({ open: true, start, end, hasBreak: true, breakStart: 12 * 60, breakEnd: 13 * 60 });
const closed: DaySchedule = { open: false, start: 0, end: 0, hasBreak: false, breakStart: 0, breakEnd: 0 };

// Lunes 2 de noviembre de 2026, 8:00 a. m. (hora local).
const NOW = new Date(2026, 10, 2, 8, 0).getTime();
const TUESDAY = new Date(2026, 10, 3).getTime();

function state(overrides: Partial<BookingState> = {}): BookingState {
  return {
    now: NOW,
    rules: { ...DEFAULT_RULES, minNoticeHours: 2, maxAdvanceDays: 7, cancelHours: 12 },
    schedule: [closed, open(8 * 60, 18 * 60), open(8 * 60, 18 * 60), open(8 * 60, 18 * 60), open(8 * 60, 18 * 60), open(8 * 60, 18 * 60), closed],
    professionals: [
      { id: "p-1", name: "Ana", role: "", days: [1, 2, 3, 4, 5] },
      { id: "p-2", name: "Bea", role: "", days: [2, 3] },
    ],
    services: [{ id: "s-1", name: "Limpieza", duration: 60, price: 100_000, tone: "brand" }],
    clients: [{ id: "c-1", name: "Laura Gómez", phone: "300 555 0101", email: "", notes: "", channel: "whatsapp" }],
    appointments: [],
    ...overrides,
  };
}

const appt = (over: Partial<Appointment>): Appointment => ({
  id: "a-1",
  clientId: "c-1",
  serviceId: "s-1",
  serviceName: "Limpieza",
  duration: 60,
  price: 100_000,
  professionalId: "p-1",
  start: atMinutes(TUESDAY, 9 * 60),
  note: "",
  status: "scheduled",
  ...over,
});

describe("horas reservables en línea", () => {
  it("respeta la anticipación mínima, el descanso y el cierre del día", () => {
    const s = state();
    const today = bookableSlots(s, s.services[0], "p-1", NOW, s.rules, NOW).map((x) => x.start);
    // Desde las 10:00 (2 horas de anticipación), sin cruzar el descanso de 12 a 1 ni pasar de las 6.
    expect(today[0]).toBe(atMinutes(NOW, 10 * 60));
    expect(today).not.toContain(atMinutes(NOW, 11 * 60 + 30));
    expect(today).not.toContain(atMinutes(NOW, 12 * 60));
    expect(today.at(-1)).toBe(atMinutes(NOW, 17 * 60));
  });

  it("no ofrece días más allá de la anticipación máxima", () => {
    const s = state({ rules: { ...DEFAULT_RULES, minNoticeHours: 0, maxAdvanceDays: 1 } });
    const wednesday = new Date(2026, 10, 4).getTime();
    expect(bookableSlots(s, s.services[0], "any", TUESDAY, s.rules, NOW).length).toBeGreaterThan(0);
    expect(bookableSlots(s, s.services[0], "any", wednesday, s.rules, NOW)).toEqual([]);
  });

  it("con 'cualquiera' asigna a la profesional libre", () => {
    const s = state({ appointments: [appt({})] });
    const slot = bookableSlots(s, s.services[0], "any", TUESDAY, s.rules, NOW).find((x) => x.start === atMinutes(TUESDAY, 9 * 60));
    expect(slot?.professionalId).toBe("p-2");
    // Una solicitud por confirmar también bloquea la franja; una rechazada la libera.
    const busy = state({ appointments: [appt({ status: "pending" }), appt({ id: "a-2", professionalId: "p-2", status: "pending" })] });
    expect(bookableSlots(busy, busy.services[0], "any", TUESDAY, busy.rules, NOW).some((x) => x.start === atMinutes(TUESDAY, 9 * 60))).toBe(false);
    const freed = state({ appointments: [appt({ status: "rejected" })] });
    expect(bookableSlots(freed, freed.services[0], "p-1", TUESDAY, freed.rules, NOW).some((x) => x.start === atMinutes(TUESDAY, 9 * 60))).toBe(true);
  });
});

describe("reserva en línea", () => {
  const req = { serviceId: "s-1", professionalId: "any", start: atMinutes(TUESDAY, 10 * 60), name: "  Sofía   Ramírez ", phone: "311 222 3344" };

  it("crea la cita por confirmar y un cliente nuevo", () => {
    const result = bookOnline(state(), req);
    if ("error" in result) throw new Error(result.error);
    expect(result.appointment).toMatchObject({ status: "pending", source: "online", requestedAt: NOW, serviceName: "Limpieza", price: 100_000 });
    expect(result.isNewClient).toBe(true);
    expect(result.client).toMatchObject({ name: "Sofía Ramírez", phone: "311 222 3344", channel: "whatsapp" });
  });

  it("reconoce al cliente por su teléfono y entra confirmada si no se exige confirmación", () => {
    const s = state({ rules: { ...state().rules, requireConfirmation: false } });
    const result = bookOnline(s, { ...req, phone: "3005550101" });
    if ("error" in result) throw new Error(result.error);
    expect(result.isNewClient).toBe(false);
    expect(result.appointment.clientId).toBe("c-1");
    expect(result.appointment.status).toBe("scheduled");
  });

  it("valida los datos, las reglas y las franjas ocupadas", () => {
    expect(bookOnline(state(), { ...req, name: "Jo" })).toEqual({ error: expect.stringContaining("nombre") });
    expect(bookOnline(state(), { ...req, phone: "12ab" })).toEqual({ error: expect.stringContaining("teléfono") });
    expect(bookOnline(state(), { ...req, start: atMinutes(NOW, 9 * 60) })).toEqual({ error: expect.stringContaining("anticipación") });
    expect(bookOnline(state(), { ...req, start: new Date(2026, 10, 20, 10).getTime() })).toEqual({ error: expect.stringContaining("7 días") });
    const full = state({ appointments: [appt({ start: req.start }), appt({ id: "a-2", clientId: "c-9", professionalId: "p-2", start: req.start })] });
    expect(bookOnline(full, req)).toEqual({ error: expect.stringContaining("acaba de ocuparse") });
    const mine = state({ appointments: [appt({ start: req.start })] });
    expect(bookOnline(mine, { ...req, phone: "300 555 0101" })).toEqual({ error: expect.stringContaining("Ya tienes una cita") });
  });
});

describe("cancelación en línea", () => {
  const booked = appt({ id: "a-7f3c19ab", start: atMinutes(TUESDAY, 15 * 60), status: "pending" });

  it("cancela con teléfono y código dentro del plazo", () => {
    const result = cancelOnline(state({ appointments: [booked] }), "300-555-0101", `#${receiptNumber(booked).toLowerCase()}`);
    if ("error" in result) throw new Error(result.error);
    expect(result.appointment.status).toBe("cancelled");
  });

  it("rechaza fuera del plazo, con datos que no coinciden o si ya no está activa", () => {
    const soon = appt({ id: "a-1", start: atMinutes(NOW, 15 * 60) });
    expect(cancelOnline(state({ appointments: [soon] }), "3005550101", receiptNumber(soon))).toEqual({ error: expect.stringContaining("12 horas") });
    expect(cancelOnline(state({ appointments: [booked] }), "3110000000", receiptNumber(booked))).toEqual({ error: expect.stringContaining("No encontramos") });
    const done = { ...booked, status: "cancelled" as const };
    expect(cancelOnline(state({ appointments: [done] }), "3005550101", receiptNumber(done))).toEqual({ error: expect.stringContaining("ya no está activa") });
  });
});

describe("ajustes", () => {
  it("valida las reglas de reserva", () => {
    expect(validateRules(DEFAULT_RULES)).toBeNull();
    expect(validateRules({ ...DEFAULT_RULES, minNoticeHours: -1 })).toMatch(/mínima/);
    expect(validateRules({ ...DEFAULT_RULES, minNoticeHours: 1.5 })).toMatch(/mínima/);
    expect(validateRules({ ...DEFAULT_RULES, maxAdvanceDays: 0 })).toMatch(/máxima/);
    expect(validateRules({ ...DEFAULT_RULES, minNoticeHours: 48, maxAdvanceDays: 2 })).toMatch(/nadie podría reservar/);
    expect(validateRules({ ...DEFAULT_RULES, cancelHours: 100 })).toMatch(/cancelación/);
  });

  it("valida los datos del negocio", () => {
    const ok = { name: "Estudio Brisa", address: "Calle 10", phone: "604 555 0190", welcome: "Hola" };
    expect(validateBusiness(ok)).toBeNull();
    expect(validateBusiness({ ...ok, name: " " })).toMatch(/nombre/);
    expect(validateBusiness({ ...ok, phone: "abc" })).toMatch(/teléfono/);
    expect(validateBusiness({ ...ok, phone: "" })).toBeNull();
    expect(validateBusiness({ ...ok, welcome: "x".repeat(241) })).toMatch(/bienvenida/);
  });
});
