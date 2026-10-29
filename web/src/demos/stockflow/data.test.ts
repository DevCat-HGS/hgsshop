import { describe, expect, it } from "vitest";
import { DAY_MS } from "@/demos/kit/format";
import { pendingByProduct, purchaseSuggestion, weightedCost, type Movement, type Product, type PurchaseOrder, type Supplier } from "./data";

const NOW = Date.UTC(2026, 9, 29, 15);

const product = (over: Partial<Product> = {}): Product => ({
  id: "p-1",
  name: "Tornillo",
  sku: "TOR-1",
  category: "Tornillería",
  unit: "caja",
  cost: 1000,
  price: 1500,
  min: 10,
  stock: 5,
  supplierId: "s-1",
  archived: false,
  createdAt: 0,
  ...over,
});

const out = (quantity: number, daysAgo: number, productId = "p-1"): Movement => ({
  id: `m-${daysAgo}-${quantity}`,
  productId,
  type: "out",
  quantity,
  delta: -quantity,
  balance: 0,
  note: "",
  userId: "u",
  at: NOW - daysAgo * DAY_MS,
});

const supplier: Supplier = { id: "s-1", name: "Proveedor", nit: "", contact: "", phone: "", email: "", leadDays: 5, createdAt: 0 };

const po = (status: PurchaseOrder["status"], quantity: number, received: number): PurchaseOrder => ({
  id: `po-${status}`,
  number: "OC-0001",
  supplierId: "s-1",
  status,
  lines: [{ productId: "p-1", quantity, cost: 1000, received }],
  note: "",
  createdAt: 0,
  createdBy: "u",
  receipts: [],
});

describe("weightedCost", () => {
  it("promedia el costo actual con el de la entrada, ponderado por unidades", () => {
    expect(weightedCost(9, 28000, 3, 31000)).toBe(28750);
    expect(weightedCost(12, 28750, 7, 31000)).toBe(29579);
  });

  it("sin stock (o con stock negativo) toma el costo de la entrada", () => {
    expect(weightedCost(0, 5000, 4, 6000)).toBe(6000);
    expect(weightedCost(-2, 5000, 4, 6000)).toBe(6000);
  });
});

describe("pendingByProduct", () => {
  it("cuenta solo el saldo de las órdenes abiertas", () => {
    const pending = pendingByProduct([po("sent", 10, 0), po("partial", 8, 5), po("received", 4, 4), po("cancelled", 50, 0)]);
    expect(pending.get("p-1")).toBe(13);
  });
});

describe("purchaseSuggestion", () => {
  it("usa la rotación de 30 días, el plazo del proveedor, la cobertura y el mínimo", () => {
    // 60 unidades en 30 días = 2 por día; (5 de plazo + 10 de cobertura) × 2 + 10 de mínimo − 5 en stock = 35.
    const [row] = purchaseSuggestion([product()], [out(30, 3), out(30, 20), out(99, 31)], [], [supplier], 10, NOW);
    expect(row.daily).toBe(2);
    expect(row.leadDays).toBe(5);
    expect(row.quantity).toBe(35);
  });

  it("descuenta lo ya pedido y omite lo que no hace falta comprar o está archivado", () => {
    const rows = purchaseSuggestion(
      [product(), product({ id: "p-2", sku: "TOR-2", stock: 50 }), product({ id: "p-3", sku: "TOR-3", archived: true, stock: 0 })],
      [out(30, 3)],
      [po("sent", 10, 0)],
      [supplier],
      10,
      NOW,
    );
    // 1 por día × 15 + 10 − 5 − 10 pedidas = 10.
    expect(rows.map((r) => [r.product.id, r.quantity, r.onOrder])).toEqual([["p-1", 10, 10]]);
  });

  it("un producto sin proveedor no suma plazo", () => {
    const [row] = purchaseSuggestion([product({ supplierId: "" })], [], [], [supplier], 10, NOW);
    expect(row.leadDays).toBe(0);
    expect(row.quantity).toBe(5);
  });
});
