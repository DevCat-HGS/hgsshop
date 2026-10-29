import { useRef } from "react";
import { usePersistentState, uid } from "@/demos/kit/storage";
import { SLUG, seedAcademy, sessionId, type AcademyData, type Group, type Mark, type Note, type PayMethod, type Payment, type Session, type Student } from "./data";

/** Estado de la academia y sus acciones; cada pantalla recibe este objeto. */
export function useAcademy() {
  // Una sola siembra para todas las colecciones.
  const seedRef = useRef<AcademyData | null>(null);
  const seed = () => (seedRef.current ??= seedAcademy());

  const [groups, setGroups] = usePersistentState<Group[]>(SLUG, "grupos.v1", () => seed().groups);
  const [students, setStudents] = usePersistentState<Student[]>(SLUG, "estudiantes.v1", () => seed().students);
  const [sessions, setSessions] = usePersistentState<Session[]>(SLUG, "sesiones.v1", () => seed().sessions);
  const [notes, setNotes] = usePersistentState<Note[]>(SLUG, "notas.v1", () => seed().notes);
  const [payments, setPayments] = usePersistentState<Payment[]>(SLUG, "pagos.v1", () => seed().payments);
  const [comments, setComments] = usePersistentState<Record<string, string>>(SLUG, "comentarios.v1", () => ({}));

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
  }

  function saveStudent(student: Student) {
    setStudents((list) => (list.some((s) => s.id === student.id) ? list.map((s) => (s.id === student.id ? student : s)) : [...list, student]));
  }

  function deleteStudent(id: string) {
    setStudents((list) => list.filter((s) => s.id !== id));
    setPayments((list) => list.filter((p) => p.studentId !== id));
    setNotes((list) => list.filter((n) => n.studentId !== id));
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

  function pay(studentId: string, month: string, amount: number, paidAt: number, method: PayMethod) {
    setPayments((list) => [...list.filter((p) => !(p.studentId === studentId && p.month === month)), { id: uid("p"), studentId, month, amount, paidAt, method }]);
  }

  function undoPay(id: string) {
    setPayments((list) => list.filter((p) => p.id !== id));
  }

  function setComment(key: string, text: string) {
    setComments((map) => ({ ...map, [key]: text }));
  }

  return {
    groups,
    students,
    sessions,
    notes,
    payments,
    comments,
    saveGroup,
    deleteGroup,
    saveStudent,
    deleteStudent,
    setMarks,
    setModule,
    addNote,
    deleteNote,
    pay,
    undoPay,
    setComment,
  };
}

export type Academy = ReturnType<typeof useAcademy>;

/** Lo que recibe cada pantalla. */
export interface ScreenProps {
  academy: Academy;
  notify: (message: string) => void;
}
