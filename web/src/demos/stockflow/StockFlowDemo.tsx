import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppShell, type DemoAppProps, type NavItem } from "@/demos/kit/AppShell";
import type { Command } from "@/demos/kit/CommandPalette";
import { productThemes } from "@/demos/kit/themes";
import { useToast } from "@/demos/kit/useToast";
import { useView } from "@/demos/kit/useView";
import { Btn, Field, inputClass } from "@/demos/kit/ui";
import { can, ORDER_LABELS, PURCHASE_LABELS, ROLE_LABELS, stockStatus } from "./data";
import { EmptyState, MovementDialog, PermBtn, type MovementPreset } from "./common";
import { useStockFlow } from "./store";
import { Dashboard } from "./Dashboard";
import { DocumentToolbar, RemissionDocument } from "./Documents";
import { Logo } from "./Logo";
import { ImportProducts, NewProductButton, Products, type Editing, type ProductFocus } from "./Products";
import { Movements } from "./Movements";
import { Orders, type OrderEditing } from "./Orders";
import { PurchaseDetail, PurchaseForm, Purchases, type PurchaseEditing, type PurchaseTab } from "./Purchases";
import { Reports } from "./Reports";
import { Settings } from "./Settings";
import { Suppliers, type SupplierEditing } from "./Suppliers";
import { Users } from "./Users";

const VIEWS = ["panel", "productos", "movimientos", "pedidos", "compras", "proveedores", "reportes", "usuarios", "ajustes"] as const;
type View = (typeof VIEWS)[number];

const TITLES: Record<View, string> = {
  panel: "Panel",
  productos: "Productos",
  movimientos: "Movimientos",
  pedidos: "Pedidos",
  compras: "Compras",
  proveedores: "Proveedores",
  reportes: "Reportes",
  usuarios: "Usuarios y roles",
  ajustes: "Ajustes del negocio",
};

/** Pantallas de compras: solo para los roles que ven compras y proveedores. */
const PURCHASE_VIEWS: readonly View[] = ["compras", "proveedores"];

/**
 * StockFlow: inventario, compras y pedidos de una ferretería ficticia (Ferretería El Tornillo, Medellín).
 * Todo vive en el navegador de quien prueba la demo.
 */
export function StockFlowDemo({ embedded }: DemoAppProps) {
  const [view, setView] = useView(VIEWS, "panel", embedded);
  const store = useStockFlow();
  const { notify, toast } = useToast();
  const [movePreset, setMovePreset] = useState<MovementPreset | null>(null);
  const [productEditing, setProductEditing] = useState<Editing>(null);
  const [importing, setImporting] = useState(false);
  const [orderEditing, setOrderEditing] = useState<OrderEditing>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
  const [remissionOrderId, setRemissionOrderId] = useState<string | null>(null);
  const [supplierEditing, setSupplierEditing] = useState<SupplierEditing>(null);
  const [purchaseTab, setPurchaseTab] = useState<PurchaseTab>("sugerencia");
  const [purchaseEditing, setPurchaseEditing] = useState<PurchaseEditing>(null);
  const [viewingPurchaseId, setViewingPurchaseId] = useState<string | null>(null);
  // Filtro que la búsqueda global aplica a Productos cuando el rol no puede editar: se aplica al montar (cambia la key).
  const [productFocus, setProductFocus] = useState<{ focus: ProductFocus; key: number } | null>(null);

  // setView cambia en cada render (depende de la URL); la ref deja estable la lista de comandos.
  const setViewRef = useRef(setView);
  useEffect(() => {
    setViewRef.current = setView;
  });
  const navigate = useCallback((next: View) => {
    setProductFocus(null);
    setRemissionOrderId(null);
    setViewingPurchaseId(null);
    setViewRef.current(next);
  }, []);
  /** Abre una orden de compra (desde la sugerencia, el formulario o la búsqueda global). */
  const openPurchase = useCallback((id: string) => {
    setViewingPurchaseId(id);
    setPurchaseTab("ordenes");
    setViewRef.current("compras");
  }, []);

  const active = store.products.filter((p) => !p.archived);
  const alerts = active.filter((p) => stockStatus(p) !== "ok").length;
  const pending = store.orders.filter((o) => o.status === "pending").length;
  const awaiting = store.purchases.filter((po) => po.status === "sent" || po.status === "partial").length;
  const canMove = store.can("move.in") || store.can("move.out") || store.can("move.adjust");
  const seesPurchases = store.can("purchase.view");

  const nav: NavItem<View>[] = [
    { id: "panel", label: "Panel" },
    { id: "productos", label: "Productos", badge: alerts },
    { id: "movimientos", label: "Movimientos" },
    { id: "pedidos", label: "Pedidos", badge: pending },
    ...(seesPurchases
      ? [
          { id: "compras" as const, label: "Compras", badge: awaiting },
          { id: "proveedores" as const, label: "Proveedores" },
        ]
      : []),
    { id: "reportes", label: "Reportes" },
    { id: "usuarios", label: "Usuarios" },
    { id: "ajustes", label: "Ajustes" },
  ];

  const moveButton = (
    <Btn variant="primary" disabled={!canMove} onClick={() => setMovePreset({})}>
      Registrar movimiento
    </Btn>
  );

  const actions: Record<View, ReactNode> = {
    panel: moveButton,
    productos: <NewProductButton store={store} onClick={() => setProductEditing("new")} />,
    movimientos: moveButton,
    pedidos: remissionOrderId ? null : (
      <PermBtn store={store} permission="order.manage" variant="primary" onClick={() => setOrderEditing("new")}>
        Nuevo pedido
      </PermBtn>
    ),
    compras:
      viewingPurchaseId || !seesPurchases ? null : (
        <PermBtn store={store} permission="purchase.manage" variant="primary" onClick={() => setPurchaseEditing("new")}>
          Nueva orden de compra
        </PermBtn>
      ),
    proveedores: !seesPurchases ? null : (
      <PermBtn store={store} permission="supplier.manage" variant="primary" onClick={() => setSupplierEditing("new")}>
        Nuevo proveedor
      </PermBtn>
    ),
    reportes: null,
    usuarios: (
      <PermBtn store={store} permission="user.manage" variant="primary" onClick={() => setCreatingUser(true)}>
        Nuevo usuario
      </PermBtn>
    ),
    ajustes: null,
  };

  const { products, orders, purchases, suppliers, role } = store;
  const commands = useMemo<Command[]>(() => {
    const purchaseAccess = can(role, "purchase.view");
    const screens: Command[] = VIEWS.filter((v) => purchaseAccess || !PURCHASE_VIEWS.includes(v)).map((v) => ({
      id: `view-${v}`,
      label: TITLES[v],
      group: "Pantallas",
      run: () => navigate(v),
    }));
    const productCommands: Command[] = [...products]
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
      .map((p) => ({
        id: `product-${p.id}`,
        label: p.name,
        hint: p.archived ? `${p.sku} · archivado` : p.sku,
        keywords: `${p.sku} ${p.category}`,
        group: "Productos",
        run: () => {
          if (can(role, "product.edit") && !p.archived) {
            navigate("productos");
            setProductEditing(p);
          } else {
            setProductFocus((prev) => ({ focus: { sku: p.sku, archived: p.archived }, key: (prev?.key ?? 0) + 1 }));
            setRemissionOrderId(null);
            setViewingPurchaseId(null);
            setViewRef.current("productos");
          }
        },
      }));
    const orderCommands: Command[] = [...orders]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((o) => ({
        id: `order-${o.id}`,
        label: `Pedido de ${o.customer}`,
        hint: ORDER_LABELS[o.status],
        keywords: `${o.number} ${o.remission ?? ""}`,
        group: "Pedidos",
        run: () => {
          navigate("pedidos");
          setViewingOrderId(o.id);
        },
      }));
    if (!purchaseAccess) return [...screens, ...productCommands, ...orderCommands];

    const supplierName = new Map(suppliers.map((s) => [s.id, s.name]));
    const purchaseCommands: Command[] = [...purchases]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((po) => ({
        id: `purchase-${po.id}`,
        label: `Orden de compra ${po.number}`,
        hint: PURCHASE_LABELS[po.status],
        keywords: supplierName.get(po.supplierId) ?? "",
        group: "Compras",
        run: () => {
          navigate("compras");
          openPurchase(po.id);
        },
      }));
    const supplierCommands: Command[] = [...suppliers]
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
      .map((s) => ({
        id: `supplier-${s.id}`,
        label: s.name,
        hint: s.nit ? `NIT ${s.nit}` : "Proveedor",
        keywords: `${s.contact} ${s.nit}`,
        group: "Proveedores",
        run: () => {
          navigate("proveedores");
          if (can(role, "supplier.manage")) setSupplierEditing(s);
        },
      }));
    return [...screens, ...productCommands, ...orderCommands, ...purchaseCommands, ...supplierCommands];
  }, [products, orders, purchases, suppliers, role, navigate, openPurchase]);

  const userSelector = (
    <Field label="Usar la demo como" hint={`Rol: ${ROLE_LABELS[store.role]}`}>
      {(id) => (
        <select
          id={id}
          value={store.currentUser.id}
          onChange={(e) => {
            const user = store.users.find((u) => u.id === e.target.value);
            store.setCurrentUserId(e.target.value);
            if (user) notify(`Ahora usas la demo como ${user.name} (${ROLE_LABELS[user.role]})`);
          }}
          className={inputClass}
        >
          {store.users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      )}
    </Field>
  );

  const openSettings = () => navigate("ajustes");
  const viewingPurchase = store.purchases.find((po) => po.id === viewingPurchaseId) ?? null;
  const remissionOrder = store.orders.find((o) => o.id === remissionOrderId && o.remission) ?? null;
  const { settings } = store;
  const tagline = settings.city ? `${settings.name} · ${settings.city}` : settings.name;

  function purchaseScreen() {
    if (!seesPurchases)
      return (
        <EmptyState title="Tu rol no ve las compras">
          Compras y proveedores son de Administración y Bodega. Cambia de usuario en &quot;Usar la demo como&quot; para verlas.
        </EmptyState>
      );
    if (view === "proveedores") return <Suppliers store={store} notify={notify} editing={supplierEditing} setEditing={setSupplierEditing} />;
    if (viewingPurchase)
      return (
        <PurchaseDetail
          store={store}
          po={viewingPurchase}
          notify={notify}
          onBack={() => setViewingPurchaseId(null)}
          onEdit={setPurchaseEditing}
          onSettings={openSettings}
        />
      );
    return (
      <Purchases
        store={store}
        notify={notify}
        tab={purchaseTab}
        setTab={setPurchaseTab}
        onOpen={openPurchase}
        onNewProduct={() => {
          navigate("productos");
          setProductEditing("new");
        }}
        onSettings={openSettings}
      />
    );
  }

  return (
    <>
      <AppShell
        appName="StockFlow"
        tagline={tagline}
        nav={nav}
        view={view}
        onNavigate={navigate}
        title={TITLES[view]}
        actions={actions[view]}
        sidebarFooter={userSelector}
        commands={commands}
        embedded={embedded}
        theme={productThemes.stockflow}
        logo={<Logo />}
      >
        {view === "panel" && <Dashboard store={store} onMove={setMovePreset} onOpen={navigate} />}
        {view === "productos" && (
          <Products
            key={productFocus?.key ?? 0}
            store={store}
            notify={notify}
            onMove={setMovePreset}
            editing={productEditing}
            setEditing={setProductEditing}
            onImport={() => setImporting(true)}
            focus={productFocus?.focus}
          />
        )}
        {view === "movimientos" && <Movements store={store} />}
        {view === "pedidos" &&
          (remissionOrder ? (
            <div>
              <DocumentToolbar
                settings={settings}
                onBack={() => setRemissionOrderId(null)}
                backLabel="Pedidos"
                canEditSettings={store.can("settings.manage")}
                onOpenSettings={openSettings}
              />
              <RemissionDocument store={store} order={remissionOrder} />
            </div>
          ) : (
            <Orders
              store={store}
              notify={notify}
              editing={orderEditing}
              setEditing={setOrderEditing}
              viewingId={viewingOrderId}
              setViewingId={setViewingOrderId}
              onRemission={setRemissionOrderId}
            />
          ))}
        {(view === "compras" || view === "proveedores") && purchaseScreen()}
        {view === "reportes" && <Reports store={store} />}
        {view === "usuarios" && <Users store={store} notify={notify} creating={creatingUser} setCreating={setCreatingUser} />}
        {view === "ajustes" && <Settings store={store} notify={notify} />}
      </AppShell>
      <MovementDialog store={store} preset={movePreset} onClose={() => setMovePreset(null)} onSaved={notify} />
      <ImportProducts store={store} open={importing} onClose={() => setImporting(false)} notify={notify} />
      <PurchaseForm store={store} editing={purchaseEditing} onClose={() => setPurchaseEditing(null)} notify={notify} onSaved={openPurchase} />
      {toast}
    </>
  );
}
