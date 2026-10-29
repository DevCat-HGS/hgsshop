import { formatDateLong, formatMoney } from "@/demos/kit/format";
import { Btn } from "@/demos/kit/ui";
import { PAY_METHODS, amountInWords, formatDateYear, formatPhone, monthLabel, receiptLabel, type Payment } from "./data";
import { DocFooter, DocHeader, PRINT_CSS } from "./Document";
import type { Academy } from "./store";

/** Recibo de caja imprimible de una mensualidad, con los datos de la academia de Ajustes. */
export function ReceiptView({ academy, payment, onBack }: { academy: Academy; payment: Payment; onBack: () => void }) {
  const { settings } = academy;
  const student = academy.students.find((s) => s.id === payment.studentId);
  const group = student && academy.groups.find((g) => g.id === student.groupId);
  const number = receiptLabel(payment.receipt);
  const method = PAY_METHODS.find((m) => m.id === payment.method)?.label ?? payment.method;

  return (
    <div className="space-y-4">
      <style>{PRINT_CSS}</style>
      <div className="ra-no-print flex flex-wrap items-center justify-between gap-2">
        <Btn variant="ghost" onClick={onBack}>
          ← Volver a pagos
        </Btn>
        <Btn variant="primary" onClick={() => window.print()}>
          Imprimir recibo
        </Btn>
      </div>

      <article aria-label={`Recibo ${number}`} className="ra-doc mx-auto max-w-2xl space-y-5 rounded-lg border border-border bg-bg p-5 text-sm sm:p-8">
        <DocHeader settings={settings} kind="Recibo de caja">
          <div className="ra-box rounded-md border border-border-strong px-4 py-2 text-right">
            <p className="ra-muted text-[12px] text-text-muted">Número</p>
            <p className="text-lg font-semibold text-text tabular-nums">{number}</p>
          </div>
        </DocHeader>

        <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          <Row label="Fecha" value={formatDateYear(payment.paidAt)} />
          <Row label="Método de pago" value={method} />
          <Row label="Recibimos de" value={student?.guardian ?? "—"} />
          <Row label="Teléfono" value={student ? formatPhone(student.guardianPhone) : "—"} />
        </dl>

        <section aria-label="Concepto" className="ra-box rounded-md border border-border">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-2 text-[12px] font-semibold text-text-muted">
            <span className="ra-muted">Concepto</span>
            <span className="ra-muted">Valor</span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="font-semibold text-text">Mensualidad de {monthLabel(payment.month).toLowerCase()}</p>
              <p className="ra-muted text-text-muted">
                Estudiante: {student?.name ?? "—"}
                {group && ` · ${group.name}`}
              </p>
            </div>
            <p className="font-semibold text-text tabular-nums">{formatMoney(payment.amount)}</p>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border px-4 py-2">
            <span className="font-semibold text-text">Total recibido</span>
            <span className="text-lg font-semibold text-text tabular-nums">{formatMoney(payment.amount)}</span>
          </div>
        </section>

        <p className="text-text">
          <span className="ra-muted text-text-muted">Valor en letras: </span>
          {amountInWords(payment.amount)}.
        </p>

        <div className="grid gap-8 pt-8 sm:grid-cols-2">
          <p className="ra-muted border-t border-border-strong pt-1.5 text-[12px] text-text-muted">Recibido por: {settings.name}</p>
          <p className="ra-muted border-t border-border-strong pt-1.5 text-[12px] text-text-muted">Emitido el {formatDateLong(payment.paidAt)}</p>
        </div>

        <DocFooter settings={settings} extra={`Recibo ${number}.`} />
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border py-1">
      <dt className="ra-muted text-text-muted">{label}</dt>
      <dd className="text-right text-text">{value}</dd>
    </div>
  );
}
