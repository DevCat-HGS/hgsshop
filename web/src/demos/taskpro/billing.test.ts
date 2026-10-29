import { describe, expect, it } from "vitest";
import type { Bill, Project, Task, TimeEntry } from "./data";
import { billNumber, billTotal, buildTimeLines, defaultBillable, fixedBilled, formatHours, nextBillNumber, pendingEntriesFor, unbilledSummary } from "./billing";

const DAY = 86_400_000;
const base = new Date(2026, 9, 5).getTime();

function project(id: string, change: Partial<Project> = {}): Project {
  return { id, name: id, clientId: "c-1", color: "azul", status: "active", repo: "", createdAt: 0, billing: "hourly", hourlyRate: 100_000, fixedPrice: 0, ...change };
}

function entry(id: string, projectId: string, minutes: number, change: Partial<TimeEntry> = {}): TimeEntry {
  return { id, projectId, taskId: null, start: base, end: base + minutes * 60_000, note: "", billable: true, billId: null, ...change };
}

const task: Task = { id: "t-1", projectId: "p-a", title: "Carrito", description: "", status: "doing", priority: "high", tags: [], dueDate: null, subtasks: [], createdAt: 0, updatedAt: 0, completedAt: null };

describe("reglas de cobro", () => {
  it("numera las cuentas con consecutivo sin reutilizar números", () => {
    expect(billNumber(3)).toBe("CC-0003");
    expect(nextBillNumber([])).toBe(1);
    expect(nextBillNumber([{ number: 1 }, { number: 4 }] as Bill[])).toBe(5);
  });

  it("agrupa por proyecto y tarea y calcula horas × tarifa en pesos", () => {
    const projects = [project("p-a"), project("p-b", { hourlyRate: 150_000 })];
    const entries = [entry("e1", "p-a", 90, { taskId: "t-1" }), entry("e2", "p-a", 60, { taskId: "t-1", start: base + DAY, end: base + DAY + 3_600_000 }), entry("e3", "p-b", 20)];
    const { lines, included, skipped } = buildTimeLines(entries, projects, [task]);
    expect(lines.map((l) => [l.projectName, l.description, l.minutes, l.amount])).toEqual([
      ["p-a", "Carrito", 150, 250_000],
      ["p-b", "Otras actividades del proyecto", 20, 50_000],
    ]);
    expect(billTotal(lines)).toBe(300_000);
    expect(included).toHaveLength(3);
    expect(skipped).toHaveLength(0);
    expect(formatHours(150)).toBe("2,5 h");
  });

  it("deja fuera las horas de proyectos sin tarifa y avisa", () => {
    const { lines, skipped } = buildTimeLines([entry("e1", "p-a", 60)], [project("p-a", { billing: "fixed", hourlyRate: 0, fixedPrice: 1_000_000 })], []);
    expect(lines).toHaveLength(0);
    expect(skipped).toHaveLength(1);
  });

  it("no ofrece de nuevo horas ya cobradas ni las no facturables", () => {
    const projects = [project("p-a")];
    const entries = [entry("e1", "p-a", 60), entry("e2", "p-a", 60, { billId: "b-1" }), entry("e3", "p-a", 60, { billable: false })];
    expect(pendingEntriesFor(entries, projects, "c-1", base, base).map((e) => e.id)).toEqual(["e1"]);
    expect(pendingEntriesFor(entries, projects, "c-2", base, base)).toEqual([]);
    expect(unbilledSummary(entries, projects)).toEqual({ minutes: 60, value: 100_000, unpriced: 0 });
  });

  it("suma lo cobrado de un precio fijo sin contar las cuentas anuladas", () => {
    const line = (amount: number) => ({ id: "l", kind: "manual" as const, projectId: "p-a", projectName: "p-a", description: "", minutes: 0, rate: 0, amount });
    const bills = [
      { id: "b1", status: "paid", lines: [line(400_000)] },
      { id: "b2", status: "void", lines: [line(300_000)] },
      { id: "b3", status: "draft", lines: [line(100_000)] },
    ] as Bill[];
    expect(fixedBilled(bills, "p-a")).toBe(500_000);
    expect(fixedBilled(bills, "p-a", "b3")).toBe(400_000);
  });

  it("por defecto se cobran las horas de proyectos por hora", () => {
    expect(defaultBillable(project("p-a"))).toBe(true);
    expect(defaultBillable(project("p-a", { billing: "fixed", hourlyRate: 0 }))).toBe(false);
    expect(defaultBillable(project("p-a", { billing: "fixed", hourlyRate: 80_000 }))).toBe(true);
  });
});
