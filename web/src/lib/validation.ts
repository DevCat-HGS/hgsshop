/**
 * Reglas de validación de los formularios comerciales. Son funciones puras, sin dependencias del DOM
 * ni de React, para que el futuro backend (ver ARCHITECTURE.md, fase 2) pueda importarlas y validar
 * lo mismo del lado del servidor. El admin que recibe los formularios valida otra vez lo esencial (correo, campos).
 */

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function checkLength(value: string, min: number, max: number, label: string): string | undefined {
  const length = value.trim().length;
  if (length < min) return min === 1 ? `${label} es obligatorio.` : `${label} debe tener al menos ${min} caracteres.`;
  if (length > max) return `${label} no puede superar ${max} caracteres.`;
  return undefined;
}

function checkEmail(value: string): string | undefined {
  if (!value.trim()) return "El correo es obligatorio.";
  if (!EMAIL_PATTERN.test(value.trim())) return "Escribe un correo válido, por ejemplo nombre@empresa.com.";
  if (value.length > 254) return "El correo es demasiado largo.";
  return undefined;
}

export const budgetOptions = [
  { value: "menos-500", label: "Menos de 500 USD" },
  { value: "500-2000", label: "Entre 500 y 2.000 USD" },
  { value: "2000-5000", label: "Entre 2.000 y 5.000 USD" },
  { value: "mas-5000", label: "Más de 5.000 USD" },
  { value: "no-definido", label: "Todavía no lo tengo definido" },
] as const;

export const timelineOptions = [
  { value: "menos-1-mes", label: "Menos de 1 mes" },
  { value: "1-3-meses", label: "Entre 1 y 3 meses" },
  { value: "3-6-meses", label: "Entre 3 y 6 meses" },
  { value: "flexible", label: "Flexible" },
] as const;

export const projectTypeOptions = [
  { value: "producto-catalogo", label: "Contratar o adaptar un producto del catálogo" },
  { value: "app-web", label: "Aplicación web" },
  { value: "app-movil", label: "Aplicación móvil" },
  { value: "automatizacion", label: "Automatización de procesos" },
  { value: "integracion", label: "Integración con APIs o sistemas existentes" },
  { value: "otro", label: "Otro" },
] as const;

export const contactSubjectOptions = [
  { value: "consulta-general", label: "Consulta general" },
  { value: "producto", label: "Sobre un producto del catálogo" },
  { value: "colaboracion", label: "Colaboración o alianza" },
  { value: "otro", label: "Otro" },
] as const;

const valuesOf = (options: readonly { value: string }[]) => options.map((option) => option.value as string);

export interface QuoteRequest {
  name: string;
  email: string;
  company: string;
  product: string;
  projectType: string;
  problem: string;
  budget: string;
  timeline: string;
  consent: boolean;
}

export function validateQuoteRequest(data: QuoteRequest, knownProductSlugs: string[]): FieldErrors<QuoteRequest> {
  const errors: FieldErrors<QuoteRequest> = {};

  errors.name = checkLength(data.name, 2, 100, "El nombre");
  errors.email = checkEmail(data.email);
  if (data.company.trim().length > 120) errors.company = "El nombre de la empresa no puede superar 120 caracteres.";
  if (data.product && !knownProductSlugs.includes(data.product)) errors.product = "Selecciona un producto de la lista.";
  if (!valuesOf(projectTypeOptions).includes(data.projectType)) errors.projectType = "Selecciona el tipo de proyecto.";
  errors.problem = checkLength(data.problem, 20, 3000, "La descripción del problema");
  if (!valuesOf(budgetOptions).includes(data.budget)) errors.budget = "Selecciona un presupuesto orientativo.";
  if (!valuesOf(timelineOptions).includes(data.timeline)) errors.timeline = "Selecciona un plazo deseado.";
  if (!data.consent) errors.consent = "Necesitamos tu aceptación para poder responderte.";

  return stripEmpty(errors);
}

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
}

export function validateContactMessage(data: ContactMessage): FieldErrors<ContactMessage> {
  const errors: FieldErrors<ContactMessage> = {};

  errors.name = checkLength(data.name, 2, 100, "El nombre");
  errors.email = checkEmail(data.email);
  if (!valuesOf(contactSubjectOptions).includes(data.subject)) errors.subject = "Selecciona un asunto.";
  errors.message = checkLength(data.message, 10, 2000, "El mensaje");
  if (!data.consent) errors.consent = "Necesitamos tu aceptación para poder responderte.";

  return stripEmpty(errors);
}

function stripEmpty<T>(errors: FieldErrors<T>): FieldErrors<T> {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => Boolean(message))) as FieldErrors<T>;
}

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}
