import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/** Reservas en línea de Clientia (#55), identidad propia (#52) e importación de clientes (#53). */

async function openDemo(page: Page, vista?: string) {
  await page.goto(`/demos/clientia${vista ? `?vista=${vista}` : ""}`);
  await expect(page.getByRole("navigation", { name: "Secciones de Clientia" })).toBeVisible();
}

function nav(page: Page, label: string) {
  return page.getByRole("navigation", { name: "Secciones de Clientia" }).getByRole("button", { name: new RegExp(`^${label}`) });
}

function tab(page: Page, label: string) {
  return page.getByRole("group", { name: "Secciones de reservas en línea" }).getByRole("button", { name: label });
}

/**
 * Reserva desde la página pública en el último día disponible (lejos de las citas de ejemplo). Devuelve la hora
 * elegida y el código del comprobante.
 */
async function bookOnline(page: Page, opts: { name: string; phone: string; service?: string; submit?: string }) {
  const form = page.getByRole("form", { name: "Reservar una cita" });
  await form.getByRole("group", { name: "Servicio" }).getByRole("button", { name: opts.service ?? "Limpieza facial profunda" }).click();
  await expect(form.getByRole("group", { name: "Profesional" }).getByRole("button", { name: "Cualquiera" })).toHaveAttribute("aria-pressed", "true");
  await form.getByRole("group", { name: "Día" }).locator("button:not([disabled])").last().click();
  const hours = form.getByRole("group", { name: /^Horas libres/ });
  const first = hours.getByRole("button").first();
  const time = (await first.textContent()) ?? "";
  await first.click();
  await expect(form.getByText(/^Te atenderá /)).toBeVisible();
  await form.getByLabel("Nombre completo").fill(opts.name);
  await form.getByLabel("Teléfono (WhatsApp)").fill(opts.phone);
  await form.getByRole("button", { name: opts.submit ?? "Solicitar cita" }).click();
  const receipt = page.getByRole("article", { name: /^Comprobante de la cita/ });
  await expect(receipt).toBeVisible();
  const code = ((await receipt.getAttribute("aria-label")) ?? "").replace("Comprobante de la cita ", "");
  return { time, code, receipt };
}

test("reserva desde la página pública, llega a solicitudes, se confirma y aparece en la agenda y los recordatorios", async ({ page }) => {
  await openDemo(page, "reservas");
  await expect(tab(page, "Así la ve tu cliente")).toHaveAttribute("aria-pressed", "true");
  const pendingBefore = await nav(page, "Solicitudes").textContent();

  const form = page.getByRole("form", { name: "Reservar una cita" });
  await form.getByRole("group", { name: "Servicio" }).getByRole("button", { name: "Masaje relajante" }).click();
  await form.getByRole("button", { name: "Solicitar cita" }).click();
  await expect(form.getByRole("alert")).toContainText("Elige el día y la hora");
  await form.getByRole("group", { name: "Día" }).locator("button:not([disabled])").last().click();
  await form.getByRole("group", { name: /^Horas libres/ }).getByRole("button").first().click();
  await form.getByLabel("Nombre completo").fill("Lu");
  await form.getByRole("button", { name: "Solicitar cita" }).click();
  await expect(form.getByRole("alert")).toContainText("nombre completo");

  await form.getByRole("group", { name: "Servicio" }).getByRole("button", { name: "Limpieza facial profunda" }).click();
  const { time, receipt } = await bookOnline(page, { name: "Lucía Prueba", phone: "319 555 7788" });
  await expect(page.getByText(/Recibimos tu solicitud/)).toBeVisible();
  await expect(receipt).toContainText("Por confirmar");
  await expect(receipt).toContainText("Lucía Prueba · 319 555 7788");
  await expect(receipt).toContainText("Estudio Brisa");
  await expect(nav(page, "Solicitudes")).not.toHaveText(pendingBefore ?? "");

  await nav(page, "Solicitudes").click();
  const inbox = page.getByRole("list", { name: "Solicitudes por confirmar" });
  await expect(inbox).toContainText("Lucía Prueba");
  await inbox.getByRole("button", { name: "Confirmar la reserva de Lucía Prueba" }).click();
  await expect(page.getByRole("status")).toHaveText("Reserva confirmada: ya está en los recordatorios");
  await expect(inbox.getByText("Lucía Prueba")).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Solicitudes respondidas" }).getByRole("listitem").filter({ hasText: "Lucía Prueba" })).toContainText("Confirmada");

  // En la agenda: la cita queda agendada en su semana (a lo sumo tres semanas adelante).
  await nav(page, "Agenda").click();
  await page.getByRole("group", { name: "Vista de la agenda" }).getByRole("button", { name: "Semana" }).click();
  const block = page.getByRole("button", { name: new RegExp(`^Cita: Lucía Prueba, Limpieza facial profunda, ${time.replace(/\./g, "\\.")}`) });
  for (let i = 0; i < 4 && !(await block.isVisible()); i++) await page.getByRole("button", { name: "Semana siguiente" }).click();
  await expect(block).toBeVisible();
  await expect(block).not.toHaveAccessibleName(/por confirmar/);

  await nav(page, "Recordatorios").click();
  await expect(page.getByRole("button", { name: /^Ver mensaje para Lucía Prueba/ }).first()).toBeVisible();
});

test("rechaza una solicitud con motivo obligatorio y la franja queda libre", async ({ page }) => {
  await openDemo(page, "solicitudes");
  const inbox = page.getByRole("list", { name: "Solicitudes por confirmar" });
  await expect(inbox).toContainText("Natalia Herrera");
  await inbox.getByRole("button", { name: "Rechazar la reserva de Natalia Herrera" }).click();
  const dialog = page.getByRole("dialog", { name: "Rechazar solicitud" });
  await dialog.getByRole("button", { name: "Rechazar solicitud" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Escribe el motivo");
  await dialog.getByLabel("Motivo del rechazo").fill("Ese día la profesional está de vacaciones.");
  await dialog.getByRole("button", { name: "Rechazar solicitud" }).click();
  await expect(page.getByRole("status")).toHaveText("Solicitud rechazada: la franja quedó libre");
  await expect(inbox.getByText("Natalia Herrera")).toHaveCount(0);
  const answered = page.getByRole("list", { name: "Solicitudes respondidas" }).getByRole("listitem").filter({ hasText: "Natalia Herrera" });
  await expect(answered).toContainText("Motivo: Ese día la profesional está de vacaciones.");
  await expect(answered).toContainText("Rechazada");
});

test("las reglas de reserva se validan y se respetan en la página pública", async ({ page }) => {
  await openDemo(page, "reservas");
  await tab(page, "Compartir y reglas").click();
  const rules = page.getByRole("form", { name: "Reglas de reserva" });
  await rules.getByLabel("Anticipación mínima (horas)").fill("100");
  await rules.getByRole("button", { name: "Guardar reglas" }).click();
  await expect(rules.getByRole("alert")).toContainText("entre 0 y 72");
  await rules.getByLabel("Anticipación mínima (horas)").fill("48");
  await rules.getByLabel("Anticipación máxima (días)").fill("1");
  await rules.getByRole("button", { name: "Guardar reglas" }).click();
  await expect(rules.getByRole("alert")).toContainText("nadie podría reservar");

  await rules.getByLabel("Anticipación mínima (horas)").fill("24");
  await rules.getByLabel("Anticipación máxima (días)").fill("3");
  await rules.getByLabel("Cancelar hasta (horas antes)").fill("72");
  await rules.getByLabel("Confirmar cada reserva antes de agendarla").uncheck();
  await rules.getByRole("button", { name: "Guardar reglas" }).click();
  await expect(page.getByRole("status")).toHaveText("Reglas de reserva guardadas");

  await tab(page, "Así la ve tu cliente").click();
  await expect(page.getByText("Reserva con al menos 24 horas de anticipación y hasta 3 días antes.")).toBeVisible();
  const form = page.getByRole("form", { name: "Reservar una cita" });
  await form.getByRole("group", { name: "Servicio" }).getByRole("button", { name: "Valoración de piel" }).click();
  // Solo hoy y los 3 días siguientes (menos los cerrados); hoy no hay horas por la anticipación de 24 horas.
  const days = form.getByRole("group", { name: "Día" }).getByRole("button");
  expect(await days.count()).toBeLessThanOrEqual(4);
  const today = new Date();
  if (today.getDay() !== 0) await expect(days.first()).toBeDisabled();

  // Sin confirmación previa, la reserva entra confirmada; y con 72 horas de plazo ya no se puede cancelar en línea.
  const { code, receipt } = await bookOnline(page, { name: "Pedro Reglas", phone: "317 555 2211", service: "Valoración de piel", submit: "Reservar cita" });
  await expect(page.getByText(/Tu cita quedó confirmada/)).toBeVisible();
  await expect(receipt).toContainText("Confirmada");
  await expect(receipt).toContainText("Puedes cancelar en línea hasta 72 horas antes de tu cita.");
  await page.getByRole("button", { name: "Cancelar mi reserva" }).click();
  const cancel = page.getByRole("form", { name: "Cancelar mi reserva" });
  await cancel.getByLabel("Teléfono con el que reservaste").fill("3175552211");
  await cancel.getByLabel("Código del comprobante").fill(code);
  await cancel.getByRole("button", { name: "Cancelar reserva" }).click();
  await expect(cancel.getByRole("alert")).toContainText("Ya no se puede cancelar en línea: el plazo es hasta 72 horas");
});

test("el cliente cancela su reserva con el código del comprobante dentro del plazo", async ({ page }) => {
  await page.goto("/demos/clientia?vista=reservar");
  await expect(page.getByRole("button", { name: "Volver a Clientia" })).toBeVisible();
  const { code } = await bookOnline(page, { name: "Clara Cancela", phone: "318 555 9900" });
  await page.getByRole("button", { name: "Cancelar mi reserva" }).click();
  const cancel = page.getByRole("form", { name: "Cancelar mi reserva" });
  await cancel.getByLabel("Teléfono con el que reservaste").fill("318 555 0000");
  await cancel.getByLabel("Código del comprobante").fill(code);
  await cancel.getByRole("button", { name: "Cancelar reserva" }).click();
  await expect(cancel.getByRole("alert")).toContainText("No encontramos una reserva");
  await cancel.getByLabel("Teléfono con el que reservaste").fill("318 555 9900");
  await cancel.getByRole("button", { name: "Cancelar reserva" }).click();
  await expect(cancel).toContainText(`Cancelamos tu reserva #${code}`);

  await page.getByRole("button", { name: "Volver a Clientia" }).click();
  await expect(page).toHaveURL(/vista=reservas/);
  await nav(page, "Solicitudes").click();
  await expect(page.getByRole("list", { name: "Solicitudes por confirmar" }).getByText("Clara Cancela")).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Solicitudes respondidas" }).getByRole("listitem").filter({ hasText: "Clara Cancela" })).toContainText("Cancelada");
});

test("los datos del negocio se validan y se ven en la página pública, la cabecera y la pestaña", async ({ page }) => {
  await openDemo(page, "reservas");
  await expect(page).toHaveTitle("Estudio Brisa · Clientia");
  await tab(page, "Datos del negocio").click();
  const form = page.getByRole("form", { name: "Datos del negocio" });
  await form.getByLabel("Nombre del negocio").fill("Spa Luna");
  await form.getByLabel("Teléfono del negocio").fill("abc");
  await form.getByRole("button", { name: "Guardar datos" }).click();
  await expect(form.getByRole("alert")).toContainText("teléfono del negocio");
  await form.getByLabel("Teléfono del negocio").fill("601 555 1234");
  await form.getByLabel("Dirección").fill("Carrera 7 # 12-34, Bogotá");
  await form.getByLabel("Mensaje de bienvenida").fill("Bienvenida a Spa Luna: agenda tu ritual en un minuto.");
  await form.getByRole("button", { name: "Guardar datos" }).click();
  await expect(page.getByRole("status")).toHaveText("Datos del negocio guardados");
  await expect(page).toHaveTitle("Spa Luna · Clientia");

  await tab(page, "Así la ve tu cliente").click();
  await expect(page.getByRole("heading", { name: "Spa Luna" })).toBeVisible();
  await expect(page.getByText("Carrera 7 # 12-34, Bogotá · Tel. 601 555 1234")).toBeVisible();
  await expect(page.getByText("Bienvenida a Spa Luna: agenda tu ritual en un minuto.")).toBeVisible();

  await page.getByRole("button", { name: "Abrir como cliente" }).click();
  await expect(page).toHaveURL(/vista=reservar/);
  await expect(page.getByRole("heading", { name: "Spa Luna" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Secciones de Clientia" })).toHaveCount(0);
});

test("enlace para compartir con código QR generado en el navegador", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  await openDemo(page, "reservas");
  await tab(page, "Compartir y reglas").click();
  const link = page.getByRole("textbox", { name: "Enlace de la página de reservas" });
  await expect(link).toHaveValue(/\/demos\/clientia\?vista=reservar$/);
  const qr = page.getByRole("img", { name: "Código QR de la página de reservas de Estudio Brisa" });
  await expect(qr).toBeVisible();
  await expect(qr).toHaveAttribute("src", /^data:image\/svg\+xml/);
  await page.getByRole("button", { name: "Copiar enlace" }).click();
  await expect(page.getByRole("status")).toHaveText(/Enlace copiado|Selecciona y copia/);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Descargar QR (SVG)" }).click()]);
  expect(download.suggestedFilename()).toBe("clientia-qr-reservas.svg");
});

test("comprobante imprimible de una cita: en papel solo sale el comprobante", async ({ page }) => {
  await openDemo(page, "solicitudes");
  await page.getByRole("list", { name: "Solicitudes por confirmar" }).getByRole("button", { name: "Ver la cita de Paula Quintero" }).click();
  const dialog = page.getByRole("dialog", { name: "Cita" });
  await dialog.getByRole("button", { name: "Comprobante" }).click();
  const receipt = dialog.getByRole("article", { name: /^Comprobante de la cita/ });
  await expect(receipt).toContainText("Paula Quintero");
  await expect(receipt).toContainText("Por confirmar");
  await expect(receipt).toContainText("Calle 10 # 43-25");

  await page.evaluate(() => {
    window.print = () => document.body.setAttribute("data-printed", "1");
  });
  await dialog.getByRole("button", { name: "Imprimir comprobante" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-printed", "1");
  await page.emulateMedia({ media: "print" });
  await expect(receipt).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Imprimir comprobante" })).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Secciones de Clientia" })).toBeHidden();
  await page.emulateMedia({ media: "screen" });

  // Desde la misma cita se confirma la solicitud.
  await dialog.getByRole("button", { name: "← Volver a la cita" }).click();
  await dialog.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(page.getByRole("status")).toHaveText(/^Reserva confirmada/);
});

test("identidad propia: acento rosa e isotipo, con el negocio en la cabecera", async ({ page }) => {
  await openDemo(page);
  const shell = page.locator("[data-ui]").filter({ has: page.getByRole("navigation", { name: "Secciones de Clientia" }) });
  await expect(shell).toHaveAttribute("style", /--color-brand:\s*#f49ab8/);
  const navEl = page.getByRole("navigation", { name: "Secciones de Clientia" });
  if (!test.info().project.name.includes("mobile")) {
    await expect(navEl.locator("svg").first()).toBeVisible();
    await expect(navEl.getByText("Estudio Brisa")).toBeVisible();
  }
});

test("importa clientes desde un CSV de Excel con informe de errores por fila", async ({ page }) => {
  await openDemo(page, "clientes");
  await page.getByRole("button", { name: "Importar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Importar clientes" });
  const csv = "﻿Nombre;Celular;Correo;Recordatorio\nLucía Arango;300 123 4567;lucia@ejemplo.com;WhatsApp\nJo;;;\nRepetida;300 555 0101;;\nMarta Sin Canal;;marta@ejemplo.com;\nCarlos Fax;310 000 1111;;fax\n";
  await dialog.locator('input[type="file"]').setInputFiles({ name: "clientes.csv", mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
  const review = dialog.getByRole("region", { name: "Resultado de la revisión" });
  await expect(review).toContainText("2 listas para importar");
  await expect(review).toContainText("3 con errores");
  await expect(review).toContainText("Fila 3: el nombre es muy corto");
  await expect(review).toContainText("Fila 4: ya hay un cliente con el teléfono 300 555 0101");
  await expect(review).toContainText('Fila 6: recordatorio "fax" no válido');
  await dialog.getByRole("button", { name: "Importar 2 clientes" }).click();
  await expect(page.getByRole("status")).toHaveText("2 clientes importados");
  const table = page.getByRole("table", { name: "Clientes" });
  await expect(table.getByRole("button", { name: "Lucía Arango", exact: true })).toBeVisible();
  await expect(table.getByRole("row", { name: /Marta Sin Canal/ })).toContainText("Correo");
});
