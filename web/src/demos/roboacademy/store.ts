import { useRef } from "react";
import { isBlankStart, storageKey, usePersistentState, uid } from "@/demos/kit/storage";
import {
  DEFAULT_SETTINGS,
  SLUG,
  seedAcademy,
  sessionId,
  type AcademyData,
  type Applicant,
  type ApplicantStatus,
  type FollowUp,
  type Group,
  type Mark,
  type Note,
  type PayMethod,
  type Payment,
  type Session,
  type Settings,
  type Student,
  type VoidedReceipt,
} from "./data";

/** Lee un almacén de una versión anterior (para migrarlo en vez de perder los datos de quien ya usó la demo). */
function readLegacy<T>(name: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(storageKey(SLUG, name));
    return raw == null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

/** Grupos v1 no tenían rango de edad: se les da uno amplio que no excluye a nadie. */
function migrateGroups(): Group[] | undefined {
  return readLegacy<Omit<Group, "minAge" | "maxAge">[]>("grupos.v1")?.map((g) => ({ ...g, minAge: 4, maxAge: 18 }));
}

/** Pagos v1 no tenían recibo: se numeran en el orden en que se pagaron. */
function migratePayments(): Payment[] | undefined {
  const legacy = readLegacy<Omit<Payment, "receipt">[]>("pagos.v1");
  return legacy && [...legacy].sort((a, b) => a.paidAt - b.paidAt).map((p, i) => ({ ...p, receipt: i + 1 }));
}

const now = () => Date.now();

/** Estado de la academia y sus acciones; cada pantalla recibe este objeto. */
export function useAcademy() {
  // Una sola siembra para todas las colecciones.
  const seedRef = useRef<AcademyData | null>(null);
  const seed = () => (seedRef.current ??= seedAcademy());

  const [groups, setGroups] = usePersistentState<Group[]>(SLUG, "grupos.v2", () => migrateGroups() ?? seed().groups);
  const [students, setStudents] = usePersistentState<Student[]>(SLUG, "estudiantes.v1", () => seed().students);
  const [sessions, setSessions] = usePersistentState<Session[]>(SLUG, "sesiones.v1", () => seed().sessions);
  const [notes, setNotes] = usePersistentState<Note[]>(SLUG, "notas.v1", () => seed().notes);
  const [payments, setPayments] = usePersistentState<Payment[]>(SLUG, "pagos.v2", () => migratePayments() ?? seed().payments);
  const [nextReceipt, setNextReceipt] = usePersistentState<number>(SLUG, "consecutivo.v1", () => {
    const migrated = migratePayments();
    return migrated ? migrated.length + 1 : seed().nextReceipt;
  });
  const [voided, setVoided] = usePersistentState<VoidedReceipt[]>(SLUG, "recibos-anulados.v1", () => []);
  const [comments, setComments] = usePersistentState<Record<string, string>>(SLUG, "comentarios.v1", () => ({}));
  const [applicants, setApplicants] = usePersistentState<Applicant[]>(SLUG, "aspirantes.v1", () => seed().applicants);
  const [settings, setSettings] = usePersistentState<Settings>(SLUG, "ajustes.v1", () =>
    // Con "Empezar vacío" la academia es la de quien prueba: sin NIT ni dirección de ejemplo.
    isBlankStart(SLUG) ? { name: "Mi academia", nit: "", address: "", city: "", phone: "", footer: "" } : { ...DEFAULT_SETTINGS },
  );

  function saveGroup(group: Group) {
    const previous = groups.find((g) => g.id === group.id);
    setGroups((list) => (previous ? list.map((g) => (g.id === group.id ? group : g)) : [...list, group]));
    if (!previous) return;
    // Si cambió la lista de módulos, cada estudiante conserva su módulo (por id) o el más cercano.
    setStudents((list) =>
      list.map((s) => {
        if (s.groupId !== group.id) return s;
        if (s.moduleIndex >= previous.modules.length) return { ...s, moduleIndex: group.modules.length };
        const moduleId = previous.modules[s.moduleIndex]?.id;
        const found = group.modules.findIndex((m) => m.id === moduleId);
        return { ...s, moduleIndex: found >= 0 ? found : Math.min(s.moduleIndex, group.modules.length - 1) };
      }),
    );
  }

  function deleteGroup(id: string) {
    setGroups((list) => list.filter((g) => g.id !== id));
    setSessions((list) => list.filter((s) => s.groupId !== id));
    setApplicants((list) => list.map((a) => (a.groupId === id ? { ...a, groupId: "" } : a)));
  }

  function saveStudent(student: Student) {
    setStudents((list) => (list.some((s) => s.id === student.id) ? list.map((s) => (s.id === student.id ? student : s)) : [...list, student]));
  }

  function addStudents(list: Student[]) {
    setStudents((current) => [...current, ...list]);
  }

  function deleteStudent(id: string) {
    setStudents((list) => list.filter((s) => s.id !== id));
    setPayments((list) => list.filter((p) => p.studentId !== id));
    setNotes((list) => list.filter((n) => n.studentId !== id));
    setApplicants((list) => list.map((a) => (a.studentId === id ? { ...a, studentId: null } : a)));
    setSessions((list) =>
      list.map((session) => {
        if (!(id in session.marks)) return session;
        const marks = { ...session.marks };
        delete marks[id];
        return { ...session, marks };
      }),
    );
  }

  function setMarks(groupId: string, date: number, change: Record<string, Mark>) {
    const id = sessionId(groupId, date);
    setSessions((list) => {
      const existing = list.find((s) => s.id === id);
      if (existing) return list.map((s) => (s.id === id ? { ...s, marks: { ...s.marks, ...change } } : s));
      return [...list, { id, groupId, date, marks: change }];
    });
  }

  function setModule(studentId: string, moduleIndex: number) {
    setStudents((list) => list.map((s) => (s.id === studentId ? { ...s, moduleIndex } : s)));
  }

  function addNote(studentId: string, date: number, text: string) {
    setNotes((list) => [...list, { id: uid("n"), studentId, date, text }]);
  }

  function deleteNote(id: string) {
    setNotes((list) => list.filter((n) => n.id !== id));
  }

  /** Registra la mensualidad y devuelve el pago con su número de recibo. */
  function pay(studentId: string, month: string, amount: number, paidAt: number, method: PayMethod): Payment {
    const payment: Payment = { id: uid("p"), studentId, month, amount, paidAt, method, receipt: nextReceipt };
    setNextReceipt(nextReceipt + 1);
    setPayments((list) => [...list.filter((p) => !(p.studentId === studentId && p.month === month)), payment]);
    return payment;
  }

  /** Deshace un pago: su recibo queda anulado y el número no se vuelve a usar. */
  function undoPay(id: string) {
    const payment = payments.find((p) => p.id === id);
    if (!payment) return;
    const student = students.find((s) => s.id === payment.studentId);
    setVoided((list) => [
      ...list,
      {
        receipt: payment.receipt,
        studentId: payment.studentId,
        studentName: student?.name ?? "",
        month: payment.month,
        amount: payment.amount,
        paidAt: payment.paidAt,
        voidedAt: now(),
      },
    ]);
    setPayments((list) => list.filter((p) => p.id !== id));
  }

  function setComment(key: string, text: string) {
    setComments((map) => ({ ...map, [key]: text }));
  }

  /* ---------- Inscripciones ---------- */

  const entry = (kind: FollowUp["kind"], text: string): FollowUp => ({ id: uid("f"), at: now(), kind, text });

  function addApplicant(data: Omit<Applicant, "id" | "createdAt" | "status" | "trialAt" | "discardReason" | "studentId" | "log">) {
    setApplicants((list) => [
      ...list,
      { ...data, id: uid("a"), createdAt: now(), status: "nuevo", trialAt: null, discardReason: "", studentId: null, log: [] },
    ]);
  }

  function setApplicantStatus(id: string, status: ApplicantStatus, extra: Partial<Pick<Applicant, "trialAt" | "discardReason" | "studentId">>, logText: string) {
    setApplicants((list) => list.map((a) => (a.id === id ? { ...a, ...extra, status, log: [...a.log, entry("estado", logText)] } : a)));
  }

  function addFollowUp(id: string, text: string) {
    setApplicants((list) => list.map((a) => (a.id === id ? { ...a, log: [...a.log, entry("nota", text)] } : a)));
  }

  function deleteApplicant(id: string) {
    setApplicants((list) => list.filter((a) => a.id !== id));
  }

  /** Inscribe al aspirante: crea el estudiante en el grupo y marca la inscripción. */
  function enroll(applicantId: string, student: Student, groupName: string) {
    setStudents((list) => [...list, student]);
    setApplicantStatus(applicantId, "inscrito", { studentId: student.id }, `Inscrito en ${groupName}`);
  }

  return {
    groups,
    students,
    sessions,
    notes,
    payments,
    voided,
    nextReceipt,
    comments,
    applicants,
    settings,
    setSettings,
    saveGroup,
    deleteGroup,
    saveStudent,
    addStudents,
    deleteStudent,
    setMarks,
    setModule,
    addNote,
    deleteNote,
    pay,
    undoPay,
    setComment,
    addApplicant,
    setApplicantStatus,
    addFollowUp,
    deleteApplicant,
    enroll,
  };
}

export type Academy = ReturnType<typeof useAcademy>;

/** Pantallas a las que una pantalla puede mandar a la persona (estados vacíos, accesos directos). */
export type GoTo = (view: "panel" | "inscripciones" | "formulario" | "grupos" | "estudiantes" | "asistencia" | "progreso" | "pagos" | "reportes" | "portal" | "ajustes") => void;

/** Lo que recibe cada pantalla. */
export interface ScreenProps {
  academy: Academy;
  notify: (message: string) => void;
}
