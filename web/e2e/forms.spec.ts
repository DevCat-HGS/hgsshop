import { expect, test, type Page } from "@playwright/test";

// En desarrollo no existe el endpoint de Netlify Forms: se intercepta el POST a "/" para comprobar
// qué envía la app y cómo reacciona al éxito y al error. El envío real se verifica en un deploy preview.
async function interceptFormPost(page: Page, status: number) {
  const bodies: string[] = [];
  await page.route("/", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    bodies.push(route.request().postData() ?? "");
    await route.fulfill({ status, body: "" });
  });
  return bodies;
}

async function fillQuoteForm(page: Page) {
  await page.getByLabel("Nombre").fill("Ana Pérez");
  await page.getByLabel("Correo electrónico").fill("ana@empresa.com");
  await page.getByLabel("Tipo de proyecto").selectOption("app-web");
  await page.getByLabel("¿Qué problema quieres resolver?").fill("Necesitamos un panel para gestionar pedidos de clientes.");
  await page.getByLabel("Presupuesto orientativo").selectOption("500-2000");
  await page.getByLabel("Plazo deseado").selectOption("1-3-meses");
  await page.getByLabel(/Acepto que/).check();
}

test("la cotización valida antes de enviar", async ({ page }) => {
  const bodies = await interceptFormPost(page, 200);
  await page.goto("/desarrollo-a-medida");
  await page.getByRole("button", { name: "Enviar solicitud" }).click();

  await expect(page.getByText("Revisa los campos marcados antes de enviar.")).toBeVisible();
  await expect(page.getByText("El nombre debe tener al menos 2 caracteres.")).toBeVisible();
  expect(bodies).toHaveLength(0);
});

test("la cotización se envía con el producto preseleccionado desde su página", async ({ page }) => {
  const bodies = await interceptFormPost(page, 200);
  await page.goto("/productos/clientia");
  await page.locator("aside").getByRole("link", { name: "Solicitar cotización" }).click();

  await expect(page.getByLabel("Producto de referencia")).toHaveValue("clientia");
  await fillQuoteForm(page);
  await page.getByRole("button", { name: "Enviar solicitud" }).click();

  await expect(page.getByText("Recibí tu solicitud.")).toBeVisible();
  const sent = new URLSearchParams(bodies[0]);
  expect(sent.get("form-name")).toBe("cotizacion");
  expect(sent.get("product")).toBe("clientia");
  expect(sent.get("email")).toBe("ana@empresa.com");
});

test("un fallo del servidor se informa sin perder lo escrito", async ({ page }) => {
  await interceptFormPost(page, 500);
  await page.goto("/desarrollo-a-medida");
  await fillQuoteForm(page);
  await page.getByRole("button", { name: "Enviar solicitud" }).click();

  await expect(page.getByText("No se pudo enviar la solicitud.")).toBeVisible();
  await expect(page.getByLabel("Nombre")).toHaveValue("Ana Pérez");
});

test("el formulario de contacto se envía", async ({ page }) => {
  const bodies = await interceptFormPost(page, 200);
  await page.goto("/contacto");
  await page.getByLabel("Nombre").fill("Luis");
  await page.getByLabel("Correo electrónico").fill("luis@correo.com");
  await page.getByLabel("Asunto").selectOption("producto");
  await page.getByRole("textbox", { name: /^Mensaje/ }).fill("¿DevPanel tendrá versión para equipos?");
  await page.getByLabel(/Acepto que/).check();
  await page.getByRole("button", { name: "Enviar mensaje" }).click();

  await expect(page.getByText("Mensaje enviado.")).toBeVisible();
  expect(new URLSearchParams(bodies[0]).get("form-name")).toBe("contacto");
});
