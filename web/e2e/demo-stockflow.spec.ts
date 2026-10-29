import fs from "node:fs";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function open(page: Page) {
  await page.goto("/demos/stockflow");
  await expect(page.getByRole("heading", { name: "Panel", level: 2 })).toBeVisible();
}

async function go(page: Page, section: RegExp) {
  await page.getByRole("navigation", { name: "Secciones de StockFlow" }).getByRole("button", { name: section }).click();
}

async function useAs(page: Page, name: string) {
  await page.getByRole("combobox", { name: "Usar la demo como" }).selectOption({ label: name });
}

test("crea un producto, valida el SKU único y sobrevive a la recarga", async ({ page }) => {
  await open(page);
  await go(page, /^Productos/);
  await page.getByRole("button", { name: "Nuevo producto" }).click();

  const dialog = page.getByRole("dialog", { name: "Nuevo producto" });
  await dialog.getByLabel("Nombre").fill("Pala cuadrada mango de madera");
  await dialog.getByLabel("SKU").fill("TOR-0610");
  await dialog.getByLabel("Categoría").selectOption("Herramientas");
  await dialog.getByLabel("Stock mínimo").fill("3");
  await dialog.getByLabel("Costo (COP)").fill("30000");
  await dialog.getByLabel("Precio de venta (COP)").fill("45000");
  await dialog.getByLabel("Stock inicial").fill("2");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog.getByRole("alert")).toContainText("ya lo usa");

  await dialog.getByLabel("SKU").fill("her-pa01");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog).toBeHidden();

  const row = page.getByRole("table", { name: "Productos" }).getByRole("row").filter({ hasText: "Pala cuadrada" });
  await expect(row).toContainText("HER-PA01");
  await expect(row).toContainText("Bajo mínimo");

  await page.reload();
  await expect(page.getByRole("table", { name: "Productos" }).getByRole("row").filter({ hasText: "Pala cuadrada" })).toBeVisible();
});

test("una salida no deja stock negativo y una entrada se refleja en todas las pantallas", async ({ page }) => {
  await open(page);
  await go(page, /^Movimientos/);
  await page.getByRole("button", { name: "Registrar movimiento" }).click();
  const dialog = page.getByRole("dialog", { name: "Registrar movimiento" });
  await dialog.getByText("Salida", { exact: true }).click();
  await dialog.getByLabel("Producto").selectOption({ label: "Cinta aislante negra 18 m (0 en stock)" });
  await dialog.getByLabel("Cantidad").fill("5");
  await dialog.getByRole("button", { name: "Registrar" }).click();
  await expect(dialog.getByRole("alert")).toContainText("No alcanza el stock");
  await dialog.getByRole("button", { name: "Cancelar" }).click();

  await go(page, /^Panel/);
  const restock = page.getByRole("region", { name: "Necesitan reposición" });
  await restock
    .getByRole("button", {
      name: 'Registrar entrada de "Cinta aislante negra 18 m"',
    })
    .click();
  await expect(dialog.getByLabel("Cantidad")).toHaveValue("20");
  await dialog.getByLabel("Nota").fill("Compra a Eléctricos del Sur");
  await dialog.getByRole("button", { name: "Registrar" }).click();
  await expect(page.getByRole("status")).toContainText("Entrada registrada");
  await expect(restock.getByText("Cinta aislante negra 18 m")).toHaveCount(0);

  await go(page, /^Movimientos/);
  const first = page.getByRole("table", { name: "Historial de movimientos" }).getByRole("row").nth(1);
  await expect(first).toContainText("Cinta aislante negra 18 m");
  await expect(first).toContainText("+20");
  await expect(first).toContainText("Ana Gómez");

  await go(page, /^Productos/);
  const row = page.getByRole("table", { name: "Productos" }).getByRole("row").filter({ hasText: "Cinta aislante" });
  await expect(row).toContainText("20 unidad");
  await expect(row).toContainText("OK");
});

test("los permisos por rol se aplican en la interfaz", async ({ page }) => {
  await open(page);
  await useAs(page, "Marta Ospina");
  await go(page, /^Productos/);
  await expect(page.getByRole("button", { name: "Nuevo producto" })).toBeDisabled();
  await expect(page.getByRole("button", { name: /^Editar "/ })).toHaveCount(0);

  await page
    .getByRole("button", {
      name: 'Registrar movimiento de "Brocha 3" cerda natural"',
    })
    .click();
  const dialog = page.getByRole("dialog", { name: "Registrar movimiento" });
  await expect(dialog.getByRole("radio", { name: "Entrada" })).toBeDisabled();
  await expect(dialog.getByRole("radio", { name: "Salida" })).toBeChecked();
  await dialog.getByRole("button", { name: "Cancelar" }).click();

  await useAs(page, "Luis Herrera");
  await expect(page.getByRole("button", { name: 'Editar "Brocha 3" cerda natural"' })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Archivar "/ })).toHaveCount(0);
  await go(page, /^Usuarios/);
  await expect(page.getByRole("button", { name: "Nuevo usuario" })).toBeDisabled();

  await useAs(page, "Ana Gómez");
  await page.getByRole("button", { name: "Nuevo usuario" }).click();
  const userDialog = page.getByRole("dialog", { name: "Nuevo usuario" });
  await userDialog.getByLabel("Nombre completo").fill("Pedro Salazar");
  await userDialog.getByLabel("Rol").selectOption({ label: "Bodega" });
  await userDialog.getByRole("button", { name: "Crear usuario" }).click();
  await expect(page.getByRole("table", { name: "Usuarios" })).toContainText("Pedro Salazar");
  await page.getByRole("combobox", { name: 'Rol de "Pedro Salazar"' }).selectOption({ label: "Caja" });
  await useAs(page, "Pedro Salazar");
  await expect(page.getByText("Rol: Caja").locator("visible=true")).toBeVisible();
});

test("un pedido sin stock no se despacha; uno nuevo sí y descuenta inventario", async ({ page }) => {
  await open(page);
  await go(page, /^Pedidos/);
  await page.getByRole("button", { name: "Ver pedido P-1039" }).click();
  const detail = page.getByRole("dialog", { name: "Pedido P-1039" });
  await detail.getByRole("button", { name: "Despachar" }).click();
  await expect(detail.getByRole("alert")).toContainText("No alcanza el stock");
  await expect(detail.getByRole("alert")).toContainText("Cinta aislante negra 18 m: pide 10, hay 0");
  await detail.getByRole("button", { name: "Cerrar" }).click();

  await page.getByRole("button", { name: "Nuevo pedido" }).click();
  const form = page.getByRole("dialog", { name: "Nuevo pedido" });
  await form.getByRole("button", { name: "Crear pedido" }).click();
  await expect(form.getByRole("alert")).toContainText("Escribe el nombre del cliente");
  await form.getByLabel("Cliente").fill("Remodelaciones Laureles");
  await form.getByLabel("Producto 1", { exact: true }).selectOption({ label: "Cemento gris uso general 50 kg" });
  await form.getByLabel("Cantidad 1", { exact: true }).fill("5");
  await expect(form).toContainText(/Total: \$\s180\.000/);
  await form.getByRole("button", { name: "Crear pedido" }).click();
  await expect(form).toBeHidden();

  await page.getByRole("button", { name: "Ver pedido P-1042" }).click();
  await page.getByRole("dialog", { name: "Pedido P-1042" }).getByRole("button", { name: "Despachar" }).click();
  await expect(page.getByRole("status")).toContainText("Pedido P-1042 despachado");
  await page.getByLabel("Filtrar por estado").selectOption("dispatched");
  await expect(page.getByRole("table", { name: "Pedidos" }).getByRole("row").filter({ hasText: "P-1042" })).toContainText("Despachado");

  await go(page, /^Movimientos/);
  const first = page.getByRole("table", { name: "Historial de movimientos" }).getByRole("row").nth(1);
  await expect(first).toContainText("Pedido P-1042");
  await expect(first).toContainText("−5");
  await expect(first).toContainText("60");
});

test("un producto con historial se archiva en lugar de borrarse y se puede restaurar", async ({ page }) => {
  await open(page);
  await go(page, /^Productos/);
  await page.getByRole("button", { name: 'Archivar "Llave inglesa 10""' }).click();
  const confirm = page.getByRole("dialog", { name: "Archivar producto" });
  await expect(confirm).toContainText("se archiva");
  await confirm.getByRole("button", { name: "Archivar" }).click();
  const table = page.getByRole("table", { name: "Productos" });
  await expect(table.getByText('Llave inglesa 10"')).toHaveCount(0);

  await page.getByLabel("Filtrar por estado").selectOption("archived");
  await page.getByRole("button", { name: 'Restaurar "Llave inglesa 10""' }).click();
  await expect(page.getByText("No hay productos archivados.")).toBeVisible();
  await page.getByLabel("Filtrar por estado").selectOption("all");
  await expect(table.getByText('Llave inglesa 10"')).toBeVisible();
});

test("exporta a CSV solo los productos filtrados", async ({ page }) => {
  await open(page);
  await go(page, /^Productos/);
  await page.getByLabel("Filtrar por categoría").selectOption("Pinturas");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exportar productos a CSV" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^stockflow-productos.*\.csv$/);
  const csv = fs.readFileSync(await download.path(), "utf8");
  expect(csv).toContain("Producto;SKU;Categoría;Unidad;Stock;Mínimo;Costo (COP);Precio (COP);Estado");
  expect(csv).toContain("PIN-BR03;Pinturas");
  expect(csv).not.toContain("CON-CE50");
});

async function searchAll(page: Page, text: string) {
  if (test.info().project.name === "mobile") await page.getByRole("button", { name: "Buscar en todo" }).click();
  else await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Buscar en la demo" });
  await palette.getByRole("combobox", { name: "Buscar registros o pantallas" }).fill(text);
  await expect(palette.getByRole("option").first()).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(palette).toBeHidden();
}

test("la búsqueda global abre productos y pedidos según el rol", async ({ page }) => {
  await open(page);
  await searchAll(page, "Brocha 3");
  await expect(page.getByRole("heading", { name: "Productos", level: 2 })).toBeVisible();
  const edit = page.getByRole("dialog", { name: 'Editar "Brocha 3" cerda natural"' });
  await expect(edit.getByLabel("SKU")).toHaveValue("PIN-BR03");
  await edit.getByRole("button", { name: "Cancelar" }).click();

  await searchAll(page, "Altavista");
  await expect(page.getByRole("heading", { name: "Pedidos", level: 2 })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Pedido P-1039" })).toContainText("Edificio Altavista P.H.");
  await page.getByRole("dialog", { name: "Pedido P-1039" }).getByRole("button", { name: "Cerrar" }).click();

  await useAs(page, "Marta Ospina");
  await searchAll(page, "Cemento gris");
  await expect(page.getByRole("heading", { name: "Productos", level: 2 })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("searchbox", { name: "Buscar productos" })).toHaveValue("CON-CE50");
  const rows = page.getByRole("table", { name: "Productos" }).getByRole("row");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toContainText("Cemento gris uso general 50 kg");
});
