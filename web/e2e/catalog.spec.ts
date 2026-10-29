import { expect, test } from "@playwright/test";

test.describe("descubrimiento de productos", () => {
  test("la portada busca en el catálogo mientras se escribe", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/HGS Digital/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Software que se\s*puede probar/);

    const buscador = page.locator("#buscador");
    await buscador.getByLabel("Describe lo que necesitas resolver").fill("academia de robótica");
    await expect(buscador.getByRole("link", { name: /RoboAcademy/ })).toBeVisible();

    await buscador.getByRole("button", { name: "agenda de citas" }).click();
    await expect(buscador.getByRole("link", { name: /Clientia/ })).toBeVisible();

    await buscador.getByLabel("Describe lo que necesitas resolver").fill("zzz sin coincidencias");
    await expect(buscador.getByText("Nada del catálogo lo cubre todavía.")).toBeVisible();

    await buscador.getByLabel("Describe lo que necesitas resolver").fill("inventario");
    await buscador.getByRole("link", { name: "Ver todos los resultados en el catálogo" }).click();
    await expect(page).toHaveURL(/\/productos\?q=inventario/);
    // Esperar al catálogo: mientras carga, la portada (con su propio enlace a StockFlow) sigue en pantalla.
    await expect(page.getByRole("heading", { level: 1, name: "Todo lo que hay en el taller" })).toBeVisible();
    await expect(page.getByRole("link", { name: "StockFlow: ver detalle" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Clientia: ver detalle" })).toHaveCount(0);
  });

  test("los filtros cambian los resultados y quedan en la URL", async ({ page }) => {
    await page.goto("/productos");
    await expect(page.getByRole("link", { name: /ver detalle/i })).toHaveCount(5);

    await page.getByLabel("Categoría").selectOption("herramientas-dev");
    await expect(page).toHaveURL(/categoria=herramientas-dev/);
    await expect(page.getByRole("link", { name: /ver detalle/i })).toHaveCount(1);
    await expect(page.getByRole("main").getByRole("link", { name: /DevPanel/ })).toBeVisible();
  });

  test("muestra un estado vacío cuando nada coincide", async ({ page }) => {
    await page.goto("/productos?q=zzz-nada");
    await expect(page.getByText("No encontramos productos con esos filtros")).toBeVisible();
  });

  test("el detalle de un prototipo muestra su estado real y no finge una demo", async ({ page }) => {
    await page.goto("/productos/stockflow");
    await expect(page.getByRole("heading", { level: 1, name: "StockFlow" })).toBeVisible();
    await expect(page.getByText("Prototipo").first()).toBeVisible();
    await expect(page.getByText("Demo aún no disponible")).toBeVisible();
    await expect(page.getByRole("link", { name: "Abrir demo" })).toHaveCount(0);
    await expect(page).toHaveTitle("StockFlow · HGS Digital");
  });

  test("una ruta inexistente muestra la página 404 y no se indexa", async ({ page }) => {
    await page.goto("/productos/no-existe");
    await expect(page.getByRole("heading", { name: "Esta página no existe" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});

test.describe("demo de DevPanel", () => {
  test("se abre desde el producto y permite interactuar", async ({ page }) => {
    await page.goto("/productos/devpanel");
    await page.getByRole("link", { name: "Abrir demo" }).click();

    await expect(page.getByText("ENTORNO DE DEMOSTRACIÓN")).toBeVisible();
    await page.getByLabel("Nueva tarea").fill("Tarea creada en la prueba");
    await page.getByRole("button", { name: "Agregar" }).click();

    const pending = page.getByRole("region", { name: "Pendiente" });
    await expect(pending.getByText("Tarea creada en la prueba")).toBeVisible();

    await page.getByRole("button", { name: 'Eliminar "Tarea creada en la prueba"' }).click();
    await expect(page.getByText("Tarea creada en la prueba")).toHaveCount(0);
  });
});

test.describe("navegación", () => {
  test("Volver regresa a la página anterior", async ({ page }) => {
    await page.goto("/productos");
    await page.getByRole("link", { name: "DevPanel: ver detalle" }).click();
    await expect(page).toHaveURL(/\/productos\/devpanel$/);

    await page.getByRole("button", { name: "Volver" }).click();
    await expect(page).toHaveURL(/\/productos$/);
  });

  test("sin historial, Volver lleva a la página padre", async ({ page }) => {
    await page.goto("/demos/devpanel");
    await page.getByRole("button", { name: "Volver" }).click();
    await expect(page).toHaveURL(/\/productos\/devpanel$/);
  });

  test("el cierre solo aparece en la portada, que no tiene botón Volver", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "De tu problema al software que lo resuelve" })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Volver" })).toHaveCount(0);

    await page.goto("/contacto");
    await expect(page.getByRole("heading", { level: 1, name: "Hablemos" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "De tu problema al software que lo resuelve" })).toHaveCount(0);
  });
});

test.describe("accesibilidad básica", () => {
  test("el primer Tab enfoca el enlace para saltar al contenido", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Saltar al contenido principal" })).toBeFocused();
  });
});
