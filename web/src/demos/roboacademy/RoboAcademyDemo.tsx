import { AppShell, type DemoAppProps, type NavItem } from "@/demos/kit/AppShell";
import { useToast } from "@/demos/kit/useToast";
import { useView } from "@/demos/kit/useView";
import { ACADEMY_NAME, billedStudents, monthKey, nowMs } from "./data";
import { useAcademy } from "./store";
import { Dashboard } from "./Dashboard";
import { Groups } from "./Groups";
import { Students } from "./Students";
import { Attendance } from "./Attendance";
import { Progress } from "./Progress";
import { Payments } from "./Payments";
import { Reports } from "./Reports";

const VIEWS = ["panel", "grupos", "estudiantes", "asistencia", "progreso", "pagos", "reportes"] as const;
type View = (typeof VIEWS)[number];

const TITLES: Record<View, string> = {
  panel: "Panel",
  grupos: "Grupos",
  estudiantes: "Estudiantes",
  asistencia: "Asistencia",
  progreso: "Progreso",
  pagos: "Pagos",
  reportes: "Reportes para acudientes",
};

/**
 * RoboAcademy: gestión de una academia ficticia de robótica para niños. Grupos, estudiantes, asistencia por
 * sesión, progreso por módulos, mensualidades y reportes imprimibles. Los datos viven solo en este navegador.
 */
export function RoboAcademyDemo({ embedded }: DemoAppProps) {
  const [view, setView] = useView(VIEWS, "panel", embedded);
  const { notify, toast } = useToast();
  const academy = useAcademy();

  const month = monthKey(nowMs());
  const pending = billedStudents(academy.students, academy.payments, month).filter(
    (s) => !academy.payments.some((p) => p.studentId === s.id && p.month === month),
  ).length;

  const nav: NavItem<View>[] = [
    { id: "panel", label: "Panel" },
    { id: "grupos", label: "Grupos" },
    { id: "estudiantes", label: "Estudiantes" },
    { id: "asistencia", label: "Asistencia" },
    { id: "progreso", label: "Progreso" },
    { id: "pagos", label: "Pagos", badge: pending },
    { id: "reportes", label: "Reportes" },
  ];

  return (
    <AppShell
      appName="RoboAcademy"
      tagline={ACADEMY_NAME}
      nav={nav}
      view={view}
      onNavigate={setView}
      title={TITLES[view]}
      sidebarFooter={<p className="text-[12px] text-text-subtle">{ACADEMY_NAME} · datos de ejemplo guardados solo en este navegador.</p>}
    >
      {view === "panel" && <Dashboard academy={academy} onNavigate={setView} />}
      {view === "grupos" && <Groups academy={academy} notify={notify} />}
      {view === "estudiantes" && <Students academy={academy} notify={notify} />}
      {view === "asistencia" && <Attendance academy={academy} notify={notify} />}
      {view === "progreso" && <Progress academy={academy} notify={notify} />}
      {view === "pagos" && <Payments academy={academy} notify={notify} />}
      {view === "reportes" && <Reports academy={academy} />}
      {toast}
    </AppShell>
  );
}
