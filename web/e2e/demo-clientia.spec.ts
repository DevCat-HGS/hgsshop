import { expect, test, type Page } from "@playwright/test";

// Fecha futura sin citas de ejemplo: el martes de dentro de tres semanas (la semilla llega hasta +13 días).
function futureTuesday() {
  const d = new Date();
  d.setDate(d.getDate() + 21);
  d.setDate(d.getDate() + ((2 - d.getDay() + 7) % 7));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function openDemo(page: Page, vista?: string) {
  await page.goto(`/demos/clientia${vista ? `?vista=${vista}` : ""}`);
  await expect(page.getByRole("navigation", { name: "Secciones de Clientia" })).toBeVisible();
}

function nav(page: Page, label: string) {
  return page.getByRole("navigation", { name: "Secciones de Clientia" }).getByRole("button", { name: new RegExp(`^${label}`) });
}

async function fillAppointment(page: Page, opts: { client: string; service: string; date: string; minutes: number; pro?: string }) {
  const dialog = page.getByRole("dialog", { name: "Nueva cita" });
  await dialog.getByLabel("Cliente", { exact: true }).selectOption({ label: opts.client });
  await dialog.getByLabel("Servicio", { exact: true }).selectOption({ label: opts.service });
  await dialog.getByLabel("Profesional", { exact: true }).selectOption({ label: opts.pro ?? "Valentina Ríos" });
  await dialog.getByLabel("Fecha", { exact: true }).fill(opts.date);
  await dialog.getByLabel("Hora", { exact: true }).selectOption(String(opts.minutes));
  return dialog;
}

test("agenda una cita y rechaza solapamientos, descansos, horas fuera del horario y fechas pasadas", async ({ page }) => {
  await openDemo(page, "agenda");
  const date = futureTuesday();

  await page.getByRole("button", { name: "Nueva cita" }).click();
  let dialog = await fillAppointment(page, { client: "Camila Torres", service: "Limpieza facial profunda (1 h)", date, minutes: 9 * 60 });
  await dialog.getByRole("button", { name: "Agendar cita" }).click();
  await expect(page.getByRole("status")).toHaveText("Cita agendada");
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "Nueva cita" }).click();
  dialog = await fillAppointment(page, { client: "Andrés Rojas", service: "Masaje relajante (1 h 30 min)", date, minutes: 9 * 60 + 30 });
  await dialog.getByRole("button", { name: "Agendar cita" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Valentina Ríos ya tiene una cita");
  await expect(dialog.getByRole("alert")).toContainText("Camila Torres");

  await dialog.getByLabel("Hora", { exact: true }).selectOption(String(11 * 60 + 30));
  await dialog.getByRole("button", { name: "Agendar cita" }).click();
  await expect(dialog.getByRole("alert")).toContainText("cruza el descanso");

  await dialog.getByLabel("Hora", { exact: true }).selectOption(String(17 * 60));
  await dialog.getByRole("button", { name: "Agendar cita" }).click();
  await expect(dialog.getByRole("alert")).toContainText("fuera del horario");

  await dialog.getByLabel("Fecha", { exact: true }).fill("2020-01-07");
  await dialog.getByRole("button", { name: "Agendar cita" }).click();
  await expect(dialog.getByRole("alert")).toContainText("en el pasado");

  // Con otra profesional, la misma hora sí está libre.
  await dialog.getByLabel("Fecha", { exact: true }).fill(date);
  await dialog.getByLabel("Hora", { exact: true }).selectOption(String(9 * 60 + 30));
  await dialog.getByLabel("Profesional", { exact: true }).selectOption({ label: "Daniela Ortiz" });
  await dialog.getByRole("button", { name: "Agendar cita" }).click();
  await expect(page.getByRole("status")).toHaveText("Cita agendada");
});

test("crea un cliente, le agenda una cita desde su ficha y sobrevive a la recarga", async ({ page }) => {
  await openDemo(page, "clientes");
  await page.getByRole("button", { name: "Nuevo cliente" }).click();
  const form = page.getByRole("dialog", { name: "Nuevo cliente" });
  await form.getByLabel("Nombre").fill("Valeria Prueba");
  await form.getByRole("button", { name: "Guardar" }).click();
  await expect(form.getByRole("alert")).toContainText("hace falta un teléfono");
  await form.getByLabel("Teléfono").fill("300 999 1234");
  await form.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status")).toHaveText("Cliente creado");

  const card = page.getByRole("region", { name: "Ficha de Valeria Prueba" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Agendar cita" }).click();
  const dialog = page.getByRole("dialog", { name: "Nueva cita" });
  await expect(dialog.getByLabel("Cliente", { exact: true })).toHaveValue(/.+/);
  await dialog.getByLabel("Servicio", { exact: true }).selectOption({ label: "Manicure y pedicure (1 h)" });
  await dialog.getByLabel("Profesional", { exact: true }).selectOption({ label: "Daniela Ortiz" });
  await dialog.getByLabel("Fecha", { exact: true }).fill(futureTuesday());
  await dialog.getByLabel("Hora", { exact: true }).selectOption(String(14 * 60));
  await dialog.getByRole("button", { name: "Agendar cita" }).click();
  await expect(page.getByRole("status")).toHaveText("Cita agendada");
  await expect(card.getByRole("region", { name: "Próximas citas" })).toContainText("Manicure y pedicure");

  await page.reload();
  await expect(nav(page, "Clientes")).toBeVisible();
  await page.getByRole("searchbox", { name: "Buscar clientes" }).fill("valeria");
  const table = page.getByRole("table", { name: "Clientes" });
  await expect(table.getByRole("row")).toHaveCount(2);
  await table.getByRole("button", { name: "Valeria Prueba", exact: true }).click();
  await expect(page.getByRole("region", { name: "Próximas citas" })).toContainText("Manicure y pedicure");
});

test("servicios: valida, crea, edita y elimina", async ({ page }) => {
  await openDemo(page, "servicios");
  await page.getByRole("button", { name: "Nuevo servicio" }).click();
  const dialog = page.getByRole("dialog", { name: "Nuevo servicio" });
  await dialog.getByLabel("Nombre").fill("Lifting de pestañas");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog.getByRole("alert")).toContainText("precio mayor que cero");
  await dialog.getByLabel("Duración").selectOption("90");
  await dialog.getByLabel("Precio (COP)").fill("95000");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status")).toHaveText("Servicio creado");

  const table = page.getByRole("table", { name: "Servicios" });
  const row = table.getByRole("row", { name: /Lifting de pestañas/ });
  await expect(row).toContainText("1 h 30 min");

  await row.getByRole("button", { name: 'Editar "Lifting de pestañas"' }).click();
  const edit = page.getByRole("dialog", { name: "Editar servicio" });
  await edit.getByLabel("Precio (COP)").fill("110000");
  await edit.getByRole("button", { name: "Guardar" }).click();
  await expect(row).toContainText("110.000");

  await row.getByRole("button", { name: 'Eliminar "Lifting de pestañas"' }).click();
  await page.getByRole("dialog", { name: "Eliminar servicio" }).getByRole("button", { name: "Eliminar" }).click();
  await expect(table.getByRole("row", { name: /Lifting de pestañas/ })).toHaveCount(0);
});

test("marca la asistencia de una cita pendiente desde el panel", async ({ page }) => {
  await openDemo(page);
  const pending = page.getByRole("region", { name: "Asistencia por marcar" });
  const before = await pending.getByRole("button").count();
  expect(before).toBeGreaterThan(0);
  await pending.getByRole("button").first().click();
  const dialog = page.getByRole("dialog", { name: "Cita" });
  await dialog.getByRole("button", { name: "Asistió", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Asistencia registrada");
  await expect(pending.getByRole("button")).toHaveCount(before - 1);
});

test("recordatorios: plantilla validada, bandeja simulada y desactivación", async ({ page }) => {
  await openDemo(page, "recordatorios");
  await expect(page.getByText("en esta demo no se envía ningún mensaje real")).toBeVisible();
  const outbox = page.getByRole("table", { name: "Bandeja de salida de recordatorios" });
  await expect(outbox.getByRole("row").nth(1)).toBeVisible();

  const settings = page.getByRole("form", { name: "Configuración de recordatorios" });
  const template = settings.getByLabel("Plantilla del mensaje");
  await template.fill("Hola {nombre}, tu cita es el {fecha} a las {hora}.");
  await settings.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(settings.getByRole("alert")).toContainText("{nombre} no existe");
  await template.fill("Hola {cliente}, tu cita es el {fecha} a las {hora}.");
  await settings.getByLabel("3 horas antes", { exact: true }).check();
  await settings.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(page.getByRole("status")).toHaveText("Configuración de recordatorios guardada");
  await expect(outbox.getByText("24 h antes")).toHaveCount(0);

  await outbox.getByRole("button", { name: /^Ver mensaje/ }).first().click();
  await expect(page.getByRole("dialog", { name: "Vista previa del recordatorio" })).toContainText("tu cita es el");
  await page.getByRole("dialog", { name: "Vista previa del recordatorio" }).getByRole("button", { name: "Cerrar" }).click();

  await settings.getByLabel("Enviar recordatorios automáticos").uncheck();
  await settings.getByRole("button", { name: "Guardar configuración" }).click();
  await expect(page.getByText("Los recordatorios están desactivados.")).toBeVisible();
});
