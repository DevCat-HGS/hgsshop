import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function go(page: Page, section: RegExp) {
  await page.getByRole("navigation", { name: "Secciones de RoboAcademy" }).getByRole("button", { name: section }).click();
}

test("una inscripción del formulario público termina en estudiante con grupo y cupo", async ({ page }) => {
  await page.goto("/demos/roboacademy");
  await go(page, /^Inscripciones/);
  await page.getByRole("button", { name: "Nuevo aspirante" }).click();
  await expect(page.getByText("Así lo ve el acudiente")).toBeVisible();

  const form = page.getByRole("form", { name: "Inscripción" });
  await form.getByLabel("Nombre del niño o la niña").fill("Ximena Lozano");
  await form.getByLabel("Edad").fill("11");
  await form.getByLabel("Nombre del acudiente").fill("Rosa Lozano");
  await form.getByLabel("Celular (WhatsApp)").fill("300 111");
  await form.getByLabel("¿Cómo nos conociste?").selectOption("Instagram");
  await form.getByRole("button", { name: "Enviar inscripción" }).click();
  await expect(form.getByRole("alert")).toContainText("10 dígitos");

  await form.getByLabel("Celular (WhatsApp)").fill("300 111 2233");
  await form.getByLabel("Grupo de interés").selectOption("g-inventores");
  await form.getByRole("button", { name: "Enviar inscripción" }).click();
  await expect(page.getByText("Recibimos la inscripción de Ximena Lozano")).toBeVisible();

  await page.getByRole("button", { name: "Ver en Inscripciones" }).click();
  const item = page.getByRole("list", { name: "Aspirantes" }).getByRole("listitem", { name: "Ximena Lozano" });
  await expect(item).toContainText("Nuevo");
  await item.getByRole("button", { name: "Marcar contactado a Ximena Lozano" }).click();
  await expect(item).toContainText("Contactado");

  await item.getByRole("button", { name: "Inscribir a Ximena Lozano" }).click();
  const dialog = page.getByRole("dialog", { name: "Inscribir a Ximena Lozano" });
  await expect(dialog.getByLabel("Grupo")).toHaveValue("g-inventores");
  await dialog.getByRole("button", { name: "Inscribir" }).click();
  await expect(page.getByRole("status").getByText("Ximena Lozano quedó inscrito en Club de inventores")).toBeVisible();

  await page.getByLabel("Estado").selectOption("inscrito");
  await item.getByRole("button", { name: "Ver ficha de estudiante de Ximena Lozano" }).click();
  const profile = page.getByRole("dialog", { name: "Ficha de Ximena Lozano" });
  await expect(profile).toContainText("Club de inventores");
  await expect(profile).toContainText("Rosa Lozano");
  await page.keyboard.press("Escape");

  await page.getByRole("searchbox", { name: "Buscar estudiante" }).fill("ximena");
  await expect(page.getByRole("table", { name: "Estudiantes" })).toContainText("Club de inventores");
});

test("no inscribe en un grupo sin cupo", async ({ page }) => {
  await page.goto("/demos/roboacademy");
  await go(page, /^Inscripciones/);
  await page.getByRole("button", { name: "Inscribir a Renata Villegas" }).click();
  const dialog = page.getByRole("dialog", { name: "Inscribir a Renata Villegas" });
  await expect(dialog.getByRole("option", { name: /^Robótica avanzada .* lleno$/ })).toBeAttached();
  await dialog.getByLabel("Grupo").selectOption("g-avanzada");
  await dialog.getByRole("button", { name: "Inscribir" }).click();
  await expect(dialog.getByRole("alert")).toContainText('"Robótica avanzada" está lleno (5 de 5)');
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("listitem", { name: "Renata Villegas" })).toContainText("Nuevo");
});

test("cada pago emite un recibo con número consecutivo y los datos de Ajustes", async ({ page }) => {
  await page.goto("/demos/roboacademy");
  await go(page, /^Ajustes$/);
  const settings = page.getByRole("form", { name: "Ajustes de la academia" });
  await settings.getByLabel("Nombre de la academia").fill("Robótica Kids Pereira");
  await settings.getByLabel("NIT").fill("12-3");
  await settings.getByRole("button", { name: "Guardar ajustes" }).click();
  await expect(settings.getByRole("alert")).toContainText("NIT");
  await settings.getByLabel("NIT").fill("900.123.456-7");
  await settings.getByLabel("Dirección").fill("Carrera 7 # 19-30");
  await settings.getByLabel("Ciudad").fill("Pereira");
  await settings.getByLabel("Texto del pie de recibos y reportes").fill("Gracias por su pago puntual.");
  await settings.getByRole("button", { name: "Guardar ajustes" }).click();
  await expect(page.getByRole("status").getByText("Ajustes guardados")).toBeVisible();

  await go(page, /^Pagos/);
  await page.getByRole("tab", { name: "Historial de recibos" }).click();
  const next = Number((await page.getByText(/^Próximo número:/).innerText()).replace(/\D/g, ""));
  const label = (n: number) => `RC-${String(n).padStart(4, "0")}`;
  await page.getByRole("tab", { name: "Mensualidades" }).click();
  await page.getByLabel("Solo pendientes").check();

  async function payFirst() {
    const button = page.getByRole("button", { name: /^Registrar pago de / }).first();
    const name = (await button.getAttribute("aria-label"))!.replace("Registrar pago de ", "");
    await button.click();
    await page.getByRole("dialog", { name: `Pago de ${name}` }).getByRole("button", { name: "Registrar pago" }).click();
    return name;
  }

  await payFirst();
  const banner = page.getByRole("note", { name: "Recibo emitido" });
  await expect(banner).toContainText(label(next));
  const second = await payFirst();
  await expect(banner).toContainText(`Pago de ${second} registrado`);
  await expect(banner).toContainText(label(next + 1));

  await banner.getByRole("button", { name: "Ver e imprimir recibo" }).click();
  const receipt = page.getByRole("article", { name: `Recibo ${label(next + 1)}` });
  await expect(receipt).toContainText(second);
  await expect(receipt).toContainText("Robótica Kids Pereira");
  await expect(receipt).toContainText("NIT 900.123.456-7");
  await expect(receipt).toContainText("Carrera 7 # 19-30, Pereira");
  await expect(receipt).toContainText("Gracias por su pago puntual.");
  await expect(page.getByRole("button", { name: "Imprimir recibo" })).toBeVisible();

  // Los ajustes también salen en el reporte para acudientes.
  await go(page, /^Reportes$/);
  await expect(page.getByRole("article", { name: /^Reporte de / })).toContainText("Gracias por su pago puntual.");
});

test("el portal del acudiente muestra los datos del estudiante sin poder editarlos", async ({ page }) => {
  await page.goto("/demos/roboacademy");
  await go(page, /^Portal del acudiente$/);
  await page.getByLabel("Ver el portal de").selectOption({ label: "Mateo Pardo" });
  await expect(page.getByText("Así lo ve el acudiente")).toBeVisible();

  const portal = page.getByRole("article", { name: "Portal de Mateo Pardo" });
  await expect(portal).toContainText("Hola, Diana");
  await expect(portal).toContainText("Robótica inicial");
  await expect(portal.getByRole("region", { name: "Asistencia" })).toContainText("Últimas 8 semanas");
  await expect(portal.getByRole("list", { name: "Módulo 3 de 4: Sensores de distancia" })).toBeVisible();
  await expect(portal.getByRole("region", { name: "Notas del profesor" }).getByRole("listitem").first()).toBeVisible();
  await expect(portal.getByRole("region", { name: "Pagos realizados" })).toContainText(/RC-\d{4}/);
  await expect(portal.getByRole("region", { name: "Próximos pagos" })).toContainText("Mensualidad de");

  // Solo lectura: nada que editar ni botones de acción dentro del portal.
  await expect(portal.getByRole("textbox")).toHaveCount(0);
  await expect(portal.getByRole("button")).toHaveCount(0);
  await expect(portal.getByRole("combobox")).toHaveCount(0);
});
