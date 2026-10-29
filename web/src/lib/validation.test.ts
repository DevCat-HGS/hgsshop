import { describe, expect, it } from "vitest";
import { hasErrors, validateContactMessage, validateQuoteRequest, type QuoteRequest } from "@/lib/validation";

const validQuote: QuoteRequest = {
  name: "Ana Pérez",
  email: "ana@empresa.com",
  company: "",
  product: "stockflow",
  projectType: "producto-catalogo",
  problem: "Controlamos el inventario en hojas de cálculo y siempre está desactualizado.",
  budget: "500-2000",
  timeline: "1-3-meses",
  consent: true,
};

describe("validateQuoteRequest", () => {
  it("acepta una solicitud completa y válida", () => {
    expect(hasErrors(validateQuoteRequest(validQuote, ["stockflow"]))).toBe(false);
  });

  it("exige consentimiento", () => {
    expect(validateQuoteRequest({ ...validQuote, consent: false }, ["stockflow"]).consent).toBeDefined();
  });

  it("rechaza correos mal formados", () => {
    expect(validateQuoteRequest({ ...validQuote, email: "ana@empresa" }, ["stockflow"]).email).toBeDefined();
  });

  it("rechaza descripciones demasiado cortas, ignorando espacios", () => {
    expect(validateQuoteRequest({ ...validQuote, problem: "   corto   " }, ["stockflow"]).problem).toBeDefined();
  });

  it("rechaza valores de select que no están en la lista (p. ej. un envío manipulado)", () => {
    const errors = validateQuoteRequest({ ...validQuote, budget: "1000000", product: "no-existe" }, ["stockflow"]);
    expect(errors.budget).toBeDefined();
    expect(errors.product).toBeDefined();
  });

  it("permite no indicar producto de referencia", () => {
    expect(validateQuoteRequest({ ...validQuote, product: "" }, ["stockflow"]).product).toBeUndefined();
  });
});

describe("validateContactMessage", () => {
  it("marca todos los campos obligatorios vacíos", () => {
    const errors = validateContactMessage({ name: "", email: "", subject: "", message: "", consent: false });
    expect(Object.keys(errors).sort()).toEqual(["consent", "email", "message", "name", "subject"]);
  });
});
