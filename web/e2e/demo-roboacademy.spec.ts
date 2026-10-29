import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, section: RegExp) {
  await page.goto("/demos/roboacademy");
  await page.getByRole("navigation", { name: "Secciones de RoboAcademy" }).getByRole("button", { name: section }).click();
}

test("crea, valida, edita módulos y borra un grupo", async ({ page }) => {
  await open(page, /^Grupos$/);
  await page.getByRole("button", { name: "Nuevo grupo" }).click();
  const dialog = page.getByRole("dialog", { name: "Nuevo grupo" });
  await dialog.getByLabel("Nombre del grupo").fill("Robótica junior");
  await dialog.getByLabel("Día").selectOption("5");
  await dialog.getByLabel("Profesor").fill("Mónica Uribe");
  await dialog.getByLabel("Cupo").fill("4");
  await dialog.getByLabel("Mensualidad (COP)").fill("150000");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog.getByText("Agrega al menos un módulo.")).toBeVisible();

  await dialog.getByLabel("Nuevo módulo").fill("Bloques");
  await dialog.getByRole("button", { name: "Agregar módulo" }).click();
  await dialog.getByLabel("Nuevo módulo").fill("Sensores");
  await dialog.getByLabel("Nuevo módulo").press("Enter");
  await dialog.getByLabel("Nombre del módulo 1").fill("Bloques y motores");
  await dialog.getByRole("button", { name: 'Bajar "Bloques y motores"' }).click();
  await expect(dialog.getByLabel("Nombre del módulo 1")).toHaveValue("Sensores");
  await dialog.getByRole("button", { name: "Guardar" }).click();

  const modules = page.getByRole("list", { name: "Módulos de Robótica junior" });
  await expect(modules.getByRole("listitem")).toHaveText(["1.Sensores", "2.Bloques y motores"]);
  await expect(page.getByText("Viernes, 9:00 a. m. · Mónica Uribe")).toBeVisible();

  await page.getByRole("button", { name: 'Eliminar "Robótica junior"' }).click();
  await page.getByRole("dialog", { name: "Eliminar grupo" }).getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByRole("heading", { name: "Robótica junior" })).toHaveCount(0);
});

test("no deja superar el cupo y permite crear, editar y borrar estudiantes", async ({ page }) => {
  await open(page, /^Estudiantes$/);
  await page.getByRole("button", { name: "Nuevo estudiante" }).click();
  const dialog = page.getByRole("dialog", { name: "Nuevo estudiante" });
  await dialog.getByLabel("Nombre del estudiante").fill("Ximena Lozano");
  await dialog.getByLabel("Edad").fill("10");
  await dialog.getByLabel("Acudiente", { exact: true }).fill("Rosa Lozano");
  await dialog.getByLabel("Teléfono del acudiente").fill("3001112233");
  await dialog.getByLabel("Grupo").selectOption("g-avanzada");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog.getByRole("alert")).toContainText("está lleno");

  await dialog.getByLabel("Grupo").selectOption("g-inventores");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status").getByText("Estudiante creado")).toBeVisible();

  await page.getByRole("searchbox", { name: "Buscar estudiante" }).fill("ximena");
  const table = page.getByRole("table", { name: "Estudiantes" });
  await expect(table.getByRole("row")).toHaveCount(2);
  await expect(table).toContainText("Club de inventores");

  await table.getByRole("button", { name: 'Editar "Ximena Lozano"' }).click();
  const edit = page.getByRole("dialog", { name: "Editar estudiante" });
  await edit.getByLabel("Nombre del estudiante").fill("Ximena Lozano Pérez");
  await edit.getByRole("button", { name: "Guardar" }).click();
  await expect(table).toContainText("Ximena Lozano Pérez");

  await table.getByRole("button", { name: 'Eliminar "Ximena Lozano Pérez"' }).click();
  await page.getByRole("dialog", { name: "Eliminar estudiante" }).getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Ningún estudiante coincide")).toBeVisible();
});

test("la asistencia se marca por sesión y sobrevive a una recarga", async ({ page }) => {
  await open(page, /^Asistencia$/);
  await page.getByRole("button", { name: "Marcar todos presentes" }).click();
  const mateo = page.getByRole("group", { name: "Asistencia de Mateo Pardo" });
  await expect(mateo.getByRole("button", { name: "Presente" })).toHaveAttribute("aria-pressed", "true");
  await mateo.getByRole("button", { name: "Ausente" }).click();

  const history = page.getByRole("table", { name: "Historial de sesiones de Robótica inicial" });
  const openRow = history.getByRole("row").filter({ hasText: "Abierta" });
  await expect(openRow.getByRole("cell").nth(1)).toHaveText("1");

  await page.reload();
  await expect(page.getByRole("group", { name: "Asistencia de Mateo Pardo" }).getByRole("button", { name: "Ausente" })).toHaveAttribute("aria-pressed", "true");
});

test("registrar y deshacer un pago actualiza los pendientes", async ({ page }) => {
  await open(page, /^Pagos/);
  const navPagos = page.getByRole("navigation", { name: "Secciones de RoboAcademy" }).getByRole("button", { name: /^Pagos/ });
  const before = Number((await navPagos.innerText()).replace(/\D/g, ""));

  await page.getByLabel("Solo pendientes").check();
  const payButton = page.getByRole("button", { name: /^Registrar pago de / }).first();
  const name = (await payButton.getAttribute("aria-label"))!.replace("Registrar pago de ", "");
  await payButton.click();
  const dialog = page.getByRole("dialog", { name: `Pago de ${name}` });
  await dialog.getByLabel("Método").selectOption("efectivo");
  await dialog.getByRole("button", { name: "Registrar pago" }).click();

  await expect(page.getByRole("button", { name: `Registrar pago de ${name}` })).toHaveCount(0);
  await expect(navPagos).toHaveText(new RegExp(`${before - 1}$`));

  await page.getByLabel("Solo pendientes").uncheck();
  await page.getByRole("button", { name: `Deshacer pago de ${name}` }).click();
  await expect(page.getByRole("button", { name: `Registrar pago de ${name}` })).toBeVisible();
  await expect(navPagos).toHaveText(new RegExp(`${before}$`));
});

test("avanzar de módulo se refleja en el reporte para acudientes", async ({ page }) => {
  await open(page, /^Progreso$/);
  await page.getByRole("button", { name: "Avanzar de módulo a Jerónimo Vélez" }).click();

  await page.getByRole("navigation", { name: "Secciones de RoboAcademy" }).getByRole("button", { name: "Reportes" }).click();
  await page.getByLabel("Estudiante").selectOption({ label: "Jerónimo Vélez" });
  const report = page.getByRole("article", { name: "Reporte de Jerónimo Vélez" });
  await expect(report).toContainText("Módulo 2 de 4: Sensores de luz");
  await expect(report).toContainText("Avance de la ruta: 25 %");

  await report.getByRole("textbox", { name: "Comentario para el acudiente" }).fill("Jerónimo avanzó muy bien este mes.");
  await page.reload();
  await page.getByLabel("Estudiante").selectOption({ label: "Jerónimo Vélez" });
  await expect(page.getByRole("textbox", { name: "Comentario para el acudiente" })).toHaveValue("Jerónimo avanzó muy bien este mes.");
  await expect(page.getByRole("button", { name: "Imprimir" })).toBeVisible();
});
