import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Sin la fixture: aquí sí interesa la primera visita.
test("la primera visita abre un recorrido que se puede seguir y no vuelve a salir", async ({ page }) => {
  await page.goto("/demos/stockflow");
  const tour = page.getByRole("dialog", { name: "Bienvenido a StockFlow" });
  await expect(tour).toBeVisible();
  await expect(tour.getByText("Paso 1 de 4")).toBeVisible();
  await tour.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("dialog", { name: "Registra un movimiento" })).toBeVisible();
  await page.getByRole("button", { name: "Saltar recorrido" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("navigation", { name: "Secciones de StockFlow" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Se puede volver a abrir desde "Acerca de la demo".
  await page.getByRole("button", { name: "Acerca de la demo" }).click();
  await page.getByRole("button", { name: "Ver el recorrido" }).click();
  await expect(page.getByRole("dialog", { name: "Bienvenido a StockFlow" })).toBeVisible();
});

test("tras varias acciones reales invita a cotizar, una sola vez", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("hgs-demo-ui:tour:taskpro", "1"));
  await page.goto("/demos/taskpro?vista=tablero");
  const invite = page.getByRole("region", { name: "Invitación a cotizar" });
  await expect(page.getByRole("navigation", { name: "Secciones de TaskPro" })).toBeVisible();
  await expect(invite).toHaveCount(0);

  // Cinco tareas movidas de columna = cinco cambios guardados.
  const move = page.getByRole("button", { name: /^Mover ".+" a / });
  for (let i = 1; i <= 5; i++) {
    await move.first().click();
  }
  await expect(invite).toBeVisible();
  await expect(invite.getByRole("link", { name: "Pedir una cotización" })).toHaveAttribute("href", "/desarrollo-a-medida?producto=taskpro");
  await invite.getByRole("button", { name: "Cerrar invitación" }).click();
  await expect(invite).toHaveCount(0);

  await page.reload();
  await move.first().click();
  await expect(page.getByRole("navigation", { name: "Secciones de TaskPro" })).toBeVisible();
  await expect(invite).toHaveCount(0);
});

test("la copia de seguridad se descarga y se restaura, y rechaza la de otro producto", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("hgs-demo-ui:tour:taskpro", "1"));
  await page.goto("/demos/taskpro?vista=tablero");
  await expect(page.getByRole("navigation", { name: "Secciones de TaskPro" })).toBeVisible();

  await page.getByRole("button", { name: "Tus datos" }).click();
  const dialog = page.getByRole("dialog", { name: "Tus datos en esta demo" });
  const [download] = await Promise.all([page.waitForEvent("download"), dialog.getByRole("button", { name: "Descargar copia" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^taskpro-copia-\d{4}-\d{2}-\d{2}\.json$/);
  const backup = JSON.parse(readFileSync(await download.path(), "utf8"));
  expect(backup).toMatchObject({ app: "hgs-demo", product: "taskpro", version: 1 });
  expect(Object.keys(backup.data).length).toBeGreaterThan(0);

  // Una copia de otro producto se rechaza con un mensaje claro.
  await dialog.getByLabel("Restaurar copia").setInputFiles({
    name: "otra.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...backup, product: "stockflow" })),
  });
  await expect(dialog.getByRole("alert")).toContainText("es de otro producto");

  // La propia se restaura: la app vuelve a montarse con esos datos y el diálogo se cierra.
  await dialog.getByLabel("Restaurar copia").setInputFiles({ name: "copia.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Secciones de TaskPro" })).toBeVisible();
});
