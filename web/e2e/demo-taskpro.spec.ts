import fs from "node:fs";
import type { Download, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

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
  await dialog.getByLabel("Cliente").selectOption({ label: "Café Altamira S.A.S." });
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog.getByRole("alert")).toContainText("La tarifa por hora debe ser un valor entero");
  await dialog.getByLabel("Tarifa por hora (COP)").fill("95.000");
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
  // Ayer a las 5: con la hora actual por defecto, la entrada podría terminar en el futuro según cuándo corra, y a
  // esa hora no se cruza con las entradas de ejemplo.
  const yesterday = new Date(Date.now() - 86_400_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  await dialog.getByLabel("Fecha").fill(`${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`);
  await dialog.getByLabel("Hora de inicio").fill("05:00");
  await dialog.getByLabel("Nota").fill("Revisión de código del cliente");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("table", { name: "Entradas de tiempo" }).getByText("Revisión de código del cliente")).toBeVisible();
});

async function readCsv(download: Download, prefix: string) {
  expect(download.suggestedFilename()).toMatch(new RegExp(`^${prefix}-.*\\.csv$`));
  return fs.readFileSync((await download.path())!, "utf8");
}

test("exporta a CSV las tareas filtradas del tablero y las entradas de tiempo", async ({ page }) => {
  await open(page, "tablero");
  await page.getByLabel("Prioridad").selectOption({ label: "Urgente" });
  const boardBtn = page.getByRole("button", { name: "Exportar tareas a CSV" });
  const [download] = await Promise.all([page.waitForEvent("download"), boardBtn.click()]);
  const csv = await readCsv(download, "taskpro-tareas");
  expect(csv).toContain("Tarea;Proyecto;Estado;Prioridad;Etiquetas;Fecha límite;Subtareas hechas");
  expect(csv).toContain("Corregir total con envío gratis;Tienda Café Altamira;Pendiente;Urgente;bug, pagos;");
  expect(csv).toContain("Idempotencia en POST /cobros;API de pagos Recaudo+;En revisión;Urgente;backend, pagos;");
  expect(csv).toContain(";2 de 2");
  expect(csv).not.toContain("Cupones de descuento por porcentaje");

  await nav(page).getByRole("button", { name: "Tiempo" }).click();
  // Esperar a la pantalla de Tiempo: mientras cambia, el filtro "Proyecto" del tablero sigue en pantalla.
  const timeBtn = page.getByRole("button", { name: "Exportar entradas de tiempo a CSV" });
  await expect(timeBtn).toBeVisible();
  await page.getByLabel("Proyecto", { exact: true }).selectOption({ label: "App de citas Bienestar" });
  const [timeDownload] = await Promise.all([page.waitForEvent("download"), timeBtn.click()]);
  const timeCsv = await readCsv(timeDownload, "taskpro-tiempo");
  expect(timeCsv).toContain("Fecha;Inicio;Fin;Duración (horas);Proyecto;Tarea;Nota");
  expect(timeCsv).toMatch(/;0,75;App de citas Bienestar;Sin tarea;Llamada con la clínica/);
  expect(timeCsv).not.toContain("Tienda Café Altamira");
});

test("la búsqueda global abre una tarea, un proyecto y una nota", async ({ page }) => {
  const mobile = test.info().project.name.includes("mobile");
  async function search(text: string) {
    if (mobile) await page.getByRole("button", { name: "Buscar en todo" }).click();
    else await page.keyboard.press("Control+k");
    const palette = page.getByRole("dialog", { name: "Buscar en la demo" });
    await expect(palette).toBeVisible();
    await palette.getByRole("combobox", { name: "Buscar registros o pantallas" }).fill(text);
    await expect(palette.getByRole("option").first()).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(palette).toBeHidden();
  }

  await open(page);
  await search("recordatorio de cita");
  await expect(page.getByRole("heading", { level: 2, name: "Tablero" })).toBeVisible();
  const taskDialog = page.getByRole("dialog", { name: "Editar tarea" });
  await expect(taskDialog.getByLabel("Título")).toHaveValue("Recordatorio de cita por SMS");
  await taskDialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(taskDialog).toBeHidden();

  await search("Inmobiliaria Habitar");
  await expect(page.getByRole("heading", { level: 2, name: "Proyectos" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Editar proyecto" }).getByLabel("Nombre")).toHaveValue("Portal Habitar");
  await page.getByRole("dialog", { name: "Editar proyecto" }).getByRole("button", { name: "Cancelar" }).click();

  await search("variables de entorno");
  await expect(page.getByRole("heading", { level: 2, name: "Notas" })).toBeVisible();
  await expect(page.getByRole("form", { name: 'Editar nota "Variables de entorno de la tienda"' })).toBeVisible();
});
