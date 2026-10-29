import { expect, test, type Page } from "@playwright/test";

// Los formularios envían al admin del portafolio (/api/shop-form). Aquí se intercepta ese POST para comprobar qué
// envía la app y cómo reacciona al éxito, al error y al límite; el envío real se verifica en producción.
type Sent = { kind: string; name: string; email: string; message: string; fields: [string, string][]; elapsed: number };

async function interceptFormPost(page: Page, status: number) {
  const bodies: Sent[] = [];
  await page.route("https://admin.hgsportafolio.site/api/shop-form", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    bodies.push(JSON.parse(route.request().postData() ?? "{}") as Sent);
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(status === 200 ? { ok: true } : { error: "x" }) });
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
  const sent = bodies[0];
  expect(sent.kind).toBe("cotizacion");
  expect(sent.email).toBe("ana@empresa.com");
  expect(sent.message).toBe("Necesitamos un panel para gestionar pedidos de clientes.");
  // Llegan las etiquetas que la persona vio, no los códigos de cada opción; los campos vacíos no viajan.
  expect(sent.fields).toEqual([
    ["Tipo de proyecto", "Aplicación web"],
    ["Producto de referencia", "Clientia"],
    ["Presupuesto orientativo", "Entre 500 y 2.000 USD"],
    ["Plazo deseado", "Entre 1 y 3 meses"],
  ]);
  expect(sent.elapsed).toBeGreaterThan(0);
});

test("si llegan demasiados envíos seguidos, lo dice y sugiere esperar", async ({ page }) => {
  await interceptFormPost(page, 429);
  await page.goto("/desarrollo-a-medida");
  await fillQuoteForm(page);
  await page.getByRole("button", { name: "Enviar solicitud" }).click();

  await expect(page.getByText(/Llegaron varios envíos seguidos/)).toBeVisible();
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
  await page.getByRole("textbox", { name: /^Mensaje/ }).fill("¿TaskPro tendrá versión para equipos?");
  await page.getByLabel(/Acepto que/).check();
  await page.getByRole("button", { name: "Enviar mensaje" }).click();

  await expect(page.getByText("Mensaje enviado.")).toBeVisible();
  expect(bodies[0]).toMatchObject({
    kind: "contacto",
    name: "Luis",
    message: "¿TaskPro tendrá versión para equipos?",
    fields: [["Asunto", "Sobre un producto del catálogo"]],
  });
});
