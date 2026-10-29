import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell, type DemoAppProps } from "@/demos/kit/AppShell";
import type { Command } from "@/demos/kit/CommandPalette";
import { formatMoney } from "@/demos/kit/format";
import { productThemes, themeStyle } from "@/demos/kit/themes";
import { Btn } from "@/demos/kit/ui";
import { useToast } from "@/demos/kit/useToast";
import { useView } from "@/demos/kit/useView";
import { Agenda } from "./Agenda";
import { AppointmentDialog } from "./AppointmentDialog";
import { Availability } from "./Availability";
import { Clients } from "./Clients";
import { Dashboard } from "./Dashboard";
import { Booking } from "./Booking";
import { durationLabel, type Editor } from "./data";
import { ClientiaLogo } from "./Logo";
import { PublicBooking } from "./PublicBooking";
import { Reminders } from "./Reminders";
import { Requests } from "./Requests";
import { Services } from "./Services";
import { useClientiaStore } from "./store";

const VIEWS = ["panel", "agenda", "solicitudes", "clientes", "servicios", "disponibilidad", "recordatorios", "reservas"] as const;
type View = (typeof VIEWS)[number];
/** Vistas que acepta la URL: las de la app más la página pública de reservas ("Así la ve tu cliente"). */
const ROUTES = [...VIEWS, "reservar"] as const;

const TITLES: Record<View, string> = {
  panel: "Panel",
  agenda: "Agenda",
  solicitudes: "Solicitudes",
  clientes: "Clientes",
  servicios: "Servicios",
  disponibilidad: "Disponibilidad",
  recordatorios: "Recordatorios",
  reservas: "Reservas en línea",
};

/**
 * Clientia: agenda de citas y seguimiento de clientes de un centro de estética ficticio. Todo vive en el
 * navegador (kit de demos); los recordatorios se simulan y no sale ningún mensaje.
 */
export function ClientiaDemo({ embedded }: DemoAppProps) {
  const store = useClientiaStore();
  const [route, setView] = useView(ROUTES, "panel", embedded);
  const view: View = route === "reservar" ? "reservas" : route;
  const { notify, toast } = useToast();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [creating, setCreating] = useState<View | null>(null);
  const [agendaPro, setAgendaPro] = useState("all");
  const [serviceFocus, setServiceFocus] = useState<{ id: string } | null>(null);
  const [importing, setImporting] = useState(false);

  const pendingMarks = store.appointments.filter((a) => a.status === "scheduled" && a.start <= store.now).length;
  const pendingRequests = store.appointments.filter((a) => a.status === "pending").length;

  // Pestaña del navegador con el nombre del negocio y del producto, como una app real. Se aplica después del
  // título genérico que pone la página de la demo al montar (sus efectos corren después de los de la app).
  const businessName = store.business.name;
  useEffect(() => {
    if (embedded) return;
    let active = true;
    queueMicrotask(() => {
      if (active) document.title = `${businessName} · Clientia`;
    });
    return () => {
      active = false;
    };
  }, [embedded, businessName]);

  const navigate = useCallback(
    (next: View) => {
      if (next === "clientes") setClientId(null);
      if (next === "agenda") setAgendaPro("all");
      setServiceFocus(null);
      setView(next);
    },
    [setView],
  );

  function openClient(id: string) {
    setClientId(id);
    setView("clientes");
  }

  const { clients, services, professionals } = store;
  const commands = useMemo<Command[]>(
    () => [
      ...VIEWS.map((id) => ({ id: `vista-${id}`, label: TITLES[id], group: "Pantallas", run: () => navigate(id) })),
      ...clients.map((c) => ({
        id: `cliente-${c.id}`,
        label: c.name,
        hint: c.phone || c.email || "Sin datos de contacto",
        keywords: `${c.email} ${c.phone}`,
        group: "Clientes",
        run: () => {
          setClientId(c.id);
          setView("clientes");
        },
      })),
      ...services.map((s) => ({
        id: `servicio-${s.id}`,
        label: s.name,
        hint: `${durationLabel(s.duration)} · ${formatMoney(s.price)}`,
        group: "Servicios",
        run: () => {
          setServiceFocus({ id: s.id });
          setView("servicios");
        },
      })),
      ...professionals.map((p) => ({
        id: `profesional-${p.id}`,
        label: p.name,
        hint: `${p.role} · ver su agenda`,
        group: "Profesionales",
        run: () => {
          setAgendaPro(p.id);
          setView("agenda");
        },
      })),
    ],
    [clients, services, professionals, setView, navigate],
  );

  const newAppt = (
    <Btn variant="primary" onClick={() => setEditor({ mode: "new" })}>
      Nueva cita
    </Btn>
  );
  const actions: Record<View, ReactNode> = {
    panel: newAppt,
    agenda: newAppt,
    clientes: (
      <>
        <Btn onClick={() => setImporting(true)}>Importar</Btn>
        <Btn variant="primary" onClick={() => setCreating("clientes")}>
          Nuevo cliente
        </Btn>
      </>
    ),
    solicitudes: null,
    servicios: (
      <Btn variant="primary" onClick={() => setCreating("servicios")}>
        Nuevo servicio
      </Btn>
    ),
    disponibilidad: null,
    recordatorios: null,
    reservas: null,
  };

  const creatingProps = (v: View) => ({ creating: creating === v, onCreatingChange: (open: boolean) => setCreating(open ? v : null) });

  if (route === "reservar") {
    return (
      <div data-ui style={themeStyle(productThemes.clientia)} className="flex h-full min-h-0 flex-col bg-bg-raised text-text">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-bg px-4 py-2 text-[13px] text-text-muted">
          <span>Así ve tu cliente la página de reservas de {businessName}.</span>
          <Btn size="sm" onClick={() => navigate("reservas")}>
            Volver a Clientia
          </Btn>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <PublicBooking store={store} notify={notify} />
        </div>
        {toast}
      </div>
    );
  }

  return (
    <>
      <AppShell
        appName="Clientia"
        tagline={businessName}
        theme={productThemes.clientia}
        logo={<ClientiaLogo />}
        nav={VIEWS.map((id) => ({ id, label: TITLES[id], badge: id === "panel" ? pendingMarks : id === "solicitudes" ? pendingRequests : undefined }))}
        view={view}
        onNavigate={navigate}
        title={TITLES[view]}
        actions={actions[view]}
        commands={commands}
        embedded={embedded}
        sidebarFooter={<p className="text-[12px] text-text-subtle">Datos ficticios guardados solo en este navegador. Los recordatorios se simulan.</p>}
      >
        {view === "panel" && <Dashboard store={store} onEdit={setEditor} onGo={navigate} onOpenClient={openClient} />}
        {view === "solicitudes" && <Requests store={store} notify={notify} onEdit={setEditor} onOpenClient={openClient} onGoBooking={() => navigate("reservas")} />}
        {view === "agenda" && <Agenda store={store} onEdit={setEditor} proFilter={agendaPro} onProFilterChange={setAgendaPro} />}
        {view === "clientes" && (
          <Clients
            store={store}
            selectedId={clientId}
            onSelect={setClientId}
            onEdit={setEditor}
            notify={notify}
            importing={importing}
            onImportingChange={setImporting}
            {...creatingProps("clientes")}
          />
        )}
        {view === "servicios" && <Services store={store} notify={notify} focus={serviceFocus} {...creatingProps("servicios")} />}
        {view === "disponibilidad" && (
          <Availability store={store} notify={notify} onEdit={setEditor} creatingPro={creating === "disponibilidad"} onCreatingProChange={(open) => setCreating(open ? "disponibilidad" : null)} />
        )}
        {view === "recordatorios" && <Reminders store={store} notify={notify} />}
        {view === "reservas" && <Booking store={store} notify={notify} onOpenPublic={() => setView("reservar")} />}
      </AppShell>
      <AppointmentDialog store={store} editor={editor} onClose={() => setEditor(null)} notify={notify} />
      {toast}
    </>
  );
}
