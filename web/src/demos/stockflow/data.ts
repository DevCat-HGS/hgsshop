import { DAY_MS, daysFromToday } from "@/demos/kit/format";
import { isBlankStart } from "@/demos/kit/storage";
import type { Tone } from "@/demos/kit/ui";

/** Tipos, permisos y datos de ejemplo de StockFlow (Ferretería El Tornillo, Medellín). */

export const SLUG = "stockflow";

export type Role = "admin" | "warehouse" | "cashier";
export type MovementType = "in" | "out" | "adjust";
export type OrderStatus = "pending" | "dispatched" | "cancelled";
export type StockStatus = "ok" | "low" | "out";
export type PurchaseStatus = "draft" | "sent" | "partial" | "received" | "cancelled";

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  cost: number;
  price: number;
  min: number;
  stock: number;
  /** Proveedor habitual ("" = sin proveedor). Se usa para agrupar la sugerencia de compra. */
  supplierId: string;
  /** Archivado: conserva su historial pero ya no recibe movimientos ni pedidos. */
  archived: boolean;
  createdAt: number;
}

export interface Movement {
  id: string;
  productId: string;
  type: MovementType;
  /** Entrada y salida: unidades movidas. Ajuste: cantidad contada. */
  quantity: number;
  /** Cambio real en el stock (+/-). */
  delta: number;
  /** Stock resultante después del movimiento. */
  balance: number;
  note: string;
  userId: string;
  at: number;
  orderId?: string;
  /** Entrada generada al recibir una orden de compra. */
  purchaseId?: string;
  /** Costo unitario de la entrada (solo en recepciones de compra). */
  unitCost?: number;
}

export interface OrderLine {
  productId: string;
  quantity: number;
  /** Precio unitario al momento de crear el pedido. */
  price: number;
}

export interface Order {
  id: string;
  number: string;
  customer: string;
  note: string;
  lines: OrderLine[];
  status: OrderStatus;
  createdAt: number;
  createdBy: string;
  closedAt?: number;
  /** Remisión de despacho (REM-0001), asignada al despachar. */
  remission?: string;
}

export interface Supplier {
  id: string;
  name: string;
  nit: string;
  contact: string;
  phone: string;
  email: string;
  /** Plazo de entrega en días calendario desde que se envía la orden. */
  leadDays: number;
  createdAt: number;
}

export interface PurchaseLine {
  productId: string;
  quantity: number;
  /** Costo unitario pactado con el proveedor (COP). */
  cost: number;
  /** Unidades ya recibidas. */
  received: number;
}

export interface Receipt {
  at: number;
  userId: string;
  note: string;
  lines: { productId: string; quantity: number }[];
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  status: PurchaseStatus;
  lines: PurchaseLine[];
  note: string;
  createdAt: number;
  createdBy: string;
  sentAt?: number;
  closedAt?: number;
  receipts: Receipt[];
}

/** Datos del negocio que salen en los documentos, y parámetros de la sugerencia de compra. */
export interface Settings {
  name: string;
  nit: string;
  address: string;
  city: string;
  phone: string;
  /** Días de inventario que debe cubrir una compra, además del plazo del proveedor. */
  coverageDays: number;
}

export const CATEGORIES = ["Tornillería", "Pinturas", "Eléctricos", "Herramientas", "Plomería", "Construcción", "Cerrajería"];
export const UNITS = ["unidad", "caja", "galón", "bulto", "rollo", "pliego", "metro", "kilo"];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administración",
  warehouse: "Bodega",
  cashier: "Caja",
};
export const MOVEMENT_LABELS: Record<MovementType, string> = {
  in: "Entrada",
  out: "Salida",
  adjust: "Ajuste",
};
export const MOVEMENT_TONES: Record<MovementType, Tone> = {
  in: "success",
  out: "brand",
  adjust: "neutral",
};
export const ORDER_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  dispatched: "Despachado",
  cancelled: "Cancelado",
};
export const ORDER_TONES: Record<OrderStatus, Tone> = {
  pending: "warning",
  dispatched: "success",
  cancelled: "neutral",
};
export const PURCHASE_LABELS: Record<PurchaseStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  partial: "Recibida parcial",
  received: "Recibida",
  cancelled: "Cancelada",
};
export const PURCHASE_TONES: Record<PurchaseStatus, Tone> = {
  draft: "neutral",
  sent: "brand",
  partial: "warning",
  received: "success",
  cancelled: "neutral",
};
/** Órdenes que todavía esperan mercancía: lo pendiente cuenta como "ya pedido" en la sugerencia. */
export const OPEN_PURCHASE: PurchaseStatus[] = ["draft", "sent", "partial"];

export const STOCK_LABELS: Record<StockStatus, string> = {
  ok: "OK",
  low: "Bajo mínimo",
  out: "Agotado",
};
export const STOCK_TONES: Record<StockStatus, Tone> = {
  ok: "success",
  low: "warning",
  out: "danger",
};

export function stockStatus(p: Pick<Product, "stock" | "min">): StockStatus {
  if (p.stock <= 0) return "out";
  if (p.stock < p.min) return "low";
  return "ok";
}

/* Permisos por rol. Se consultan en toda la interfaz y también en las acciones del almacén de datos. */

export type Permission =
  | "product.edit"
  | "product.delete"
  | "move.in"
  | "move.out"
  | "move.adjust"
  | "order.manage"
  | "purchase.view"
  | "purchase.manage"
  | "purchase.receive"
  | "supplier.manage"
  | "settings.manage"
  | "user.manage";

const PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "product.edit",
    "product.delete",
    "move.in",
    "move.out",
    "move.adjust",
    "order.manage",
    "purchase.view",
    "purchase.manage",
    "purchase.receive",
    "supplier.manage",
    "settings.manage",
    "user.manage",
  ],
  warehouse: ["product.edit", "move.in", "move.adjust", "purchase.view", "purchase.receive"],
  cashier: ["move.out", "order.manage"],
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  "product.edit": "Crear y editar productos",
  "product.delete": "Archivar y borrar productos",
  "move.in": "Registrar entradas",
  "move.out": "Registrar salidas",
  "move.adjust": "Registrar ajustes (conteo físico)",
  "order.manage": "Crear, despachar y cancelar pedidos",
  "purchase.view": "Ver compras y proveedores",
  "purchase.manage": "Crear, enviar y cancelar órdenes de compra",
  "purchase.receive": "Recibir mercancía de órdenes de compra",
  "supplier.manage": "Crear, editar y borrar proveedores",
  "settings.manage": "Cambiar los ajustes del negocio",
  "user.manage": "Crear usuarios y cambiar roles",
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[];

export function can(role: Role, permission: Permission) {
  return PERMISSIONS[role].includes(permission);
}

/** Motivo visible cuando una acción no está permitida al rol actual. */
export function denyReason(role: Role, permission: Permission) {
  return `Tu rol (${ROLE_LABELS[role]}) no permite: ${PERMISSION_LABELS[permission].toLowerCase()}.`;
}

export const MOVE_PERMISSION: Record<MovementType, Permission> = {
  in: "move.in",
  out: "move.out",
  adjust: "move.adjust",
};

export function orderTotal(order: Pick<Order, "lines">) {
  return order.lines.reduce((sum, l) => sum + l.quantity * l.price, 0);
}

export function purchaseTotal(order: Pick<PurchaseOrder, "lines">) {
  return order.lines.reduce((sum, l) => sum + l.quantity * l.cost, 0);
}

/** Consecutivo con 4 cifras: OC-0001, REM-0012. */
export function docNumber(prefix: "OC" | "REM", n: number) {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

/** Costo promedio ponderado tras una entrada de `quantity` unidades a `unitCost`. */
export function weightedCost(stock: number, cost: number, quantity: number, unitCost: number) {
  const current = Math.max(0, stock);
  if (current + quantity <= 0) return cost;
  return Math.round((current * cost + quantity * unitCost) / (current + quantity));
}

export const DEFAULT_COVERAGE = 15;
export const CONSUMPTION_DAYS = 30;

export interface SuggestionRow {
  product: Product;
  /** Unidades que salieron en los últimos 30 días, divididas entre 30. */
  daily: number;
  leadDays: number;
  /** Unidades pendientes de llegar en órdenes abiertas. */
  onOrder: number;
  quantity: number;
}

/** Unidades pendientes por producto en órdenes abiertas (borrador, enviada o recibida parcial). */
export function pendingByProduct(purchases: PurchaseOrder[]) {
  const pending = new Map<string, number>();
  for (const po of purchases) {
    if (!OPEN_PURCHASE.includes(po.status)) continue;
    for (const l of po.lines) pending.set(l.productId, (pending.get(l.productId) ?? 0) + Math.max(0, l.quantity - l.received));
  }
  return pending;
}

/**
 * Sugerencia de compra por producto: consumo diario promedio de 30 días × (plazo del proveedor + días de cobertura)
 * + mínimo − stock actual − lo que ya está pedido, redondeado hacia arriba y nunca negativo.
 */
export function purchaseSuggestion(
  products: Product[],
  movements: Movement[],
  purchases: PurchaseOrder[],
  suppliers: Supplier[],
  coverageDays: number,
  now: number,
): SuggestionRow[] {
  const since = now - CONSUMPTION_DAYS * DAY_MS;
  const out = new Map<string, number>();
  for (const m of movements) if (m.type === "out" && m.at >= since) out.set(m.productId, (out.get(m.productId) ?? 0) + m.quantity);
  const pending = pendingByProduct(purchases);
  const leadOf = new Map(suppliers.map((s) => [s.id, s.leadDays]));
  return products
    .filter((p) => !p.archived)
    .map((product) => {
      const daily = (out.get(product.id) ?? 0) / CONSUMPTION_DAYS;
      const leadDays = leadOf.get(product.supplierId) ?? 0;
      const onOrder = pending.get(product.id) ?? 0;
      const raw = daily * (leadDays + coverageDays) + product.min - product.stock - onOrder;
      // El épsilon evita que 12.000000001 por redondeo binario se convierta en 13.
      return { product, daily, leadDays, onOrder, quantity: Math.max(0, Math.ceil(raw - 1e-9)) };
    })
    .filter((r) => r.quantity > 0);
}

/* Semilla */

export interface Seed {
  users: User[];
  products: Product[];
  movements: Movement[];
  orders: Order[];
  suppliers: Supplier[];
  purchases: PurchaseOrder[];
  /** Último consecutivo usado de cada documento. */
  seq: { purchase: number; remission: number };
}

export function createSettings(): Settings {
  if (isBlankStart(SLUG)) return { name: "Mi negocio", nit: "", address: "", city: "", phone: "", coverageDays: DEFAULT_COVERAGE };
  return {
    name: "Ferretería El Tornillo",
    nit: "900.482.317-5",
    address: "Calle 44 # 52-18, local 3",
    city: "Medellín",
    phone: "604 444 1290",
    coverageDays: DEFAULT_COVERAGE,
  };
}

type ProductSeed = [sku: string, name: string, category: string, unit: string, cost: number, price: number, min: number, initial: number];

const PRODUCTS: ProductSeed[] = [
  ["TOR-0610", 'Tornillo drywall 6×1" (caja x100)', "Tornillería", "caja", 9500, 14000, 15, 40],
  ["PIN-VB01", "Pintura vinilo blanca tipo 1 (galón)", "Pinturas", "galón", 52000, 72000, 8, 20],
  ["ELE-CA18", "Cinta aislante negra 18 m", "Eléctricos", "unidad", 2800, 4500, 10, 12],
  ["PIN-BR03", 'Brocha 3" cerda natural', "Pinturas", "unidad", 6500, 10500, 5, 10],
  ["HER-LI10", 'Llave inglesa 10"', "Herramientas", "unidad", 28000, 42000, 2, 9],
  ["CON-SI28", "Silicona transparente 280 ml", "Construcción", "unidad", 9800, 15500, 6, 24],
  ["CON-CE50", "Cemento gris uso general 50 kg", "Construcción", "bulto", 29500, 36000, 20, 60],
  ["PLO-TU12", 'Tubo PVC presión 1/2" x 6 m', "Plomería", "unidad", 14500, 21000, 15, 40],
  ["PLO-CO12", 'Codo PVC 1/2" x 90°', "Plomería", "unidad", 700, 1200, 50, 200],
  ["ELE-CB12", "Cable eléctrico #12 AWG (rollo 100 m)", "Eléctricos", "rollo", 185000, 245000, 3, 6],
  ["ELE-LED9", "Bombillo LED 9 W luz blanca", "Eléctricos", "unidad", 4200, 7500, 30, 80],
  ["HER-MA16", "Martillo de uña 16 oz", "Herramientas", "unidad", 21000, 32000, 4, 12],
  ["HER-TP65", 'Taladro percutor 1/2" 650 W', "Herramientas", "unidad", 189000, 259000, 2, 5],
  ["PIN-LA12", "Lija de agua grano 120", "Pinturas", "pliego", 1300, 2200, 40, 150],
  ["CER-CA40", "Candado de seguridad 40 mm", "Cerrajería", "unidad", 16500, 26000, 6, 15],
];

const ANA = "u-ana";
const LUIS = "u-luis";
const MARTA = "u-marta";

// [días desde hoy, hora, minuto, índice de producto, tipo, cantidad (en ajuste: lo contado), responsable, nota, pedido]
type MoveSeed = [number, number, number, number, MovementType, number, string, string, string?];

const MOVES: MoveSeed[] = [
  [-44, 9, 10, 6, "out", 12, MARTA, "Venta mostrador"],
  [-42, 10, 30, 8, "out", 40, MARTA, "Venta mostrador"],
  [-41, 15, 20, 5, "out", 4, MARTA, "Venta mostrador"],
  [-40, 11, 0, 10, "out", 18, MARTA, "Venta mostrador"],
  [-38, 9, 45, 5, "out", 2, MARTA, "Venta mostrador"],
  [-37, 8, 15, 6, "in", 40, LUIS, "Compra a Cementos del Valle, factura 8812"],
  [-35, 16, 0, 0, "out", 10, MARTA, "Venta mostrador"],
  [-33, 10, 0, 1, "out", 4, MARTA, "Venta mostrador"],
  [-31, 14, 30, 13, "out", 30, MARTA, "Venta mostrador"],
  [-29, 9, 0, 2, "out", 5, MARTA, "Venta mostrador"],
  [-28, 11, 40, 6, "out", 15, ANA, "Pedido P-1036", "o-1036"],
  [-28, 11, 40, 7, "out", 10, ANA, "Pedido P-1036", "o-1036"],
  [-26, 8, 30, 10, "in", 50, LUIS, "Compra a Distribuidora Andina"],
  [-25, 10, 15, 3, "out", 3, MARTA, "Venta mostrador"],
  [-24, 9, 0, 12, "out", 1, MARTA, "Venta mostrador"],
  [-22, 17, 10, 0, "out", 12, MARTA, "Venta mostrador"],
  [-21, 8, 0, 13, "adjust", 112, LUIS, "Conteo físico mensual"],
  [-20, 13, 0, 9, "out", 2, MARTA, "Venta mostrador"],
  [-19, 9, 30, 1, "out", 6, MARTA, "Venta mostrador"],
  [-18, 10, 0, 8, "out", 60, MARTA, "Venta mostrador"],
  [-17, 15, 45, 10, "out", 25, MARTA, "Venta mostrador"],
  [-15, 8, 20, 0, "in", 30, LUIS, "OC-0001 · Tornillos y Pernos del Norte, factura TN-5521", "po-1"],
  [-14, 11, 0, 2, "out", 4, MARTA, "Venta mostrador"],
  [-13, 9, 0, 6, "out", 20, MARTA, "Pedido P-1038", "o-1038"],
  [-13, 9, 0, 8, "out", 30, MARTA, "Pedido P-1038", "o-1038"],
  [-12, 14, 0, 3, "out", 2, MARTA, "Venta mostrador"],
  [-11, 10, 30, 7, "out", 8, MARTA, "Venta mostrador"],
  [-10, 8, 0, 1, "adjust", 9, LUIS, "Conteo físico: un galón golpeado, se da de baja"],
  [-9, 16, 20, 12, "out", 1, MARTA, "Venta mostrador"],
  [-8, 9, 15, 13, "out", 25, MARTA, "Venta mostrador"],
  [-7, 11, 0, 9, "out", 1, MARTA, "Venta mostrador"],
  [-6, 10, 0, 10, "out", 20, MARTA, "Venta mostrador"],
  [-5, 8, 30, 8, "in", 100, LUIS, "OC-0002 · Distribuidora Andina, factura DA-20931", "po-2"],
  [-5, 15, 0, 0, "out", 14, MARTA, "Venta mostrador"],
  [-4, 9, 40, 2, "out", 3, MARTA, "Venta mostrador"],
  [-3, 11, 20, 7, "out", 9, MARTA, "Pedido P-1040", "o-1040"],
  [-3, 11, 20, 8, "out", 20, MARTA, "Pedido P-1040", "o-1040"],
  [-3, 11, 20, 1, "out", 2, MARTA, "Pedido P-1040", "o-1040"],
  [-2, 10, 0, 6, "out", 18, MARTA, "Venta mostrador"],
  [-2, 14, 30, 3, "in", 6, LUIS, "Compra a Pinturas Aburrá"],
  [-1, 9, 0, 9, "out", 1, MARTA, "Venta mostrador"],
  [-1, 17, 0, 10, "out", 12, MARTA, "Venta mostrador"],
  [0, 7, 10, 6, "in", 30, LUIS, "Compra a Cementos del Valle, factura 9034"],
  [0, 7, 40, 7, "out", 6, MARTA, "Venta mostrador"],
  [0, 8, 5, 0, "out", 6, MARTA, "Venta mostrador"],
];

/** Hora de hoy sin pasar del momento actual (la demo puede abrirse de madrugada). */
function seedTime(days: number, hours: number, minutes: number, minutesAgo: number) {
  const at = daysFromToday(days, hours, minutes);
  return days === 0 ? Math.min(at, Date.now() - minutesAgo * 60_000) : at;
}

const SUPPLIERS: Supplier[] = [
  { id: "s-cementos", name: "Cementos del Valle S.A.S.", nit: "800.214.556-1", contact: "Patricia Londoño", phone: "604 322 1180", email: "pedidos@cementosdelvalle.example", leadDays: 3, createdAt: 0 },
  { id: "s-andina", name: "Distribuidora Andina", nit: "900.117.903-4", contact: "Hernán Castaño", phone: "300 555 0142", email: "ventas@distandina.example", leadDays: 5, createdAt: 0 },
  { id: "s-tornillos", name: "Tornillos y Pernos del Norte", nit: "811.045.320-7", contact: "Diana Vélez", phone: "604 511 7765", email: "diana@tornillosnorte.example", leadDays: 7, createdAt: 0 },
  { id: "s-pinturas", name: "Pinturas Aburrá", nit: "901.338.761-2", contact: "Camilo Arango", phone: "310 555 0198", email: "comercial@pinturasaburra.example", leadDays: 4, createdAt: 0 },
];

const SUPPLIER_BY_CATEGORY: Record<string, string> = {
  Tornillería: "s-tornillos",
  Cerrajería: "s-tornillos",
  Pinturas: "s-pinturas",
  Construcción: "s-cementos",
  Eléctricos: "s-andina",
  Plomería: "s-andina",
  Herramientas: "s-andina",
};

/** Empezar vacío: sin registros, con un usuario administrador para poder trabajar. */
function blankSeed(): Seed {
  return {
    users: [{ id: ANA, name: "Administrador", role: "admin" }],
    products: [],
    movements: [],
    orders: [],
    suppliers: [],
    purchases: [],
    seq: { purchase: 0, remission: 0 },
  };
}

export function createSeed(): Seed {
  if (isBlankStart(SLUG)) return blankSeed();
  const users: User[] = [
    { id: ANA, name: "Ana Gómez", role: "admin" },
    { id: LUIS, name: "Luis Herrera", role: "warehouse" },
    { id: MARTA, name: "Marta Ospina", role: "cashier" },
  ];

  const products: Product[] = PRODUCTS.map(([sku, name, category, unit, cost, price, min], i) => ({
    id: `p-${i + 1}`,
    name,
    sku,
    category,
    unit,
    cost,
    price,
    min,
    stock: 0,
    supplierId: SUPPLIER_BY_CATEGORY[category] ?? "",
    archived: false,
    createdAt: daysFromToday(-46, 9),
  }));

  const movements: Movement[] = [];
  const push = (productIndex: number, type: MovementType, quantity: number, userId: string, note: string, at: number, ref?: string) => {
    const product = products[productIndex];
    const delta = type === "in" ? quantity : type === "out" ? -Math.min(quantity, product.stock) : quantity - product.stock;
    product.stock += delta;
    movements.push({
      id: `m-${movements.length + 1}`,
      productId: product.id,
      type,
      quantity: type === "out" ? -delta : quantity,
      delta,
      balance: product.stock,
      note,
      userId,
      at,
      ...(ref?.startsWith("o-") ? { orderId: ref } : {}),
      ...(ref?.startsWith("po-") ? { purchaseId: ref, unitCost: product.cost } : {}),
    });
  };

  PRODUCTS.forEach(([, , , , , , , initial], i) => push(i, "in", initial, ANA, "Inventario inicial", daysFromToday(-45, 8, i)));
  MOVES.forEach(([days, h, m, p, type, qty, user, note, order], i) => push(p, type, qty, user, note, seedTime(days, h, m, (MOVES.length - i) * 7), order));

  const id = (i: number) => products[i].id;
  const line = (i: number, quantity: number) => ({
    productId: id(i),
    quantity,
    price: products[i].price,
  });
  const orders: Order[] = [
    {
      id: "o-1036",
      number: "P-1036",
      customer: "Constructora Los Alpes S.A.S.",
      note: "Entrega en obra, barrio Belén",
      lines: [line(6, 15), line(7, 10)],
      status: "dispatched",
      createdAt: daysFromToday(-30, 10, 5),
      createdBy: ANA,
      closedAt: daysFromToday(-28, 11, 40),
    },
    {
      id: "o-1037",
      number: "P-1037",
      customer: "Jorge Ramírez",
      note: "",
      lines: [line(12, 1), line(13, 10)],
      status: "cancelled",
      createdAt: daysFromToday(-20, 15, 30),
      createdBy: MARTA,
      closedAt: daysFromToday(-19, 9, 0),
    },
    {
      id: "o-1038",
      number: "P-1038",
      customer: "Obras Civiles Rionegro",
      note: "",
      lines: [line(6, 20), line(8, 30)],
      status: "dispatched",
      createdAt: daysFromToday(-14, 16, 0),
      createdBy: MARTA,
      closedAt: daysFromToday(-13, 9, 0),
    },
    {
      id: "o-1039",
      number: "P-1039",
      customer: "Edificio Altavista P.H.",
      note: "Para cambio de luminarias en zonas comunes",
      lines: [line(10, 24), line(2, 10)],
      status: "pending",
      createdAt: daysFromToday(-2, 11, 15),
      createdBy: MARTA,
    },
    {
      id: "o-1040",
      number: "P-1040",
      customer: "Taller Hermanos Restrepo",
      note: "",
      lines: [line(7, 9), line(8, 20), line(1, 2)],
      status: "dispatched",
      createdAt: daysFromToday(-4, 17, 20),
      createdBy: MARTA,
      closedAt: daysFromToday(-3, 11, 20),
    },
    {
      id: "o-1041",
      number: "P-1041",
      customer: "Claudia Mejía",
      note: "Recoge en tienda",
      lines: [line(1, 3), line(3, 2), line(13, 10)],
      status: "pending",
      createdAt: Date.now() - 45 * 60_000,
      createdBy: MARTA,
    },
  ];

  // Remisiones consecutivas en el orden en que se despacharon los pedidos.
  let remission = 0;
  for (const o of [...orders].sort((a, b) => (a.closedAt ?? 0) - (b.closedAt ?? 0)))
    if (o.status === "dispatched") o.remission = docNumber("REM", ++remission);

  const suppliers = SUPPLIERS.map((s, i) => ({ ...s, createdAt: daysFromToday(-60 + i, 9) }));
  const pline = (i: number, quantity: number, received = 0) => ({ productId: id(i), quantity, cost: products[i].cost, received });
  const purchases: PurchaseOrder[] = [
    {
      id: "po-1",
      number: "OC-0001",
      supplierId: "s-tornillos",
      status: "received",
      lines: [pline(0, 30, 30)],
      note: "",
      createdAt: daysFromToday(-23, 10, 0),
      createdBy: ANA,
      sentAt: daysFromToday(-23, 10, 20),
      closedAt: daysFromToday(-15, 8, 20),
      receipts: [{ at: daysFromToday(-15, 8, 20), userId: LUIS, note: "Factura TN-5521", lines: [{ productId: id(0), quantity: 30 }] }],
    },
    {
      id: "po-2",
      number: "OC-0002",
      supplierId: "s-andina",
      status: "received",
      lines: [pline(8, 100, 100)],
      note: "",
      createdAt: daysFromToday(-10, 15, 0),
      createdBy: ANA,
      sentAt: daysFromToday(-10, 15, 10),
      closedAt: daysFromToday(-5, 8, 30),
      receipts: [{ at: daysFromToday(-5, 8, 30), userId: LUIS, note: "Factura DA-20931", lines: [{ productId: id(8), quantity: 100 }] }],
    },
    {
      id: "po-3",
      number: "OC-0003",
      supplierId: "s-pinturas",
      status: "sent",
      lines: [pline(1, 10), pline(13, 100)],
      note: "Entregar en la mañana, por la puerta de bodega.",
      createdAt: daysFromToday(-2, 9, 0),
      createdBy: ANA,
      sentAt: daysFromToday(-2, 9, 30),
      receipts: [],
    },
    {
      id: "po-4",
      number: "OC-0004",
      supplierId: "s-andina",
      status: "draft",
      lines: [pline(12, 2)],
      note: "",
      createdAt: daysFromToday(-1, 16, 0),
      createdBy: ANA,
      receipts: [],
    },
  ];

  return {
    users,
    products,
    movements: movements.sort((a, b) => b.at - a.at),
    orders,
    suppliers,
    purchases,
    seq: { purchase: purchases.length, remission },
  };
}

export const IDLE_DAYS = 30;
export const IDLE_MS = IDLE_DAYS * DAY_MS;
