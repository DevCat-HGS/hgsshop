import { useMemo } from "react";
import { uid, usePersistentState } from "@/demos/kit/storage";
import {
  can,
  createSeed,
  denyReason,
  MOVE_PERMISSION,
  ROLE_LABELS,
  SLUG,
  type Movement,
  type MovementType,
  type Order,
  type OrderLine,
  type Product,
  type Role,
  type Seed,
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

/**
 * Estado completo de la demo y sus acciones. Todo vive en un solo objeto persistido para que un despacho
 * (pedido + stock + movimientos) se guarde de forma atómica. Las acciones vuelven a validar permisos y reglas,
 * aunque la interfaz ya oculte lo que no se puede hacer.
 */
export function useStockFlow() {
  const [data, setData] = usePersistentState<Seed>(SLUG, "datos.v1", createSeed);
  const [currentUserId, setCurrentUserId] = usePersistentState<string>(SLUG, "usuario.v1", () => "u-ana");

  const { users, products, movements, orders } = data;
  const currentUser: User = users.find((u) => u.id === currentUserId) ?? users[0];
  const role = currentUser.role;

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  function validateProduct(draft: ProductDraft, id?: string): Result {
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
    return null;
  }

  function saveProduct(draft: ProductDraft, id?: string): Result {
    if (!can(role, "product.edit")) return denyReason(role, "product.edit");
    const error = validateProduct(draft, id);
    if (error) return error;
    const fields = {
      name: draft.name.trim(),
      sku: draft.sku.trim().toUpperCase(),
      category: draft.category,
      unit: draft.unit,
      cost: Math.round(draft.cost),
      price: Math.round(draft.price),
      min: draft.min,
    };
    if (id) {
      setData((d) => ({
        ...d,
        products: d.products.map((p) => (p.id === id ? { ...p, ...fields } : p)),
      }));
      return null;
    }
    const now = Date.now();
    const product: Product = {
      id: uid("p"),
      ...fields,
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
    setData((d) => ({
      ...d,
      products: [...d.products, product],
      movements: [...initial, ...d.movements],
    }));
    return null;
  }

  /** Productos con historial o en pedidos se archivan; los demás se borran del todo. */
  function hasHistory(productId: string) {
    return movements.some((m) => m.productId === productId) || orders.some((o) => o.lines.some((l) => l.productId === productId));
  }

  function removeProduct(id: string): Result {
    if (!can(role, "product.delete")) return denyReason(role, "product.delete");
    if (hasHistory(id)) {
      if (orders.some((o) => o.status === "pending" && o.lines.some((l) => l.productId === id)))
        return "Está en un pedido pendiente: despacha o cancela el pedido antes de archivarlo.";
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
      orders: d.orders.map((o) => (o.id === id ? { ...o, status: "dispatched", closedAt: now } : o)),
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
    currentUser,
    role,
    can: (permission: Parameters<typeof can>[1]) => can(role, permission),
    productById,
    userById,
    setCurrentUserId,
    hasHistory,
    validateProduct,
    saveProduct,
    removeProduct,
    restoreProduct,
    registerMovement,
    saveOrder,
    dispatchOrder,
    cancelOrder,
    saveUser,
  };
}

export type StockFlow = ReturnType<typeof useStockFlow>;
