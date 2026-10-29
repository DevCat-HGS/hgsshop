import { useMemo, useState } from "react";
import { AppShell, type DemoAppProps, type NavItem } from "@/demos/kit/AppShell";
import type { Command } from "@/demos/kit/CommandPalette";
import { useToast } from "@/demos/kit/useToast";
import { useView } from "@/demos/kit/useView";
import { ACADEMY_NAME, billedStudents, formatPhone, monthKey, nowMs, scheduleLabel } from "./data";
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

/** Registro que la búsqueda global pide abrir; `n` cambia en cada búsqueda para volver a montar la pantalla. */
interface Focus {
  view: View;
  id: string;
  n: number;
}

/**
 * RoboAcademy: gestión de una academia ficticia de robótica para niños. Grupos, estudiantes, asistencia por
 * sesión, progreso por módulos, mensualidades y reportes imprimibles. Los datos viven solo en este navegador.
 */
export function RoboAcademyDemo({ embedded }: DemoAppProps) {
  const [view, setView] = useView(VIEWS, "panel", embedded);
  const { notify, toast } = useToast();
  const academy = useAcademy();
  const [focus, setFocus] = useState<Focus | null>(null);

  // Navegar por el menú descarta el registro pedido por la búsqueda global.
  function navigate(next: View) {
    setFocus(null);
    setView(next);
  }
  const focused = (target: View) => (focus?.view === target ? focus.id : null);

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

  const { groups, students } = academy;
  const commands = useMemo<Command[]>(() => {
    const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? "Sin grupo";
    const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name, "es"));
    const go = (target: View, id: string) => {
      setFocus((prev) => ({ view: target, id, n: (prev?.n ?? 0) + 1 }));
      setView(target);
    };
    return [
      ...VIEWS.map((v) => ({ id: `pantalla-${v}`, label: TITLES[v], group: "Pantallas", run: () => {
        setFocus(null);
        setView(v);
      } })),
      ...sorted.map((s) => ({
        id: `estudiante-${s.id}`,
        label: s.name,
        hint: groupName(s.groupId),
        group: "Estudiantes",
        keywords: `${s.guardian} ${s.guardianPhone} ${formatPhone(s.guardianPhone)}`,
        run: () => go("estudiantes", s.id),
      })),
      ...groups.map((g) => ({ id: `grupo-${g.id}`, label: g.name, hint: scheduleLabel(g), group: "Grupos", keywords: g.teacher, run: () => go("grupos", g.id) })),
      ...sorted.map((s) => ({ id: `reporte-${s.id}`, label: `Reporte de ${s.name}`, hint: groupName(s.groupId), group: "Reportes", run: () => go("reportes", s.id) })),
    ];
  }, [groups, students, setView]);

  return (
    <AppShell
      appName="RoboAcademy"
      tagline={ACADEMY_NAME}
      nav={nav}
      view={view}
      onNavigate={navigate}
      commands={commands}
      embedded={embedded}
      title={TITLES[view]}
      sidebarFooter={<p className="text-[12px] text-text-subtle">{ACADEMY_NAME} · datos de ejemplo guardados solo en este navegador.</p>}
    >
      {view === "panel" && <Dashboard academy={academy} onNavigate={navigate} />}
      {view === "grupos" && <Groups key={focus?.n} academy={academy} notify={notify} initialEditId={focused("grupos")} />}
      {view === "estudiantes" && <Students key={focus?.n} academy={academy} notify={notify} initialProfileId={focused("estudiantes")} />}
      {view === "asistencia" && <Attendance academy={academy} notify={notify} />}
      {view === "progreso" && <Progress academy={academy} notify={notify} />}
      {view === "pagos" && <Payments academy={academy} notify={notify} />}
      {view === "reportes" && <Reports key={focus?.n} academy={academy} initialStudentId={focused("reportes")} />}
      {toast}
    </AppShell>
  );
}
