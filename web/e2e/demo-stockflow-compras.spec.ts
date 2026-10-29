import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function open(page: Page, query = "") {
  await page.goto(`/demos/stockflow${query}`);
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
}

async function go(page: Page, section: RegExp) {
  await page.getByRole("navigation", { name: "Secciones de StockFlow" }).getByRole("button", { name: section }).click();
}

async function useAs(page: Page, name: string) {
  await page.getByRole("combobox", { name: "Usar la demo como" }).selectOption({ label: name });
}

const productRow = (page: Page, name: string) => page.getByRole("table", { name: "Productos" }).getByRole("row").filter({ hasText: name });

test("proveedores: crea, valida, asigna como proveedor habitual y no borra uno con historial", async ({ page }) => {
  await open(page);
  await go(page, /^Proveedores/);
  await page.getByRole("button", { name: "Nuevo proveedor" }).click();
  const dialog = page.getByRole("dialog", { name: "Nuevo proveedor" });
  await dialog.getByLabel("Nombre o razón social").fill("distribuidora andina");
  await dialog.getByRole("button", { name: "Crear proveedor" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Ya existe un proveedor");

  await dialog.getByLabel("Nombre o razón social").fill("Ferreléctricos de Itagüí");
  await dialog.getByLabel("NIT").fill("abc");
  await dialog.getByRole("button", { name: "Crear proveedor" }).click();
  await expect(dialog.getByRole("alert")).toContainText("El NIT solo admite");
  await dialog.getByLabel("NIT").fill("901.555.210-3");
  await dialog.getByLabel("Plazo de entrega (días)").fill("2");
  await dialog.getByLabel("Persona de contacto").fill("Sergio Úsuga");
  await dialog.getByLabel("Teléfono").fill("604 372 0011");
  await dialog.getByRole("button", { name: "Crear proveedor" }).click();
  await expect(dialog).toBeHidden();
  const row = page.getByRole("table", { name: "Proveedores" }).getByRole("row").filter({ hasText: "Ferreléctricos de Itagüí" });
  await expect(row).toContainText("NIT 901.555.210-3");
  await expect(row).toContainText("2 días");

  await page.getByRole("button", { name: 'Editar proveedor "Ferreléctricos de Itagüí"' }).click();
  const edit = page.getByRole("dialog", { name: 'Editar "Ferreléctricos de Itagüí"' });
  await edit.getByLabel("Plazo de entrega (días)").fill("3");
  await edit.getByRole("button", { name: "Guardar" }).click();
  await expect(row).toContainText("3 días");

  // Proveedor habitual de un producto.
  await go(page, /^Productos/);
  await page.getByRole("button", { name: 'Editar "Cinta aislante negra 18 m"' }).click();
  const product = page.getByRole("dialog", { name: 'Editar "Cinta aislante negra 18 m"' });
  await product.getByLabel("Proveedor habitual").selectOption({ label: "Ferreléctricos de Itagüí (3 días de plazo)" });
  await product.getByRole("button", { name: "Guardar" }).click();
  await expect(productRow(page, "Cinta aislante")).toContainText("Ferreléctricos de Itagüí");

  // La sugerencia la agrupa con su nuevo proveedor.
  await go(page, /^Compras/);
  await expect(page.getByRole("region", { name: "Sugerencia para Ferreléctricos de Itagüí" })).toContainText("Cinta aislante negra 18 m");

  // Uno con órdenes de compra no se borra; uno sin historial sí, y su producto queda sin proveedor.
  await go(page, /^Proveedores/);
  await expect(page.getByRole("button", { name: 'Borrar proveedor "Distribuidora Andina"' })).toBeDisabled();
  await page.getByRole("button", { name: 'Borrar proveedor "Ferreléctricos de Itagüí"' }).click();
  const confirm = page.getByRole("dialog", { name: "Borrar proveedor" });
  await expect(confirm).toContainText("1 producto quedará sin proveedor habitual");
  await confirm.getByRole("button", { name: "Borrar" }).click();
  await expect(page.getByRole("table", { name: "Proveedores" }).getByText("Ferreléctricos de Itagüí")).toHaveCount(0);
  await go(page, /^Productos/);
  await expect(productRow(page, "Cinta aislante")).toContainText("Sin proveedor");
});

test("de la sugerencia a una orden de compra recibida en dos partes", async ({ page }) => {
  await open(page);
  await go(page, /^Compras/);
  const group = page.getByRole("region", { name: "Sugerencia para Tornillos y Pernos del Norte" });
  await expect(group).toContainText('Tornillo drywall 6×1" (caja x100)');
  await group.getByRole("button", { name: 'Crear orden de compra para "Tornillos y Pernos del Norte"' }).click();

  const doc = page.getByRole("article", { name: "Orden de compra OC-0005" });
  await expect(doc).toContainText("BORRADOR");
  await expect(doc).toContainText("Tornillos y Pernos del Norte");
  await page.getByRole("button", { name: "Marcar como enviada" }).click();
  await expect(page.getByRole("status")).toContainText("Orden OC-0005 enviada");

  // Lo pedido ya cuenta: el producto sale de la sugerencia.
  await page.getByRole("button", { name: "← Órdenes de compra" }).click();
  await page.getByRole("tab", { name: "Sugerencia de compra" }).click();
  await expect(page.getByRole("region", { name: "Sugerencia para Tornillos y Pernos del Norte" })).toHaveCount(0);

  // Orden manual con otro costo: la recepción parcial mueve stock y costo promedio ponderado.
  await page.getByRole("button", { name: "Nueva orden de compra" }).click();
  const form = page.getByRole("dialog", { name: "Nueva orden de compra" });
  await form.getByRole("button", { name: "Crear borrador" }).click();
  await expect(form.getByRole("alert")).toContainText("Elige el proveedor");
  await form.getByLabel("Proveedor", { exact: true }).selectOption({ label: "Distribuidora Andina" });
  await form.getByLabel("Producto 1", { exact: true }).selectOption({ label: 'Llave inglesa 10" (9 en stock)' });
  await expect(form.getByLabel("Costo unitario 1", { exact: true })).toHaveValue("28000");
  await form.getByLabel("Cantidad 1", { exact: true }).fill("10");
  await form.getByLabel("Costo unitario 1", { exact: true }).fill("31000");
  await expect(form).toContainText(/Total: \$\s310\.000/);
  await form.getByRole("button", { name: "Crear borrador" }).click();
  await expect(form).toBeHidden();

  await expect(page.getByRole("article", { name: "Orden de compra OC-0006" })).toBeVisible();
  await page.getByRole("button", { name: "Marcar como enviada" }).click();

  // Bodega recibe.
  await useAs(page, "Luis Herrera");
  await page.getByRole("button", { name: "Recibir mercancía" }).click();
  const receive = page.getByRole("dialog", { name: "Recibir mercancía de OC-0006" });
  const qty = receive.getByLabel('Recibido de "Llave inglesa 10""');
  await expect(qty).toHaveValue("10");
  await qty.fill("11");
  await receive.getByRole("button", { name: "Registrar recepción" }).click();
  await expect(receive.getByRole("alert")).toContainText("faltan 10");
  await qty.fill("3");
  await expect(receive).toContainText(/costo promedio \$\s28\.000 → \$\s28\.750/);
  await receive.getByLabel("Factura o remisión del proveedor").fill("DA-21007");
  await receive.getByRole("button", { name: "Registrar recepción" }).click();
  await expect(receive).toBeHidden();
  await expect(page.getByText("Recibida parcial").first()).toBeVisible();
  await expect(page.getByRole("region", { name: "Recepciones" })).toContainText('3 × Llave inglesa 10"');

  await go(page, /^Productos/);
  await expect(productRow(page, "Llave inglesa")).toContainText("12 unidad");
  await expect(productRow(page, "Llave inglesa")).toContainText(/\$\s28\.750/);

  await go(page, /^Movimientos/);
  const first = page.getByRole("table", { name: "Historial de movimientos" }).getByRole("row").nth(1);
  await expect(first).toContainText("OC-0006 · Distribuidora Andina, DA-21007");
  await expect(first).toContainText("+3");

  // El saldo llega después y la orden queda recibida.
  await go(page, /^Compras/);
  await page.getByRole("tab", { name: "Órdenes de compra" }).click();
  await page.getByRole("button", { name: "Ver orden de compra OC-0006" }).click();
  await page.getByRole("button", { name: "Recibir mercancía" }).click();
  await expect(receive.getByLabel('Recibido de "Llave inglesa 10""')).toHaveValue("7");
  await receive.getByRole("button", { name: "Registrar recepción" }).click();
  await expect(receive).toBeHidden();
  await expect(page.getByRole("button", { name: "Recibir mercancía" })).toHaveCount(0);
  await go(page, /^Productos/);
  await expect(productRow(page, "Llave inglesa")).toContainText("19 unidad");
  await expect(productRow(page, "Llave inglesa")).toContainText(/\$\s29\.579/);
});

test("los ajustes del negocio salen en la orden de compra y en la remisión", async ({ page }) => {
  await open(page);
  await go(page, /^Ajustes/);
  await page.getByLabel("Nombre del negocio").fill("");
  await page.getByRole("button", { name: "Guardar ajustes" }).click();
  await expect(page.getByRole("alert")).toContainText("Escribe el nombre del negocio");
  await page.getByLabel("Nombre del negocio").fill("Ferretería La Tuerca");
  await page.getByLabel("NIT").fill("901.234.567-8");
  await page.getByLabel("Dirección").fill("Carrera 50 # 10-20");
  await page.getByLabel("Ciudad").fill("Envigado");
  await page.getByLabel("Teléfono").fill("604 333 2211");
  await page.getByRole("button", { name: "Guardar ajustes" }).click();
  await expect(page.getByRole("status")).toContainText("Ajustes del negocio guardados");

  await go(page, /^Compras/);
  await page.getByRole("tab", { name: "Órdenes de compra" }).click();
  await page.getByRole("button", { name: "Ver orden de compra OC-0003" }).click();
  const po = page.getByRole("article", { name: "Orden de compra OC-0003" });
  await expect(po).toContainText("Ferretería La Tuerca");
  await expect(po).toContainText("NIT 901.234.567-8");
  await expect(po).toContainText("Carrera 50 # 10-20");
  await expect(po).toContainText("Tel. 604 333 2211");
  await expect(po).toContainText("Pinturas Aburrá");
  await expect(page.getByRole("button", { name: "Imprimir" })).toBeVisible();

  await go(page, /^Pedidos/);
  await page.getByRole("button", { name: "Ver pedido P-1040" }).click();
  await page.getByRole("dialog", { name: "Pedido P-1040" }).getByRole("button", { name: /^Ver remisión REM-/ }).click();
  const remission = page.getByRole("article", { name: /^Remisión REM-/ });
  await expect(remission).toContainText("Ferretería La Tuerca");
  await expect(remission).toContainText("Envigado");
  await expect(remission).toContainText("Taller Hermanos Restrepo");
  await expect(remission).toContainText("Recibe a satisfacción");

  // Al imprimir solo queda el documento.
  await page.emulateMedia({ media: "print" });
  await expect(remission).toBeVisible();
  await expect(page.getByRole("button", { name: "Imprimir" })).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Secciones de StockFlow" })).toBeHidden();
  await page.emulateMedia({ media: "screen" });

  // Datos incompletos: aviso para completarlos.
  await go(page, /^Ajustes/);
  await page.getByLabel("NIT").fill("");
  await page.getByRole("button", { name: "Guardar ajustes" }).click();
  await go(page, /^Compras/);
  await page.getByRole("tab", { name: "Órdenes de compra" }).click();
  await page.getByRole("button", { name: "Ver orden de compra OC-0003" }).click();
  await expect(page.getByText("Faltan datos del negocio en el encabezado: NIT.")).toBeVisible();
});

test("caja no ve compras; identidad propia y nombre del negocio", async ({ page }) => {
  await open(page);
  const nav = page.getByRole("navigation", { name: "Secciones de StockFlow" });
  if (test.info().project.name === "desktop") await expect(nav).toContainText("Ferretería El Tornillo · Medellín");
  await expect(nav.getByRole("button", { name: /^Compras/ })).toBeVisible();
  await useAs(page, "Marta Ospina");
  await expect(nav.getByRole("button", { name: /^Compras/ })).toHaveCount(0);
  await expect(nav.getByRole("button", { name: /^Proveedores/ })).toHaveCount(0);
  await open(page, "?vista=compras");
  await expect(page.getByText("Tu rol no ve las compras")).toBeVisible();
  await go(page, /^Ajustes/);
  await expect(page.getByLabel("Nombre del negocio")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Guardar ajustes" })).toHaveCount(0);
});

test("importa productos desde CSV con su proveedor y rechaza las filas inválidas", async ({ page }) => {
  await open(page);
  await go(page, /^Productos/);
  await page.getByRole("button", { name: "Importar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Importar productos" });
  const csv = [
    "Nombre;SKU;Categoría;Costo;Precio de venta;Stock mínimo;Stock inicial;Proveedor",
    "Pegante PVC 1/4 galón;PLO-PE14;Plomería;18.500;27.000;4;10;Distribuidora Andina",
    "Repetido;TOR-0610;Tornillería;100;200;1;1;",
    "Sin proveedor real;HER-XX01;Herramientas;1000;2000;1;1;Proveedor Fantasma",
  ].join("\n");
  await dialog.locator('input[type="file"]').setInputFiles({ name: "productos.csv", mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
  await expect(dialog).toContainText("1 listas para importar");
  await expect(dialog).toContainText("2 con errores");
  await expect(dialog).toContainText("ya lo usa");
  await expect(dialog).toContainText('El proveedor "Proveedor Fantasma" no existe');
  await dialog.getByRole("button", { name: "Importar 1 productos" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("status")).toContainText("1 producto importado");
  const row = productRow(page, "Pegante PVC");
  await expect(row).toContainText("PLO-PE14 · Distribuidora Andina");
  await expect(row).toContainText("10 unidad");
});

test("empezar vacío deja StockFlow sin registros y la copia de seguridad lo restaura", async ({ page }) => {
  await open(page);
  await go(page, /^Proveedores/);
  await page.getByRole("button", { name: "Tus datos" }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Descargar copia" }).click()]);
  const backup = await download.path();

  await page.getByRole("button", { name: "Empezar vacío" }).click();
  await page.getByRole("dialog", { name: "Empezar vacío" }).getByRole("button", { name: "Empezar vacío" }).click();
  await expect(page.getByRole("region", { name: "Aún no tienes proveedores" })).toBeVisible();
  await go(page, /^Productos/);
  await expect(page.getByRole("region", { name: "Aún no tienes productos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Importar", exact: true })).toBeEnabled();
  await go(page, /^Ajustes/);
  await expect(page.getByLabel("Nombre del negocio")).toHaveValue("Mi negocio");

  await page.getByRole("button", { name: "Tus datos" }).click();
  await page.locator('input[type="file"][accept=".json,application/json"]').setInputFiles(backup);
  await go(page, /^Proveedores/);
  await expect(page.getByRole("table", { name: "Proveedores" })).toContainText("Distribuidora Andina");
});
