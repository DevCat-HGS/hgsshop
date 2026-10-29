import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, vista?: string) {
  await page.goto(`/demos/taskpro${vista ? `?vista=${vista}` : ""}`);
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
}

function nav(page: Page) {
  return page.getByRole("navigation", { name: "Secciones de TaskPro" });
}

test("crea una tarea con validación, la mueve de columna y aparece en Hoy", async ({ page }) => {
  await open(page, "tablero");
  await page.getByRole("button", { name: "Nueva tarea", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Nueva tarea" });
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Escribe un título para la tarea.");

  await dialog.getByLabel("Título").fill("Configurar monitoreo de errores");
  await dialog.getByLabel("Etiquetas").fill("infra, backend");
  await dialog.getByLabel("Nueva subtarea").fill("Crear cuenta de pruebas");
  await dialog.getByLabel("Nueva subtarea").press("Enter");
  await expect(dialog.getByText("Crear cuenta de pruebas")).toBeVisible();
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog).toBeHidden();

  const pending = page.getByRole("region", { name: "Pendiente", exact: true });
  await expect(pending.getByRole("button", { name: "Configurar monitoreo de errores", exact: true })).toBeVisible();
  await pending.getByRole("button", { name: 'Mover "Configurar monitoreo de errores" a En progreso' }).click();
  const doing = page.getByRole("region", { name: "En progreso", exact: true });
  await expect(doing.getByRole("button", { name: "Configurar monitoreo de errores", exact: true })).toBeVisible();

  await nav(page).getByRole("button", { name: /^Hoy/ }).click();
  await expect(page.getByRole("region", { name: "En progreso ahora" }).getByRole("button", { name: "Configurar monitoreo de errores", exact: true })).toBeVisible();
});

test("edita una tarea, filtra por búsqueda y la elimina con confirmación", async ({ page }) => {
  await open(page, "tablero");
  await page.getByLabel("Buscar tareas").fill("cupones");
  await page.getByRole("button", { name: "Cupones de descuento por porcentaje", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Editar tarea" });
  await dialog.getByLabel("Título").fill("Cupones de descuento por monto fijo");
  await dialog.getByLabel("Prioridad").selectOption({ label: "Urgente" });
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status")).toContainText("Tarea actualizada");

  await page.getByLabel("Buscar tareas").fill("monto fijo");
  const card = page.getByRole("region", { name: "Pendiente", exact: true }).getByRole("listitem");
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("Urgente");

  await card.getByRole("button", { name: "Cupones de descuento por monto fijo", exact: true }).click();
  await page.getByRole("dialog", { name: "Editar tarea" }).getByRole("button", { name: "Eliminar tarea" }).click();
  await page.getByRole("dialog", { name: "Eliminar tarea" }).getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByRole("region", { name: "Pendiente", exact: true }).getByText("Sin coincidencias")).toBeVisible();
});

test("crea un proyecto con validación y lo archiva", async ({ page }) => {
  await open(page, "proyectos");
  await page.getByRole("button", { name: "Nuevo proyecto" }).click();
  const dialog = page.getByRole("dialog", { name: "Nuevo proyecto" });
  await dialog.getByLabel("Nombre").fill("Landing Ferretería Norte");
  await dialog.getByLabel("Cliente").fill("Ferretería Norte");
  await dialog.getByLabel("Repositorio").fill("no es una url");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog.getByRole("alert")).toContainText("El repositorio debe ser una URL");
  await dialog.getByLabel("Repositorio").fill("https://git.ejemplo.co/estudio/ferreteria");
  await dialog.getByText("Coral").click();
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "Landing Ferretería Norte" })).toBeVisible();

  // El proyecto nuevo aparece en el selector del tablero.
  await page.getByRole("button", { name: 'Ver tablero de "Landing Ferretería Norte"' }).click();
  await expect(page.getByLabel("Proyecto").locator("option:checked")).toHaveText("Landing Ferretería Norte");

  await nav(page).getByRole("button", { name: "Proyectos" }).click();
  await page.getByRole("button", { name: 'Archivar "Landing Ferretería Norte"' }).click();
  await expect(page.getByRole("heading", { name: "Landing Ferretería Norte" })).toBeHidden();
  await page.getByLabel("Mostrar").selectOption({ label: "Archivados" });
  await expect(page.getByRole("heading", { name: "Landing Ferretería Norte" })).toBeVisible();
});

test("crea una nota con markdown seguro, la fija en Hoy y sobrevive a la recarga", async ({ page }) => {
  await open(page, "notas");
  await page.getByRole("button", { name: "Nueva nota" }).click();
  const form = page.getByRole("form", { name: "Nueva nota" });
  await form.getByLabel("Título").fill("Checklist de lanzamiento");
  await form.getByLabel("Contenido de la nota").fill("# Lanzamiento\n\nRevisar **DNS** y `robots.txt`.\n\n```\nnpm run build\n```\n\n<script>alert(1)</script>");
  await form.getByLabel("Fijar en Hoy").check();
  await form.getByRole("button", { name: "Vista previa" }).click();
  const preview = form.getByRole("region", { name: "Vista previa" });
  await expect(preview.getByRole("heading", { name: "Lanzamiento" })).toBeVisible();
  await expect(preview.locator("strong")).toHaveText("DNS");
  await expect(preview.locator("pre")).toHaveText("npm run build");
  await expect(preview.getByText("<script>alert(1)</script>")).toBeVisible();
  await form.getByRole("button", { name: "Crear nota" }).click();
  await expect(page.getByRole("status")).toContainText("Nota creada");

  await page.reload();
  await nav(page).getByRole("button", { name: /^Hoy/ }).click();
  await expect(page.getByRole("region", { name: "Notas fijadas" }).getByRole("button", { name: /Checklist de lanzamiento/ })).toBeVisible();
});

test("el temporizador sobrevive a la recarga y las entradas manuales se validan", async ({ page }) => {
  await open(page, "tiempo");
  const timer = page.getByRole("region", { name: "Temporizador" });
  await timer.getByRole("button", { name: "Iniciar temporizador" }).click();
  await expect(timer.getByRole("button", { name: "Detener y guardar" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("region", { name: "Temporizador" }).getByRole("button", { name: "Detener y guardar" })).toBeVisible();
  await page.getByRole("region", { name: "Temporizador" }).getByRole("button", { name: "Descartar" }).click();
  await page.getByRole("dialog", { name: "Descartar temporizador" }).getByRole("button", { name: "Descartar" }).click();
  await expect(page.getByRole("region", { name: "Temporizador" }).getByRole("button", { name: "Iniciar temporizador" })).toBeVisible();

  await page.getByRole("button", { name: "Entrada manual" }).click();
  const dialog = page.getByRole("dialog", { name: "Entrada manual" });
  await dialog.getByLabel("Horas").fill("0");
  await dialog.getByLabel("Minutos").fill("0");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("La duración debe ser de al menos un minuto.");
  await dialog.getByLabel("Minutos").fill("25");
  await dialog.getByLabel("Nota").fill("Revisión de código del cliente");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("table", { name: "Entradas de tiempo" }).getByText("Revisión de código del cliente")).toBeVisible();
});
