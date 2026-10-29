import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/** Clientes, tarifas, tiempo facturable, cuentas de cobro, informes, ajustes del emisor e importación (issue #57). */

async function open(page: Page, vista?: string) {
  await page.goto(`/demos/taskpro${vista ? `?vista=${vista}` : ""}`);
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
}

function nav(page: Page) {
  return page.getByRole("navigation", { name: "Secciones de TaskPro" });
}

async function go(page: Page, label: string, heading: string) {
  await nav(page).getByRole("button", { name: new RegExp(`^${label}`) }).click();
  await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
}

function dateInput(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Cliente + proyecto por hora a 100.000 + 2 h 30 min facturables de anteayer (05:00, sin cruces con la semilla). */
async function clientWithBillableTime(page: Page) {
  await open(page, "clientes");
  await page.getByRole("button", { name: "Nuevo cliente" }).click();
  const clientDialog = page.getByRole("dialog", { name: "Nuevo cliente" });
  await clientDialog.getByLabel("Nombre o razón social").fill("Ferretería Norte S.A.S.");
  await clientDialog.getByLabel("NIT o número de documento").fill("900.555.111-2");
  await clientDialog.getByRole("button", { name: "Guardar" }).click();
  await expect(clientDialog).toBeHidden();

  await go(page, "Proyectos", "Proyectos");
  await page.getByRole("button", { name: "Nuevo proyecto" }).click();
  const projectDialog = page.getByRole("dialog", { name: "Nuevo proyecto" });
  await projectDialog.getByLabel("Nombre").fill("Tienda Ferretería Norte");
  await projectDialog.getByLabel("Cliente").selectOption({ label: "Ferretería Norte S.A.S." });
  await projectDialog.getByLabel("Tarifa por hora (COP)").fill("100.000");
  await projectDialog.getByRole("button", { name: "Guardar" }).click();
  await expect(projectDialog).toBeHidden();
  await expect(page.getByText("$ 100.000 por hora")).toBeVisible();

  await go(page, "Tiempo", "Registro de tiempo");
  await page.getByRole("button", { name: "Entrada manual" }).click();
  const entry = page.getByRole("dialog", { name: "Entrada manual" });
  await entry.getByLabel("Proyecto").selectOption({ label: "Tienda Ferretería Norte" });
  await expect(entry.getByLabel("Facturable (se puede incluir en una cuenta de cobro)")).toBeChecked();
  await entry.getByLabel("Fecha").fill(dateInput(2));
  await entry.getByLabel("Hora de inicio").fill("05:00");
  await entry.getByLabel("Horas").fill("2");
  await entry.getByLabel("Minutos").fill("30");
  await entry.getByLabel("Nota").fill("Montaje del catálogo");
  await entry.getByRole("button", { name: "Guardar" }).click();
  await expect(entry).toBeHidden();
}

test("CRUD de clientes con validación; no se elimina un cliente con proyectos", async ({ page }) => {
  await open(page, "clientes");
  await page.getByRole("button", { name: "Nuevo cliente" }).click();
  const dialog = page.getByRole("dialog", { name: "Nuevo cliente" });
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Escribe el nombre o la razón social.");
  await dialog.getByLabel("Nombre o razón social").fill("Panadería La Espiga");
  await dialog.getByLabel("Tipo de documento").selectOption({ label: "Cédula de ciudadanía" });
  await dialog.getByLabel("NIT o número de documento").fill("abc");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog.getByRole("alert")).toContainText("El documento solo lleva números");
  await dialog.getByLabel("NIT o número de documento").fill("43.123.456");
  await dialog.getByLabel("Persona de contacto").fill("Marta Ruiz");
  await dialog.getByLabel("Correo").fill("marta@");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog.getByRole("alert")).toContainText("El correo no tiene una forma válida");
  await dialog.getByLabel("Correo").fill("marta@laespiga.ejemplo.co");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog).toBeHidden();
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Panadería La Espiga" }) });
  await expect(card).toContainText("C.C. 43.123.456");
  await expect(card).toContainText("Marta Ruiz");

  await page.getByRole("button", { name: 'Editar "Panadería La Espiga"' }).click();
  const edit = page.getByRole("dialog", { name: "Editar cliente" });
  await edit.getByLabel("Ciudad").fill("Tunja");
  await edit.getByRole("button", { name: "Guardar" }).click();
  await expect(card).toContainText("Tunja");

  // Un cliente con proyectos no se puede eliminar.
  await page.getByRole("button", { name: 'Eliminar "Café Altamira S.A.S."' }).click();
  const blocked = page.getByRole("dialog", { name: "No se puede eliminar" });
  await expect(blocked).toContainText("tiene 1 proyecto");
  await blocked.getByRole("button", { name: "Entendido" }).click();

  await page.getByRole("button", { name: 'Eliminar "Panadería La Espiga"' }).click();
  await page.getByRole("dialog", { name: "Eliminar cliente" }).getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByRole("heading", { name: "Panadería La Espiga" })).toBeHidden();
});

test("del tiempo facturable a la cuenta de cobro: total en COP, consecutivo, sin cobrar dos veces y estados", async ({ page }) => {
  await clientWithBillableTime(page);

  await go(page, "Clientes", "Clientes");
  await page.getByRole("button", { name: 'Nueva cuenta de cobro para "Ferretería Norte S.A.S."' }).click();
  // La semilla trae CC-0001 y CC-0002: sigue la CC-0003.
  const dialog = page.getByRole("dialog", { name: "Nueva cuenta de cobro CC-0003" });
  await expect(dialog.getByRole("table", { name: "Vista previa de horas" })).toContainText("2,5 h");
  await expect(dialog.getByText(/\$\s250\.000 COP/)).toBeVisible();
  await dialog.getByRole("button", { name: "Crear borrador" }).click();
  await expect(dialog).toBeHidden();

  const doc = page.getByRole("article", { name: "Cuenta de cobro CC-0003" });
  await expect(doc).toContainText("Ferretería Norte S.A.S.");
  await expect(doc).toContainText("NIT 900.555.111-2");
  await expect(doc).toContainText("Tienda Ferretería Norte");
  await expect(doc.getByRole("table", { name: "Detalle de CC-0003" })).toContainText(/\$\s250\.000/);
  await expect(doc).toContainText("Borrador");

  // Las horas quedan marcadas como cobradas y bloqueadas en el registro de tiempo.
  await go(page, "Tiempo", "Registro de tiempo");
  const row = page.getByRole("table", { name: "Entradas de tiempo" }).getByRole("row").filter({ hasText: "Montaje del catálogo" });
  await expect(row).toContainText("Cobrada en CC-0003");
  await expect(row.getByRole("button", { name: /^Editar entrada/ })).toHaveCount(0);

  // No se cobran dos veces.
  await go(page, "Cobros", "Cuentas de cobro");
  // Cobros recuerda la cuenta abierta; se vuelve a la lista.
  await page.getByRole("button", { name: "Todas las cuentas de cobro" }).click();
  await page.getByLabel("Cliente").selectOption({ label: "Ferretería Norte S.A.S." });
  await page.getByRole("button", { name: "Nueva cuenta de cobro" }).click();
  const again = page.getByRole("dialog", { name: "Nueva cuenta de cobro CC-0004" });
  await expect(again.getByText("No hay horas facturables sin cobrar de este cliente en el periodo.")).toBeVisible();
  await again.getByRole("button", { name: "Crear borrador" }).click();
  await expect(again.getByRole("alert")).toContainText("No hay horas facturables sin cobrar");
  await again.getByRole("button", { name: "Cancelar" }).click();

  // Estados: borrador → enviada → pagada.
  await page.getByRole("button", { name: "Ver CC-0003" }).click();
  await page.getByRole("button", { name: "Marcar como enviada" }).click();
  await expect(page.getByRole("status")).toContainText("CC-0003 marcada como enviada");
  await page.getByRole("button", { name: "Registrar pago" }).click();
  const pay = page.getByRole("dialog", { name: "Registrar pago de CC-0003" });
  await pay.getByRole("button", { name: "Registrar pago" }).click();
  await expect(page.getByRole("status")).toContainText("CC-0003 pagada");
  await expect(page.getByRole("article", { name: "Cuenta de cobro CC-0003" })).toContainText("Pagada el");

  await page.getByRole("button", { name: "Todas las cuentas de cobro" }).click();
  const listRow = page.getByRole("table", { name: "Cuentas de cobro" }).getByRole("row").filter({ hasText: "CC-0003" });
  await expect(listRow).toContainText("Pagada");
  await expect(listRow).toContainText(/\$\s250\.000/);
});

test("una entrada no facturable no entra en la cuenta de cobro", async ({ page }) => {
  await clientWithBillableTime(page);
  const row = page.getByRole("table", { name: "Entradas de tiempo" }).getByRole("row").filter({ hasText: "Montaje del catálogo" });
  await row.getByRole("checkbox", { name: /^Facturable/ }).uncheck();
  await expect(row).toContainText("No facturable");

  await go(page, "Clientes", "Clientes");
  await page.getByRole("button", { name: 'Nueva cuenta de cobro para "Ferretería Norte S.A.S."' }).click();
  const dialog = page.getByRole("dialog", { name: "Nueva cuenta de cobro CC-0003" });
  await expect(dialog.getByText("No hay horas facturables sin cobrar de este cliente en el periodo.")).toBeVisible();
});

test("los ajustes del emisor se validan y salen en la cuenta de cobro imprimible", async ({ page }) => {
  await open(page, "ajustes");
  const form = page.getByRole("form", { name: "Ajustes del emisor" });
  await form.getByLabel("Nombre o razón social").fill("");
  await form.getByRole("button", { name: "Guardar ajustes" }).click();
  await expect(form.getByRole("alert")).toHaveText("Escribe tu nombre o el de tu negocio.");
  await form.getByLabel("Nombre o razón social").fill("Laura Montoya Díaz");
  await form.getByLabel("Número de documento").fill("1.098.765.432");
  await form.getByLabel("Ciudad").fill("Bucaramanga");
  await form.getByLabel("Banco").fill("Banco de Prueba");
  await form.getByLabel("Número de cuenta").fill("123-456789-01");
  await form.getByLabel("Pie de las cuentas de cobro").fill("Texto legal de prueba para el pie.");
  await form.getByRole("button", { name: "Guardar ajustes" }).click();
  await expect(page.getByRole("status")).toContainText("Ajustes guardados");

  await go(page, "Cobros", "Cuentas de cobro");
  await page.getByRole("button", { name: "Ver CC-0002" }).click();
  const doc = page.getByRole("article", { name: "Cuenta de cobro CC-0002" });
  await expect(doc).toContainText("Laura Montoya Díaz");
  await expect(doc).toContainText("C.C. 1.098.765.432");
  await expect(doc).toContainText("Bucaramanga");
  await expect(doc).toContainText("123-456789-01");
  await expect(doc).toContainText("Banco de Prueba");
  await expect(doc).toContainText("Texto legal de prueba para el pie.");

  // Al imprimir solo queda el documento.
  await page.emulateMedia({ media: "print" });
  await expect(doc).toBeVisible();
  await expect(nav(page)).toBeHidden();
  await expect(page.getByRole("button", { name: "Imprimir" })).toBeHidden();
});

test("el informe para el cliente muestra el avance de sus proyectos y se puede imprimir", async ({ page }) => {
  await open(page, "clientes");
  await page.getByRole("button", { name: 'Informe para "Cooperativa Recaudo+"' }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Informe para el cliente" })).toBeVisible();
  const report = page.getByRole("article", { name: "Informe de avance para Cooperativa Recaudo+" });
  const project = report.getByRole("region", { name: "Proyecto API de pagos Recaudo+" });
  await expect(project).toContainText("3 tareas hechas · 2 en curso · 3 pendientes");
  await expect(project).toContainText("Reintentos con backoff exponencial");
  await expect(report).toContainText("Daniel Restrepo Ortiz");
  await expect(page.getByRole("button", { name: "Imprimir informe" })).toBeEnabled();

  await page.getByLabel("Desde").fill(dateInput(0));
  await page.getByLabel("Hasta").fill(dateInput(5));
  await expect(page.getByRole("alert")).toContainText("Revisa el periodo");
  await expect(page.getByRole("button", { name: "Imprimir informe" })).toBeDisabled();
});

test("importa tareas desde CSV con validación por fila", async ({ page }) => {
  await open(page, "tablero");
  await page.getByRole("button", { name: "Importar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Importar tareas" });
  const csv = [
    "Tarea;Proyecto;Estado;Prioridad;Etiquetas;Fecha límite",
    "Página de preguntas frecuentes;Tienda Café Altamira;En progreso;Alta;frontend, contenido;15/12/2030",
    "Tarea de un proyecto que no existe;Proyecto fantasma;Pendiente;Media;;",
    "Fecha imposible;Tienda Café Altamira;Pendiente;Media;;31/02/2030",
    "Página de preguntas frecuentes;Tienda Café Altamira;Pendiente;Media;;",
  ].join("\n");
  await dialog.locator('input[type="file"]').setInputFiles({ name: "tareas.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  const review = dialog.getByRole("region", { name: "Resultado de la revisión" });
  await expect(review).toContainText("1 listas para importar");
  await expect(review).toContainText("3 con errores");
  await expect(review).toContainText('El proyecto "Proyecto fantasma" no existe');
  await expect(review).toContainText('La fecha "31/02/2030" no es válida');
  await expect(review).toContainText("ya está en la fila 2 del archivo");
  await dialog.getByRole("button", { name: "Importar 1 tareas" }).click();
  await expect(page.getByRole("status")).toContainText("1 tarea importada");
  const doing = page.getByRole("region", { name: "En progreso", exact: true });
  await expect(doing.getByRole("button", { name: "Página de preguntas frecuentes", exact: true })).toBeVisible();
});

test("empezar vacío deja TaskPro sin registros y guía el primer paso", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Tus datos" }).click();
  const data = page.getByRole("dialog", { name: "Tus datos en esta demo" });
  await data.getByRole("button", { name: "Empezar vacío" }).click();
  await page.getByRole("dialog", { name: "Empezar vacío" }).getByRole("button", { name: "Empezar vacío" }).click();
  await expect(page.getByText("Aún no tienes proyectos")).toBeVisible();

  await page.getByRole("button", { name: "Nuevo cliente" }).click();
  const dialog = page.getByRole("dialog", { name: "Nuevo cliente" });
  await dialog.getByLabel("Nombre o razón social").fill("Primer Cliente S.A.S.");
  await dialog.getByLabel("NIT o número de documento").fill("901.000.001-1");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("button", { name: "Ir a Proyectos" })).toBeVisible();

  await go(page, "Cobros", "Cuentas de cobro");
  await expect(page.getByText("Aún no tienes cuentas de cobro")).toBeVisible();
  await go(page, "Ajustes", "Ajustes del emisor");
  await expect(page.getByRole("form", { name: "Ajustes del emisor" }).getByLabel("Nombre o razón social")).toHaveValue("");
});

test("migra los proyectos guardados por la versión anterior (cliente como texto)", async ({ page }) => {
  await page.addInitScript(() => {
    if (window.localStorage.getItem("hgs-demo:taskpro:proyectos.v2")) return;
    const p = (id: string, name: string, client: string) => ({ id, name, client, color: "azul", status: "active", repo: "", createdAt: Date.now() });
    window.localStorage.setItem("hgs-demo:taskpro:proyectos.v1", JSON.stringify([p("p-a", "Sitio Viejo", "Cliente Antiguo"), p("p-b", "App Vieja", "cliente antiguo ")]));
    window.localStorage.setItem("hgs-demo:taskpro:tareas.v1", JSON.stringify([]));
    window.localStorage.setItem(
      "hgs-demo:taskpro:tiempo.v1",
      JSON.stringify([{ id: "e-old", projectId: "p-a", taskId: null, start: Date.now() - 3 * 3_600_000, end: Date.now() - 2 * 3_600_000, note: "Trabajo previo" }]),
    );
  });
  await open(page, "proyectos");
  await expect(page.getByRole("status")).toContainText("Actualizamos tus datos");
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Sitio Viejo" }) });
  await expect(card).toContainText("Cliente Antiguo");
  await expect(card).toContainText("Sin tarifa por hora");

  await go(page, "Clientes", "Clientes");
  // Los dos proyectos comparten cliente (mismo nombre, sin distinguir mayúsculas ni espacios).
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
  await expect(page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Cliente Antiguo" }) })).toContainText("Sitio Viejo, App Vieja");

  await go(page, "Tiempo", "Registro de tiempo");
  await expect(page.getByRole("table", { name: "Entradas de tiempo" }).getByRole("row").filter({ hasText: "Trabajo previo" })).toContainText("Por cobrar");
  // Los almacenes viejos ya no están.
  expect(await page.evaluate(() => window.localStorage.getItem("hgs-demo:taskpro:proyectos.v1"))).toBeNull();
});
