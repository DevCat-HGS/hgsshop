import { useState, type ReactNode } from "react";
import { AppShell, type DemoAppProps, type NavItem } from "@/demos/kit/AppShell";
import { useToast } from "@/demos/kit/useToast";
import { useView } from "@/demos/kit/useView";
import { Btn, Field, inputClass } from "@/demos/kit/ui";
import { ROLE_LABELS, stockStatus } from "./data";
import { MovementDialog, PermBtn, type MovementPreset } from "./common";
import { useStockFlow } from "./store";
import { Dashboard } from "./Dashboard";
import { NewProductButton, Products, type Editing } from "./Products";
import { Movements } from "./Movements";
import { Orders, type OrderEditing } from "./Orders";
import { Reports } from "./Reports";
import { Users } from "./Users";

const VIEWS = ["panel", "productos", "movimientos", "pedidos", "reportes", "usuarios"] as const;
type View = (typeof VIEWS)[number];

const TITLES: Record<View, string> = {
  panel: "Panel",
  productos: "Productos",
  movimientos: "Movimientos",
  pedidos: "Pedidos",
  reportes: "Reportes",
  usuarios: "Usuarios y roles",
};

/**
 * StockFlow: inventario y pedidos de una ferretería ficticia (Ferretería El Tornillo, Medellín).
 * Todo vive en el navegador de quien prueba la demo.
 */
export function StockFlowDemo({ embedded }: DemoAppProps) {
  const [view, setView] = useView(VIEWS, "panel", embedded);
  const store = useStockFlow();
  const { notify, toast } = useToast();
  const [movePreset, setMovePreset] = useState<MovementPreset | null>(null);
  const [productEditing, setProductEditing] = useState<Editing>(null);
  const [orderEditing, setOrderEditing] = useState<OrderEditing>(null);
  const [creatingUser, setCreatingUser] = useState(false);

  const active = store.products.filter((p) => !p.archived);
  const alerts = active.filter((p) => stockStatus(p) !== "ok").length;
  const pending = store.orders.filter((o) => o.status === "pending").length;
  const canMove = store.can("move.in") || store.can("move.out") || store.can("move.adjust");

  const nav: NavItem<View>[] = [
    { id: "panel", label: "Panel" },
    { id: "productos", label: "Productos", badge: alerts },
    { id: "movimientos", label: "Movimientos" },
    { id: "pedidos", label: "Pedidos", badge: pending },
    { id: "reportes", label: "Reportes" },
    { id: "usuarios", label: "Usuarios" },
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
    pedidos: (
      <PermBtn store={store} permission="order.manage" variant="primary" onClick={() => setOrderEditing("new")}>
        Nuevo pedido
      </PermBtn>
    ),
    reportes: null,
    usuarios: (
      <PermBtn store={store} permission="user.manage" variant="primary" onClick={() => setCreatingUser(true)}>
        Nuevo usuario
      </PermBtn>
    ),
  };

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

  return (
    <>
      <AppShell
        appName="StockFlow"
        tagline="Ferretería El Tornillo · Medellín"
        nav={nav}
        view={view}
        onNavigate={setView}
        title={TITLES[view]}
        actions={actions[view]}
        sidebarFooter={userSelector}
      >
        {view === "panel" && <Dashboard store={store} onMove={setMovePreset} onOpen={setView} />}
        {view === "productos" && <Products store={store} notify={notify} onMove={setMovePreset} editing={productEditing} setEditing={setProductEditing} />}
        {view === "movimientos" && <Movements store={store} />}
        {view === "pedidos" && <Orders store={store} notify={notify} editing={orderEditing} setEditing={setOrderEditing} />}
        {view === "reportes" && <Reports store={store} />}
        {view === "usuarios" && <Users store={store} notify={notify} creating={creatingUser} setCreating={setCreatingUser} />}
      </AppShell>
      <MovementDialog store={store} preset={movePreset} onClose={() => setMovePreset(null)} onSaved={notify} />
      {toast}
    </>
  );
}
