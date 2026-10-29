import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, amountInWords, groupsForAge, receiptLabel, validateSettings, type Group } from "./data";

describe("recibos", () => {
  it("numera con consecutivo de cuatro cifras", () => {
    expect(receiptLabel(1)).toBe("RC-0001");
    expect(receiptLabel(128)).toBe("RC-0128");
  });

  it("escribe el valor en letras", () => {
    expect(amountInWords(180_000)).toBe("Ciento ochenta mil pesos m/cte");
    expect(amountInWords(221_000)).toBe("Doscientos veintiún mil pesos m/cte");
    expect(amountInWords(1_000_000)).toBe("Un millón de pesos m/cte");
  });
});

describe("ajustes de la academia", () => {
  it("acepta los datos de ejemplo y campos opcionales vacíos", () => {
    expect(validateSettings(DEFAULT_SETTINGS)).toBeNull();
    expect(validateSettings({ name: "Mi academia", nit: "", address: "", city: "", phone: "", footer: "" })).toBeNull();
  });

  it("rechaza nombre corto, NIT y teléfono mal escritos y pie muy largo", () => {
    expect(validateSettings({ ...DEFAULT_SETTINGS, name: "AB" })).toMatch(/nombre/);
    expect(validateSettings({ ...DEFAULT_SETTINGS, nit: "12345" })).toMatch(/NIT/);
    expect(validateSettings({ ...DEFAULT_SETTINGS, nit: "9014567893" })).toBeNull();
    expect(validateSettings({ ...DEFAULT_SETTINGS, phone: "12" })).toMatch(/teléfono/);
    expect(validateSettings({ ...DEFAULT_SETTINGS, footer: "x".repeat(301) })).toMatch(/pie/);
  });
});

describe("inscripciones", () => {
  it("recomienda los grupos según la edad", () => {
    const g = (id: string, minAge: number, maxAge: number) => ({ id, minAge, maxAge }) as Group;
    expect(groupsForAge([g("a", 7, 10), g("b", 9, 12)], 9).map((x) => x.id)).toEqual(["a", "b"]);
    expect(groupsForAge([g("a", 7, 10)], 15)).toEqual([]);
  });
});
