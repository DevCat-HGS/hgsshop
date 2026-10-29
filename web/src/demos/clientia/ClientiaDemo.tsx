import { useState, type ReactNode } from "react";
import { AppShell, type DemoAppProps } from "@/demos/kit/AppShell";
import { Btn } from "@/demos/kit/ui";
import { useToast } from "@/demos/kit/useToast";
import { useView } from "@/demos/kit/useView";
import { Agenda } from "./Agenda";
import { AppointmentDialog } from "./AppointmentDialog";
import { Availability } from "./Availability";
import { Clients } from "./Clients";
import { Dashboard } from "./Dashboard";
import { BUSINESS, type Editor } from "./data";
import { Reminders } from "./Reminders";
import { Services } from "./Services";
import { useClientiaStore } from "./store";

const VIEWS = ["panel", "agenda", "clientes", "servicios", "disponibilidad", "recordatorios"] as const;
type View = (typeof VIEWS)[number];

const TITLES: Record<View, string> = {
  panel: "Panel",
  agenda: "Agenda",
  clientes: "Clientes",
  servicios: "Servicios",
  disponibilidad: "Disponibilidad",
  recordatorios: "Recordatorios",
};

/**
 * Clientia: agenda de citas y seguimiento de clientes de un centro de estética ficticio. Todo vive en el
 * navegador (kit de demos); los recordatorios se simulan y no sale ningún mensaje.
 */
export function ClientiaDemo({ embedded }: DemoAppProps) {
  const store = useClientiaStore();
  const [view, setView] = useView(VIEWS, "panel", embedded);
  const { notify, toast } = useToast();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [creating, setCreating] = useState<View | null>(null);

  const pendingMarks = store.appointments.filter((a) => a.status === "scheduled" && a.start <= store.now).length;

  function navigate(next: View) {
    if (next === "clientes") setClientId(null);
    setView(next);
  }

  function openClient(id: string) {
    setClientId(id);
    setView("clientes");
  }

  const newAppt = (
    <Btn variant="primary" onClick={() => setEditor({ mode: "new" })}>
      Nueva cita
    </Btn>
  );
  const actions: Record<View, ReactNode> = {
    panel: newAppt,
    agenda: newAppt,
    clientes: (
      <Btn variant="primary" onClick={() => setCreating("clientes")}>
        Nuevo cliente
      </Btn>
    ),
    servicios: (
      <Btn variant="primary" onClick={() => setCreating("servicios")}>
        Nuevo servicio
      </Btn>
    ),
    disponibilidad: null,
    recordatorios: null,
  };

  const creatingProps = (v: View) => ({ creating: creating === v, onCreatingChange: (open: boolean) => setCreating(open ? v : null) });

  return (
    <>
      <AppShell
        appName="Clientia"
        tagline={BUSINESS}
        nav={VIEWS.map((id) => ({ id, label: TITLES[id], badge: id === "panel" ? pendingMarks : undefined }))}
        view={view}
        onNavigate={navigate}
        title={TITLES[view]}
        actions={actions[view]}
        sidebarFooter={<p className="text-[12px] text-text-subtle">Datos ficticios guardados solo en este navegador. Los recordatorios se simulan.</p>}
      >
        {view === "panel" && <Dashboard store={store} onEdit={setEditor} onGo={navigate} onOpenClient={openClient} />}
        {view === "agenda" && <Agenda store={store} onEdit={setEditor} />}
        {view === "clientes" && <Clients store={store} selectedId={clientId} onSelect={setClientId} onEdit={setEditor} notify={notify} {...creatingProps("clientes")} />}
        {view === "servicios" && <Services store={store} notify={notify} {...creatingProps("servicios")} />}
        {view === "disponibilidad" && (
          <Availability store={store} notify={notify} onEdit={setEditor} creatingPro={creating === "disponibilidad"} onCreatingProChange={(open) => setCreating(open ? "disponibilidad" : null)} />
        )}
        {view === "recordatorios" && <Reminders store={store} notify={notify} />}
      </AppShell>
      <AppointmentDialog store={store} editor={editor} onClose={() => setEditor(null)} notify={notify} />
      {toast}
    </>
  );
}
