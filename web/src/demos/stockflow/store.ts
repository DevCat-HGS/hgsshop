import { useMemo } from "react";
import { uid, usePersistentState } from "@/demos/kit/storage";
import {
  can,
  createSeed,
  createSettings,
  denyReason,
  docNumber,
  MOVE_PERMISSION,
  ROLE_LABELS,
  SLUG,
  weightedCost,
  type Movement,
  type MovementType,
  type Order,
  type OrderLine,
  type Product,
  type PurchaseLine,
  type PurchaseOrder,
  type Role,
  type Seed,
  type Settings,
  type Supplier,
  type User,
} from "./data";

export interface ProductDraft {
  name: string;
  sku: string;
  category: string;
  unit: string;
  cost: number;
  price: number;
  min: number;
  /** Solo se usa al crear. */
  initialStock: number;
  supplierId: string;
}

export interface SupplierDraft {
  name: string;
  nit: string;
  contact: string;
  phone: string;
  email: string;
  leadDays: number;
}

export interface PurchaseDraft {
  supplierId: string;
  note: string;
  lines: { productId: string; quantity: number; cost: number }[];
}

export interface MovementDraft {
  productId: string;
  type: MovementType;
  quantity: number;
  note: string;
}

export interface OrderDraft {
  customer: string;
  note: string;
  lines: { productId: string; quantity: number }[];
}

/** Resultado de una acción: `null` si salió bien, o el mensaje de error para mostrar. */
export type Result = string | null;

const isCount = (n: number) => Number.isInteger(n) && n >= 0;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normName = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Estado completo de la demo y sus acciones. Todo vive en un solo objeto persistido para que un despacho
 * (pedido + stock + movimientos) se guarde de forma atómica. Las acciones vuelven a validar permisos y reglas,
 * aunque la interfaz ya oculte lo que no se puede hacer.
 */
export function useStockFlow() {
  const [data, setData] = usePersistentState<Seed>(SLUG, "datos.v2", createSeed);
  const [settings, setSettings] = usePersistentState<Settings>(SLUG, "ajustes.v1", createSettings);
  const [currentUserId, setCurrentUserId] = usePersistentState<string>(SLUG, "usuario.v1", () => "u-ana");

  const { users, products, movements, orders, suppliers, purchases } = data;
  const currentUser: User = users.find((u) => u.id === currentUserId) ?? users[0];
  const role = currentUser.role;

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const supplierById = useMemo(() => new Map(suppliers.map((s) => [s.id, s])), [suppliers]);

  function validateProduct(draft: ProductDraft, id?: string): Result {
    return checkProduct(draft, products, suppliers, id);
  }

  function newProduct(draft: ProductDraft, now: number): { product: Product; movements: Movement[] } {
    const product: Product = {
      id: uid("p"),
      ...productFields(draft),
      stock: draft.initialStock,
      archived: false,
      createdAt: now,
    };
    const initial: Movement[] =
      draft.initialStock > 0
        ? [
            {
              id: uid("m"),
              productId: product.id,
              type: "in",
              quantity: draft.initialStock,
              delta: draft.initialStock,
              balance: draft.initialStock,
              note: "Stock inicial",
              userId: currentUser.id,
              at: now,
            },
          ]
        : [];
    return { product, movements: initial };
  }

  /** Crea varios productos ya validados (importación) en un solo cambio. */
  function importProducts(drafts: ProductDraft[]): Result {
    if (!can(role, "product.edit")) return denyReason(role, "product.edit");
    const now = Date.now();
    const created = drafts.map((d) => newProduct(d, now));
    setData((d) => ({
      ...d,
      products: [...d.products, ...created.map((c) => c.product)],
      movements: [...created.flatMap((c) => c.movements), ...d.movements],
    }));
    return null;
  }

  function saveProduct(draft: ProductDraft, id?: string): Result {
    if (!can(role, "product.edit")) return denyReason(role, "product.edit");
    const error = validateProduct(draft, id);
    if (error) return error;
    const fields = productFields(draft);
    if (id) {
      setData((d) => ({
        ...d,
        products: d.products.map((p) => (p.id === id ? { ...p, ...fields } : p)),
      }));
      return null;
    }
    const { product, movements: initial } = newProduct(draft, Date.now());
    setData((d) => ({
      ...d,
      products: [...d.products, product],
      movements: [...initial, ...d.movements],
    }));
    return null;
  }

  /** Productos con historial o en pedidos se archivan; los demás se borran del todo. */
  function hasHistory(productId: string) {
    return (
      movements.some((m) => m.productId === productId) ||
      orders.some((o) => o.lines.some((l) => l.productId === productId)) ||
      purchases.some((po) => po.lines.some((l) => l.productId === productId))
    );
  }

  function removeProduct(id: string): Result {
    if (!can(role, "product.delete")) return denyReason(role, "product.delete");
    if (hasHistory(id)) {
      if (orders.some((o) => o.status === "pending" && o.lines.some((l) => l.productId === id)))
        return "Está en un pedido pendiente: despacha o cancela el pedido antes de archivarlo.";
      const open = purchases.find((po) => (po.status === "draft" || po.status === "sent" || po.status === "partial") && po.lines.some((l) => l.productId === id));
      if (open) return `Está en la orden de compra ${open.number}, que sigue abierta: recíbela o cancélala antes de archivarlo.`;
      setData((d) => ({
        ...d,
        products: d.products.map((p) => (p.id === id ? { ...p, archived: true } : p)),
      }));
    } else {
      setData((d) => ({
        ...d,
        products: d.products.filter((p) => p.id !== id),
      }));
    }
    return null;
  }

  function restoreProduct(id: string): Result {
    if (!can(role, "product.delete")) return denyReason(role, "product.delete");
    setData((d) => ({
      ...d,
      products: d.products.map((p) => (p.id === id ? { ...p, archived: false } : p)),
    }));
    return null;
  }

  function registerMovement(draft: MovementDraft): Result {
    const permission = MOVE_PERMISSION[draft.type];
    if (!can(role, permission)) return denyReason(role, permission);
    const product = productById.get(draft.productId);
    if (!product) return "Elige un producto.";
    if (product.archived) return "Ese producto está archivado.";
    const qty = draft.quantity;
    if (draft.type === "adjust") {
      if (!isCount(qty)) return "Escribe la cantidad contada: un número entero, 0 o mayor.";
    } else if (!Number.isInteger(qty) || qty <= 0) {
      return "La cantidad debe ser un número entero mayor que cero.";
    }
    if (draft.type === "out" && qty > product.stock) return `No alcanza el stock: hay ${product.stock} ${product.unit} de "${product.name}".`;
    if (draft.type === "adjust" && qty !== product.stock && !draft.note.trim()) return "Explica el motivo del ajuste en la nota.";

    const delta = draft.type === "in" ? qty : draft.type === "out" ? -qty : qty - product.stock;
    const balance = product.stock + delta;
    const movement: Movement = {
      id: uid("m"),
      productId: product.id,
      type: draft.type,
      quantity: qty,
      delta,
      balance,
      note: draft.note.trim(),
      userId: currentUser.id,
      at: Date.now(),
    };
    setData((d) => ({
      ...d,
      products: d.products.map((p) => (p.id === product.id ? { ...p, stock: balance } : p)),
      movements: [movement, ...d.movements],
    }));
    return null;
  }

  function validateOrder(draft: OrderDraft): Result {
    if (!draft.customer.trim()) return "Escribe el nombre del cliente.";
    if (draft.lines.length === 0) return "Agrega al menos un producto al pedido.";
    const seen = new Set<string>();
    for (const line of draft.lines) {
      const product = productById.get(line.productId);
      if (!product) return "Elige el producto de cada línea.";
      if (product.archived) return `"${product.name}" está archivado.`;
      if (seen.has(line.productId)) return `"${product.name}" está repetido: suma las cantidades en una sola línea.`;
      seen.add(line.productId);
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) return `La cantidad de "${product.name}" debe ser un entero mayor que cero.`;
    }
    return null;
  }

  function saveOrder(draft: OrderDraft, id?: string): Result {
    if (!can(role, "order.manage")) return denyReason(role, "order.manage");
    const error = validateOrder(draft);
    if (error) return error;
    const lines: OrderLine[] = draft.lines.map((l) => {
      // Al editar se conserva el precio pactado de las líneas que ya estaban.
      const previous = id ? orders.find((o) => o.id === id)?.lines.find((x) => x.productId === l.productId) : undefined;
      return {
        productId: l.productId,
        quantity: l.quantity,
        price: previous?.price ?? productById.get(l.productId)!.price,
      };
    });
    if (id) {
      const order = orders.find((o) => o.id === id);
      if (order?.status !== "pending") return "Solo se pueden editar pedidos pendientes.";
      setData((d) => ({
        ...d,
        orders: d.orders.map((o) =>
          o.id === id
            ? {
                ...o,
                customer: draft.customer.trim(),
                note: draft.note.trim(),
                lines,
              }
            : o,
        ),
      }));
      return null;
    }
    const last = Math.max(1000, ...orders.map((o) => Number(o.number.replace(/\D/g, "")) || 0));
    const order: Order = {
      id: uid("o"),
      number: `P-${last + 1}`,
      customer: draft.customer.trim(),
      note: draft.note.trim(),
      lines,
      status: "pending",
      createdAt: Date.now(),
      createdBy: currentUser.id,
    };
    setData((d) => ({ ...d, orders: [order, ...d.orders] }));
    return null;
  }

  /** Despacha un pedido: descuenta stock con un movimiento de salida por línea, o falla sin tocar nada. */
  function dispatchOrder(id: string): Result {
    if (!can(role, "order.manage")) return denyReason(role, "order.manage");
    const order = orders.find((o) => o.id === id);
    if (!order || order.status !== "pending") return "Este pedido ya no está pendiente.";
    const missing = order.lines
      .map((l) => ({ line: l, product: productById.get(l.productId) }))
      .filter(({ line, product }) => !product || product.archived || product.stock < line.quantity)
      .map(({ line, product }) =>
        product ? `${product.name}: pide ${line.quantity}, hay ${product.archived ? "0 (archivado)" : product.stock}` : "un producto que ya no existe",
      );
    if (missing.length) return `No alcanza el stock para despachar. ${missing.join("; ")}.`;

    const now = Date.now();
    const remission = docNumber("REM", data.seq.remission + 1);
    const stock = new Map(order.lines.map((l) => [l.productId, productById.get(l.productId)!.stock - l.quantity]));
    const newMovements: Movement[] = order.lines.map((l) => ({
      id: uid("m"),
      productId: l.productId,
      type: "out",
      quantity: l.quantity,
      delta: -l.quantity,
      balance: stock.get(l.productId)!,
      note: `Pedido ${order.number}`,
      userId: currentUser.id,
      at: now,
      orderId: order.id,
    }));
    setData((d) => ({
      ...d,
      products: d.products.map((p) => (stock.has(p.id) ? { ...p, stock: stock.get(p.id)! } : p)),
      movements: [...newMovements, ...d.movements],
      orders: d.orders.map((o) => (o.id === id ? { ...o, status: "dispatched", closedAt: now, remission } : o)),
      seq: { ...d.seq, remission: d.seq.remission + 1 },
    }));
    return null;
  }

  function cancelOrder(id: string): Result {
    if (!can(role, "order.manage")) return denyReason(role, "order.manage");
    const order = orders.find((o) => o.id === id);
    if (!order || order.status !== "pending") return "Este pedido ya no está pendiente.";
    setData((d) => ({
      ...d,
      orders: d.orders.map((o) => (o.id === id ? { ...o, status: "cancelled", closedAt: Date.now() } : o)),
    }));
    return null;
  }

  /* Proveedores */

  function validateSupplier(draft: SupplierDraft, id?: string): Result {
    const name = draft.name.trim().replace(/\s+/g, " ");
    if (!name) return "Escribe el nombre del proveedor.";
    const clash = suppliers.find((s) => s.id !== id && normName(s.name) === normName(name));
    if (clash) return `Ya existe un proveedor llamado "${clash.name}".`;
    const nit = draft.nit.trim();
    if (nit && !/^[0-9.\- ]{5,20}$/.test(nit)) return "El NIT solo admite números, puntos y guion (p. ej. 900.123.456-7).";
    const nitKey = nit.replace(/\D/g, "");
    const nitClash = nitKey && suppliers.find((s) => s.id !== id && s.nit.replace(/\D/g, "") === nitKey);
    if (nitClash) return `El NIT ${nit} ya es de "${nitClash.name}".`;
    const email = draft.email.trim();
    if (email && !EMAIL.test(email)) return "El correo no es válido.";
    const phone = draft.phone.trim();
    if (phone && !/^[0-9+() -]{7,20}$/.test(phone)) return "El teléfono solo admite números, espacios, +, paréntesis y guiones.";
    if (!Number.isInteger(draft.leadDays) || draft.leadDays < 0 || draft.leadDays > 180) return "El plazo de entrega debe ser un número entero de días, de 0 a 180.";
    return null;
  }

  function saveSupplier(draft: SupplierDraft, id?: string): Result {
    if (!can(role, "supplier.manage")) return denyReason(role, "supplier.manage");
    const error = validateSupplier(draft, id);
    if (error) return error;
    const fields = {
      name: draft.name.trim().replace(/\s+/g, " "),
      nit: draft.nit.trim(),
      contact: draft.contact.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim().toLowerCase(),
      leadDays: draft.leadDays,
    };
    if (id) {
      setData((d) => ({ ...d, suppliers: d.suppliers.map((s) => (s.id === id ? { ...s, ...fields } : s)) }));
      return null;
    }
    const supplier: Supplier = { id: uid("s"), ...fields, createdAt: Date.now() };
    setData((d) => ({ ...d, suppliers: [...d.suppliers, supplier] }));
    return null;
  }

  /** Un proveedor con órdenes de compra no se borra (su historial las necesita). Sus productos quedan sin proveedor habitual. */
  function removeSupplier(id: string): Result {
    if (!can(role, "supplier.manage")) return denyReason(role, "supplier.manage");
    const count = purchases.filter((po) => po.supplierId === id).length;
    if (count) return `Tiene ${count} orden${count === 1 ? "" : "es"} de compra en el historial: no se puede borrar.`;
    setData((d) => ({
      ...d,
      suppliers: d.suppliers.filter((s) => s.id !== id),
      products: d.products.map((p) => (p.supplierId === id ? { ...p, supplierId: "" } : p)),
    }));
    return null;
  }

  /* Órdenes de compra */

  function validatePurchase(draft: PurchaseDraft): Result {
    const supplier = supplierById.get(draft.supplierId);
    if (!supplier) return "Elige el proveedor.";
    if (draft.lines.length === 0) return "Agrega al menos un producto a la orden.";
    const seen = new Set<string>();
    for (const line of draft.lines) {
      const product = productById.get(line.productId);
      if (!product) return "Elige el producto de cada línea.";
      if (product.archived) return `"${product.name}" está archivado.`;
      if (seen.has(line.productId)) return `"${product.name}" está repetido: suma las cantidades en una sola línea.`;
      seen.add(line.productId);
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) return `La cantidad de "${product.name}" debe ser un entero mayor que cero.`;
      if (!Number.isFinite(line.cost) || line.cost <= 0) return `El costo unitario de "${product.name}" debe ser mayor que cero.`;
    }
    return null;
  }

  /** Crea una orden en borrador o edita un borrador. Devuelve el error, o el id de la orden en `id`. */
  function savePurchase(draft: PurchaseDraft, id?: string): { error: Result; id?: string } {
    if (!can(role, "purchase.manage")) return { error: denyReason(role, "purchase.manage") };
    const error = validatePurchase(draft);
    if (error) return { error };
    const lines: PurchaseLine[] = draft.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, cost: Math.round(l.cost), received: 0 }));
    if (id) {
      const po = purchases.find((p) => p.id === id);
      if (po?.status !== "draft") return { error: "Solo se pueden editar órdenes en borrador." };
      setData((d) => ({
        ...d,
        purchases: d.purchases.map((p) => (p.id === id ? { ...p, supplierId: draft.supplierId, note: draft.note.trim(), lines } : p)),
      }));
      return { error: null, id };
    }
    const next = data.seq.purchase + 1;
    const po: PurchaseOrder = {
      id: uid("po"),
      number: docNumber("OC", next),
      supplierId: draft.supplierId,
      status: "draft",
      lines,
      note: draft.note.trim(),
      createdAt: Date.now(),
      createdBy: currentUser.id,
      receipts: [],
    };
    setData((d) => ({ ...d, purchases: [po, ...d.purchases], seq: { ...d.seq, purchase: d.seq.purchase + 1 } }));
    return { error: null, id: po.id };
  }

  function sendPurchase(id: string): Result {
    if (!can(role, "purchase.manage")) return denyReason(role, "purchase.manage");
    const po = purchases.find((p) => p.id === id);
    if (po?.status !== "draft") return "Solo se envían órdenes en borrador.";
    const inactive = po.lines.find((l) => !productById.get(l.productId) || productById.get(l.productId)!.archived);
    if (inactive) return `"${productById.get(inactive.productId)?.name ?? "Un producto"}" ya no está activo: quítalo de la orden antes de enviarla.`;
    setData((d) => ({ ...d, purchases: d.purchases.map((p) => (p.id === id ? { ...p, status: "sent", sentAt: Date.now() } : p)) }));
    return null;
  }

  function cancelPurchase(id: string): Result {
    if (!can(role, "purchase.manage")) return denyReason(role, "purchase.manage");
    const po = purchases.find((p) => p.id === id);
    if (!po || !(po.status === "draft" || po.status === "sent" || po.status === "partial")) return "Esta orden ya está cerrada.";
    setData((d) => ({ ...d, purchases: d.purchases.map((p) => (p.id === id ? { ...p, status: "cancelled", closedAt: Date.now() } : p)) }));
    return null;
  }

  /**
   * Recibe mercancía de una orden enviada: una entrada por línea con cantidad, actualiza el stock y el costo promedio
   * ponderado, y deja la orden recibida (todo llegó) o recibida parcial. Todo en un solo cambio, o nada.
   */
  function receivePurchase(id: string, quantities: Record<string, number>, note: string): Result {
    if (!can(role, "purchase.receive")) return denyReason(role, "purchase.receive");
    const po = purchases.find((p) => p.id === id);
    if (!po || !(po.status === "sent" || po.status === "partial")) return "Solo se recibe mercancía de órdenes enviadas.";
    let total = 0;
    for (const line of po.lines) {
      const qty = quantities[line.productId] ?? 0;
      const product = productById.get(line.productId);
      const name = product?.name ?? "un producto";
      const remaining = line.quantity - line.received;
      if (!Number.isInteger(qty) || qty < 0) return `La cantidad recibida de "${name}" debe ser un entero, 0 o mayor.`;
      if (qty > remaining) return `De "${name}" faltan ${remaining}: no se puede recibir ${qty}.`;
      if (qty > 0 && (!product || product.archived)) return `"${name}" está archivado: restáuralo para recibirlo.`;
      total += qty;
    }
    if (total === 0) return "Escribe cuántas unidades llegaron de al menos un producto.";

    const now = Date.now();
    const supplier = supplierById.get(po.supplierId);
    const clean = note.trim();
    const text = `${po.number} · ${supplier?.name ?? "Proveedor"}${clean ? `, ${clean}` : ""}`;
    const updates = new Map<string, { stock: number; cost: number }>();
    const newMovements: Movement[] = [];
    for (const line of po.lines) {
      const qty = quantities[line.productId] ?? 0;
      if (qty === 0) continue;
      const product = productById.get(line.productId)!;
      const stock = product.stock + qty;
      updates.set(product.id, { stock, cost: weightedCost(product.stock, product.cost, qty, line.cost) });
      newMovements.push({
        id: uid("m"),
        productId: product.id,
        type: "in",
        quantity: qty,
        delta: qty,
        balance: stock,
        note: text,
        userId: currentUser.id,
        at: now,
        purchaseId: po.id,
        unitCost: line.cost,
      });
    }
    const lines = po.lines.map((l) => ({ ...l, received: l.received + (quantities[l.productId] ?? 0) }));
    const complete = lines.every((l) => l.received >= l.quantity);
    const receipt = {
      at: now,
      userId: currentUser.id,
      note: clean,
      lines: po.lines.filter((l) => (quantities[l.productId] ?? 0) > 0).map((l) => ({ productId: l.productId, quantity: quantities[l.productId] })),
    };
    setData((d) => ({
      ...d,
      products: d.products.map((p) => (updates.has(p.id) ? { ...p, ...updates.get(p.id)! } : p)),
      movements: [...newMovements, ...d.movements],
      purchases: d.purchases.map((p) =>
        p.id === id ? { ...p, lines, status: complete ? "received" : "partial", closedAt: complete ? now : undefined, receipts: [...p.receipts, receipt] } : p,
      ),
    }));
    return null;
  }

  /* Ajustes */

  function saveSettings(next: Settings): Result {
    if (!can(role, "settings.manage")) return denyReason(role, "settings.manage");
    if (!next.name.trim()) return "Escribe el nombre del negocio.";
    if (next.nit.trim() && !/^[0-9.\- ]{5,20}$/.test(next.nit.trim())) return "El NIT solo admite números, puntos y guion (p. ej. 900.123.456-7).";
    if (next.phone.trim() && !/^[0-9+() -]{7,20}$/.test(next.phone.trim())) return "El teléfono solo admite números, espacios, +, paréntesis y guiones.";
    if (!Number.isInteger(next.coverageDays) || next.coverageDays < 0 || next.coverageDays > 120) return "Los días de cobertura deben ser un número entero de 0 a 120.";
    setSettings({
      name: next.name.trim(),
      nit: next.nit.trim(),
      address: next.address.trim(),
      city: next.city.trim(),
      phone: next.phone.trim(),
      coverageDays: next.coverageDays,
    });
    return null;
  }

  function saveUser(name: string, userRole: Role, id?: string): Result {
    if (!can(role, "user.manage")) return denyReason(role, "user.manage");
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean) return "Escribe el nombre de la persona.";
    if (users.some((u) => u.id !== id && u.name.toLowerCase() === clean.toLowerCase())) return `Ya existe un usuario llamado ${clean}.`;
    if (id) {
      const target = users.find((u) => u.id === id);
      const admins = users.filter((u) => u.role === "admin");
      if (target?.role === "admin" && userRole !== "admin" && admins.length === 1) return `Debe quedar al menos una persona con rol ${ROLE_LABELS.admin}.`;
      setData((d) => ({
        ...d,
        users: d.users.map((u) => (u.id === id ? { ...u, name: clean, role: userRole } : u)),
      }));
      return null;
    }
    setData((d) => ({
      ...d,
      users: [...d.users, { id: uid("u"), name: clean, role: userRole }],
    }));
    return null;
  }

  return {
    users,
    products,
    movements,
    orders,
    suppliers,
    purchases,
    settings,
    currentUser,
    role,
    can: (permission: Parameters<typeof can>[1]) => can(role, permission),
    productById,
    userById,
    supplierById,
    setCurrentUserId,
    hasHistory,
    validateProduct,
    saveProduct,
    importProducts,
    removeProduct,
    restoreProduct,
    registerMovement,
    saveOrder,
    dispatchOrder,
    cancelOrder,
    validateSupplier,
    saveSupplier,
    removeSupplier,
    savePurchase,
    sendPurchase,
    cancelPurchase,
    receivePurchase,
    saveSettings,
    saveUser,
  };
}

export type StockFlow = ReturnType<typeof useStockFlow>;

/** Reglas de un producto (formulario e importación). */
export function checkProduct(draft: ProductDraft, products: Product[], suppliers: Supplier[], id?: string): Result {
  if (!draft.name.trim()) return "Escribe el nombre del producto.";
  const sku = draft.sku.trim().toUpperCase();
  if (!sku) return "Escribe el SKU.";
  if (!/^[A-Z0-9-]{3,20}$/.test(sku)) return "El SKU solo admite letras, números y guiones (3 a 20 caracteres).";
  const clash = products.find((p) => p.id !== id && p.sku.toUpperCase() === sku);
  if (clash) return `El SKU ${sku} ya lo usa "${clash.name}".`;
  if (!draft.category) return "Elige una categoría.";
  if (!(draft.cost > 0)) return "El costo debe ser mayor que cero.";
  if (!(draft.price > 0)) return "El precio de venta debe ser mayor que cero.";
  if (draft.price < draft.cost) return "El precio de venta no puede ser menor que el costo.";
  if (!isCount(draft.min)) return "El stock mínimo debe ser un número entero, 0 o mayor.";
  if (!id && !isCount(draft.initialStock)) return "El stock inicial debe ser un número entero, 0 o mayor.";
  if (draft.supplierId && !suppliers.some((s) => s.id === draft.supplierId)) return "Ese proveedor ya no existe.";
  return null;
}

/** Compara nombres sin mayúsculas, tildes ni espacios repetidos. */
export function sameName(a: string, b: string) {
  return normName(a) === normName(b);
}

function productFields(draft: ProductDraft) {
  return {
    name: draft.name.trim(),
    sku: draft.sku.trim().toUpperCase(),
    category: draft.category,
    unit: draft.unit,
    cost: Math.round(draft.cost),
    price: Math.round(draft.price),
    min: draft.min,
    supplierId: draft.supplierId,
  };
}
