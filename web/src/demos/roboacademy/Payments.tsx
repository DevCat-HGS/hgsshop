import { useState } from "react";
import { downloadCsv } from "@/demos/kit/csv";
import { formatDate, formatMoney, fromDateInput, matches, toDateInput } from "@/demos/kit/format";
import { Btn, Dialog, Empty, Field, FormError, Pill, SearchField, Stat, Table, inputClass } from "@/demos/kit/ui";
import { PAY_METHODS, billedStudents, monthKey, monthLabel, monthStart, shiftMonth, type PayMethod, type Student, todayStart, nowMs } from "./data";
import { GroupSelect } from "./shared";
import type { ScreenProps } from "./store";

export function Payments({ academy, notify }: ScreenProps) {
  const { groups, students, payments } = academy;
  const current = monthKey(nowMs());
  const months = [0, -1, -2, -3, -4, -5].map((d) => shiftMonth(current, d));
  const [month, setMonth] = useState(current);
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [paying, setPaying] = useState<Student | null>(null);

  const feeOf = (gid: string) => groups.find((g) => g.id === gid)?.fee ?? 0;
  const billed = billedStudents(students, payments, month);
  const paymentOf = (id: string) => payments.find((p) => p.studentId === id && p.month === month);
  const rows = billed.map((s) => ({ student: s, payment: paymentOf(s.id), fee: paymentOf(s.id)?.amount ?? feeOf(s.groupId) }));
  const expected = rows.reduce((sum, r) => sum + r.fee, 0);
  const collected = rows.reduce((sum, r) => sum + (r.payment?.amount ?? 0), 0);
  const pendingCount = rows.filter((r) => !r.payment).length;

  const visible = rows
    .filter((r) => (!onlyPending || !r.payment) && (!groupId || r.student.groupId === groupId))
    .filter((r) => !query || matches(`${r.student.name} ${r.student.guardian}`, query))
    .sort((a, b) => Number(Boolean(a.payment)) - Number(Boolean(b.payment)) || a.student.name.localeCompare(b.student.name, "es"));

  function exportCsv() {
    downloadCsv(
      "roboacademy-pagos",
      ["Estudiante", "Grupo", "Mes", "Valor (COP)", "Estado", "Fecha de pago", "Método"],
      visible.map(({ student, payment, fee }) => [
        student.status === "retirado" ? `${student.name} (retirado)` : student.name,
        groups.find((g) => g.id === student.groupId)?.name ?? "Sin grupo",
        monthLabel(month),
        Math.round(fee),
        payment ? "Pagado" : "Pendiente",
        payment ? formatDate(payment.paidAt) : "",
        payment ? (PAY_METHODS.find((m) => m.id === payment.method)?.label ?? "") : "",
      ]),
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Recaudado" value={formatMoney(collected)} tone="success" />
        <Stat label="Esperado" value={formatMoney(expected)} detail={`${rows.length} mensualidades`} />
        <Stat label="Pendiente" value={formatMoney(expected - collected)} detail={`${pendingCount} estudiantes`} tone={pendingCount ? "warning" : "success"} />
        <Stat label="Cumplimiento" value={expected ? `${Math.round((collected / expected) * 100)} %` : "—"} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Field label="Mes">
            {(id) => (
              <select id={id} value={month} onChange={(e) => setMonth(e.target.value)} className={inputClass}>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Grupo">{(id) => <GroupSelect id={id} groups={groups} value={groupId} onChange={setGroupId} allLabel="Todos los grupos" />}</Field>
        </div>
        <SearchField value={query} onChange={setQuery} label="Buscar en pagos" placeholder="Estudiante o acudiente" />
        <label className="flex items-center gap-2 pb-2 text-sm text-text">
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
          Solo pendientes
        </label>
        <Btn size="sm" className="sm:ml-auto sm:mb-1" aria-label="Exportar pagos a CSV" onClick={exportCsv} disabled={visible.length === 0}>
          Exportar CSV
        </Btn>
      </div>

      {visible.length === 0 ? (
        <Empty>{onlyPending ? `No hay mensualidades pendientes en ${monthLabel(month).toLowerCase()}.` : "Ningún estudiante coincide con los filtros."}</Empty>
      ) : (
        <Table label={`Mensualidades de ${monthLabel(month)}`} head={["Estudiante", "Grupo", "Mensualidad", "Estado", "Acción"]} minWidth="44rem">
          {visible.map(({ student, payment, fee }) => (
            <tr key={student.id}>
              <th scope="row" className="font-semibold text-text">
                {student.name}
                {student.status === "retirado" && <span className="ml-2 text-[12px] font-normal text-text-subtle">retirado</span>}
              </th>
              <td className="text-text-muted">{groups.find((g) => g.id === student.groupId)?.name}</td>
              <td className="tabular-nums">{formatMoney(fee)}</td>
              <td>
                {payment ? (
                  <Pill tone="success">
                    Pagado {formatDate(payment.paidAt)} · {PAY_METHODS.find((m) => m.id === payment.method)?.label}
                  </Pill>
                ) : (
                  <Pill tone="warning">Pendiente</Pill>
                )}
              </td>
              <td>
                {payment ? (
                  <Btn
                    size="sm"
                    variant="ghost"
                    aria-label={`Deshacer pago de ${student.name}`}
                    onClick={() => {
                      academy.undoPay(payment.id);
                      notify(`Pago de ${student.name} deshecho`);
                    }}
                  >
                    Deshacer
                  </Btn>
                ) : (
                  <Btn size="sm" aria-label={`Registrar pago de ${student.name}`} onClick={() => setPaying(student)}>
                    Marcar pagado
                  </Btn>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {paying && (
        <PayDialog
          key={paying.id}
          student={paying}
          month={month}
          fee={feeOf(paying.groupId)}
          onClose={() => setPaying(null)}
          onSave={(amount, paidAt, method) => {
            academy.pay(paying.id, month, amount, paidAt, method);
            notify(`Pago de ${paying.name} registrado`);
            setPaying(null);
          }}
        />
      )}
    </div>
  );
}

function PayDialog({
  student,
  month,
  fee,
  onClose,
  onSave,
}: {
  student: Student;
  month: string;
  fee: number;
  onClose: () => void;
  onSave: (amount: number, paidAt: number, method: PayMethod) => void;
}) {
  const today = todayStart();
  // Para meses pasados se propone el día 5 de ese mes; para el actual, hoy.
  const suggested = monthKey(today) === month ? today : monthStart(month) + 4 * 86_400_000;
  const [date, setDate] = useState(toDateInput(suggested));
  const [method, setMethod] = useState<PayMethod>("nequi");
  const [amount, setAmount] = useState(String(fee));
  const [error, setError] = useState("");

  function submit() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setError("El valor debe ser mayor que cero.");
    if (!date) return setError("Indica la fecha del pago.");
    if (fromDateInput(date) > today) return setError("La fecha del pago no puede ser futura.");
    onSave(Math.round(value), fromDateInput(date) + 10 * 3_600_000, method);
  }

  return (
    <Dialog open onClose={onClose} title={`Pago de ${student.name}`} onSubmit={submit} submitLabel="Registrar pago">
      <p className="mb-4 text-sm text-text-muted">Mensualidad de {monthLabel(month).toLowerCase()}.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fecha del pago">
          {(id) => <input id={id} type="date" value={date} max={toDateInput(today)} onChange={(e) => setDate(e.target.value)} className={inputClass} />}
        </Field>
        <Field label="Método">
          {(id) => (
            <select id={id} value={method} onChange={(e) => setMethod(e.target.value as PayMethod)} className={inputClass}>
              {PAY_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Valor (COP)" hint={`Mensualidad del grupo: ${formatMoney(fee)}`} className="sm:col-span-2">
          {(id) => <input id={id} type="number" min={0} step={1000} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />}
        </Field>
      </div>
      <div className="mt-4">
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}
