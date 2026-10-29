/**
 * Envío de formularios vía Netlify Forms: no hay backend propio todavía, pero el envío es real
 * (llega al panel de Forms de Netlify y, si se configura, a un correo). Requiere que exista un
 * <form> estático equivalente en index.html con el mismo `name` y los mismos campos, porque
 * Netlify detecta formularios analizando el HTML generado en el build, no el DOM en tiempo de
 * ejecución de una SPA. Ver `index.html` y `README.md`.
 */

function encode(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

export class FormSubmissionError extends Error {}

export async function submitNetlifyForm(formName: string, fields: Record<string, string>): Promise<void> {
  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encode({ "form-name": formName, ...fields }),
  });

  if (!response.ok) {
    throw new FormSubmissionError(`El envío falló con estado ${response.status}.`);
  }
}
