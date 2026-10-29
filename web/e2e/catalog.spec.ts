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
    await expect(page.getByRole("link", { name: /ver detalle/i })).toHaveCount(11);

    await page.getByLabel("Categoría").selectOption("herramientas-dev");
    await expect(page).toHaveURL(/categoria=herramientas-dev/);
    await expect(page.getByRole("link", { name: /ver detalle/i })).toHaveCount(1);
    await expect(page.getByRole("main").getByRole("link", { name: "TaskPro: ver detalle" })).toBeVisible();
  });

  test("las tarjetas con demo la abren en una pestaña nueva; las demás no la ofrecen", async ({ page }) => {
    await page.goto("/productos");
    const demos = page.getByRole("link", { name: /^Probar demo de .* \(se abre en una pestaña nueva\)$/ });
    await expect(demos).toHaveCount(4);
    await expect(page.getByRole("link", { name: /Probar demo de FlowAuto/ })).toHaveCount(0);

    const [demo] = await Promise.all([page.waitForEvent("popup"), page.getByRole("link", { name: /Probar demo de RoboAcademy/ }).click()]);
    await expect(demo).toHaveURL(/\/demos\/roboacademy$/);
    await expect(demo.getByRole("note", { name: "Entorno de demostración" })).toBeVisible();
    await expect(page).toHaveURL(/\/productos$/);
  });

  test("el campo de búsqueda sigue a la URL y los parámetros inválidos se ignoran", async ({ page }) => {
    await page.goto("/productos?q=agenda");
    const search = page.getByRole("main").getByRole("searchbox");
    await expect(search).toHaveValue("agenda");
    await page.goto("/productos?q=agenda&pagina=abc&estado=xyz&orden=zzz");
    await expect(page.getByRole("link", { name: "Clientia: ver detalle" })).toBeVisible();
    // En móvil el enlace está dentro del menú.
    const mobile = (page.viewportSize()?.width ?? 1280) < 768;
    if (mobile) await page.getByRole("button", { name: "Abrir menú" }).click();
    const nav = page.getByRole("navigation", { name: mobile ? "Navegación principal (móvil)" : "Navegación principal", exact: true });
    await nav.getByRole("link", { name: "Productos", exact: true }).click();
    await expect(page).toHaveURL(/\/productos$/);
    await expect(search).toHaveValue("");
    await expect(page.getByRole("link", { name: /ver detalle/i })).toHaveCount(11);
  });

  test("muestra un estado vacío cuando nada coincide", async ({ page }) => {
    await page.goto("/productos?q=zzqx-wvkj");
    await expect(page.getByText("No encontramos productos con esos filtros")).toBeVisible();
  });

  test("el detalle de un servicio a medida muestra su estado real y no finge una demo", async ({ page }) => {
    await page.goto("/productos/flowauto");
    await expect(page.getByRole("heading", { level: 1, name: "FlowAuto" })).toBeVisible();
    await expect(page.getByText("Bajo cotización").first()).toBeVisible();
    await expect(page.getByText("Demo aún no disponible")).toBeVisible();
    await expect(page.getByRole("link", { name: /Abrir demo/ })).toHaveCount(0);
    await expect(page).toHaveTitle("FlowAuto · HGS Digital");
  });

  test("una idea en exploración no aparenta ser un producto", async ({ page }) => {
    await page.goto("/productos/mostrador");
    await expect(page.getByText("Idea en exploración").first()).toBeVisible();
    await expect(page.getByText("Todavía es una idea")).toBeVisible();
    await expect(page.getByText("Todavía sin precio")).toBeVisible();
    await expect(page.getByRole("link", { name: "Solicitar sesión guiada" })).toHaveCount(0);
  });

  test("una ruta inexistente muestra la página 404 y no se indexa", async ({ page }) => {
    await page.goto("/productos/no-existe");
    await expect(page.getByRole("heading", { name: "Esta página no existe" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});

test.describe("demo de TaskPro", () => {
  test("se abre desde el producto en una pestaña nueva, a pantalla completa", async ({ page: product }) => {
    await product.goto("/productos/taskpro");
    const [page] = await Promise.all([product.waitForEvent("popup"), product.getByRole("link", { name: /Abrir demo/ }).click()]);
    await expect(page).toHaveURL(/\/demos\/taskpro$/);
    await expect(product).toHaveURL(/\/productos\/taskpro$/);
    await expect(page.getByRole("note", { name: "Entorno de demostración" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Secciones de TaskPro" })).toBeVisible();
    // La demo ocupa la pestaña: sin la cabecera del sitio.
    await expect(page.getByRole("navigation", { name: "Navegación principal", exact: true })).toHaveCount(0);
  });
});

test.describe("navegación", () => {
  test("Volver regresa a la página anterior", async ({ page }) => {
    await page.goto("/productos");
    await page.getByRole("link", { name: "TaskPro: ver detalle" }).click();
    await expect(page).toHaveURL(/\/productos\/taskpro$/);

    await page.getByRole("button", { name: "Volver" }).click();
    await expect(page).toHaveURL(/\/productos$/);
  });

  test("sin historial, Volver lleva a la página padre", async ({ page }) => {
    await page.goto("/productos/taskpro");
    await page.getByRole("button", { name: "Volver" }).click();
    await expect(page).toHaveURL(/\/productos$/);
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
