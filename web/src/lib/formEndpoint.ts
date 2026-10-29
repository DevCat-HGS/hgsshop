import { site } from "@/config/site";

/**
 * Envío de los formularios al admin de hgsportafolio.site (`/api/shop-form`, repo DevCat-HGS): ahí se validan otra
 * vez, se limitan por dirección y por día, se guardan en la bandeja "Mensajes" y salen dos correos (el aviso para mí y
 * la confirmación para quien escribe). Los campos extra van ya con su etiqueta legible, así el admin los muestra tal
 * cual sin conocer cada formulario.
 */
export type FormKind = "cotizacion" | "contacto";

export interface FormPayload {
  name: string;
  email: string;
  /** El texto principal: el problema en una cotización, el mensaje en un contacto. */
  message: string;
  /** Campos extra en el orden del formulario, como [etiqueta, valor legible]. Los vacíos se omiten. */
  fields: [string, string][];
  /** Campo trampa: las personas nunca lo ven ni lo llenan. */
  botField: string;
}

export class FormSubmissionError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function submitForm(kind: FormKind, payload: FormPayload, elapsedMs: number): Promise<void> {
  const response = await fetch(site.forms.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      name: payload.name,
      email: payload.email,
      message: payload.message,
      fields: payload.fields.filter(([, value]) => value.trim() !== ""),
      "bot-field": payload.botField,
      // Tiempo que tomó llenar el formulario: un envío instantáneo es de un bot.
      elapsed: Math.round(elapsedMs),
    }),
  });

  if (!response.ok) {
    throw new FormSubmissionError(`El envío falló con estado ${response.status}.`, response.status);
  }
}
