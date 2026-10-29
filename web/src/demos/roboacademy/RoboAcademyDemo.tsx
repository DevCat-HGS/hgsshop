import { useMemo, useState } from "react";
import { AppShell, type DemoAppProps, type NavItem } from "@/demos/kit/AppShell";
import type { Command } from "@/demos/kit/CommandPalette";
import { productThemes } from "@/demos/kit/themes";
import { useToast } from "@/demos/kit/useToast";
import { useView } from "@/demos/kit/useView";
import { billedStudents, formatPhone, monthKey, nowMs, scheduleLabel, statusInfo } from "./data";
import { useAcademy } from "./store";
import { Logo } from "./Logo";
import { Dashboard } from "./Dashboard";
import { Enrollment } from "./Enrollment";
import { PublicForm } from "./PublicForm";
import { Groups } from "./Groups";
import { Students } from "./Students";
import { Attendance } from "./Attendance";
import { Progress } from "./Progress";
import { Payments } from "./Payments";
import { Reports } from "./Reports";
import { Portal } from "./Portal";
import { Settings } from "./Settings";

const VIEWS = ["panel", "inscripciones", "formulario", "grupos", "estudiantes", "asistencia", "progreso", "pagos", "reportes", "portal", "ajustes"] as const;
type View = (typeof VIEWS)[number];

const TITLES: Record<View, string> = {
  panel: "Panel",
  inscripciones: "Inscripciones",
  formulario: "Formulario de inscripción",
  grupos: "Grupos",
  estudiantes: "Estudiantes",
  asistencia: "Asistencia",
  progreso: "Progreso",
  pagos: "Pagos",
  reportes: "Reportes para acudientes",
  portal: "Portal del acudiente",
  ajustes: "Ajustes de la academia",
};

/** Registro que la búsqueda global (u otra pantalla) pide abrir; `n` cambia en cada pedido para volver a montar la pantalla. */
interface Focus {
  view: View;
  id: string;
  n: number;
}

/**
 * RoboAcademy: gestión de una academia de robótica para niños. Inscripciones, grupos, estudiantes, asistencia por
 * sesión, progreso por módulos, mensualidades con recibo, reportes imprimibles y el portal del acudiente. Los
 * datos viven solo en este navegador.
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
  const open = (target: View, id: string) => {
    setFocus((prev) => ({ view: target, id, n: (prev?.n ?? 0) + 1 }));
    setView(target);
  };

  const month = monthKey(nowMs());
  const pending = billedStudents(academy.students, academy.payments, month).filter(
    (s) => !academy.payments.some((p) => p.studentId === s.id && p.month === month),
  ).length;
  const newApplicants = academy.applicants.filter((a) => a.status === "nuevo").length;

  const nav: NavItem<View>[] = [
    { id: "panel", label: "Panel" },
    { id: "inscripciones", label: "Inscripciones", badge: newApplicants },
    { id: "grupos", label: "Grupos" },
    { id: "estudiantes", label: "Estudiantes" },
    { id: "asistencia", label: "Asistencia" },
    { id: "progreso", label: "Progreso" },
    { id: "pagos", label: "Pagos", badge: pending },
    { id: "reportes", label: "Reportes" },
    { id: "portal", label: "Portal del acudiente" },
    { id: "ajustes", label: "Ajustes" },
  ];

  const { groups, students, applicants } = academy;
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
      ...applicants.map((a) => ({
        id: `aspirante-${a.id}`,
        label: a.childName,
        hint: `Aspirante · ${statusInfo(a.status).label}`,
        group: "Aspirantes",
        keywords: `${a.guardian} ${a.phone} ${formatPhone(a.phone)}`,
        run: () => go("inscripciones", a.id),
      })),
      ...groups.map((g) => ({ id: `grupo-${g.id}`, label: g.name, hint: scheduleLabel(g), group: "Grupos", keywords: g.teacher, run: () => go("grupos", g.id) })),
      ...sorted.map((s) => ({ id: `reporte-${s.id}`, label: `Reporte de ${s.name}`, hint: groupName(s.groupId), group: "Reportes", run: () => go("reportes", s.id) })),
      ...sorted.map((s) => ({ id: `portal-${s.id}`, label: `Portal de ${s.name}`, hint: s.guardian, group: "Portal del acudiente", run: () => go("portal", s.id) })),
    ];
  }, [groups, students, applicants, setView]);

  const name = academy.settings.name;

  return (
    <AppShell
      appName="RoboAcademy"
      tagline={name}
      theme={productThemes.roboacademy}
      logo={<Logo />}
      nav={nav}
      view={view}
      onNavigate={navigate}
      commands={commands}
      embedded={embedded}
      title={TITLES[view]}
      sidebarFooter={
        <p className="text-[12px] text-text-subtle">
          <span className="font-semibold text-text-muted">{name}</span> · RoboAcademy. Datos guardados solo en este navegador.
        </p>
      }
    >
      {view === "panel" && <Dashboard academy={academy} onNavigate={navigate} />}
      {view === "inscripciones" && (
        <Enrollment key={focus?.n} academy={academy} notify={notify} goTo={navigate} onOpenStudent={(id) => open("estudiantes", id)} initialApplicantId={focused("inscripciones")} />
      )}
      {view === "formulario" && <PublicForm academy={academy} notify={notify} goTo={navigate} />}
      {view === "grupos" && <Groups key={focus?.n} academy={academy} notify={notify} initialEditId={focused("grupos")} />}
      {view === "estudiantes" && (
        <Students key={focus?.n} academy={academy} notify={notify} goToGroups={() => navigate("grupos")} initialProfileId={focused("estudiantes")} />
      )}
      {view === "asistencia" && <Attendance academy={academy} notify={notify} goTo={navigate} />}
      {view === "progreso" && <Progress academy={academy} notify={notify} goTo={navigate} />}
      {view === "pagos" && <Payments academy={academy} notify={notify} goTo={navigate} />}
      {view === "reportes" && <Reports key={focus?.n} academy={academy} goTo={navigate} initialStudentId={focused("reportes")} />}
      {view === "portal" && <Portal key={focus?.n} academy={academy} goTo={navigate} initialStudentId={focused("portal")} />}
      {view === "ajustes" && <Settings academy={academy} notify={notify} />}
      {toast}
    </AppShell>
  );
}
