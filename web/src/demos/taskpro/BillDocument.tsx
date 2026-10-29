import { formatMoney } from "@/demos/kit/format";
import { docLabel, type Bill, type Client, type Issuer } from "./data";
import { billNumber, formatHours } from "./billing";
import { formatLongDate } from "./util";

/**
 * Cuenta de cobro lista para imprimir o guardar en PDF: emisor, cliente, detalle (horas × tarifa o conceptos),
 * total en COP, datos bancarios y el texto legal del pie. Los colores claros y el tamaño carta los pone `PrintStyle`.
 */
export function BillDocument({ bill, client, issuer }: { bill: Bill; client: Client | undefined; issuer: Issuer }) {
  const number = billNumber(bill.number);
  const groups: { projectName: string; lines: Bill["lines"] }[] = [];
  for (const line of bill.lines) {
    const last = groups[groups.length - 1];
    if (last && last.projectName === line.projectName) last.lines.push(line);
    else groups.push({ projectName: line.projectName, lines: [line] });
  }
  const totalMinutes = bill.lines.reduce((sum, l) => sum + l.minutes, 0);
  const stamp = bill.status === "draft" ? "Borrador" : bill.status === "void" ? "Anulada" : null;
  const accountType = issuer.accountType === "ahorros" ? "de ahorros" : "corriente";

  return (
    <article aria-label={`Cuenta de cobro ${number}`} className="tp-doc mx-auto w-full max-w-3xl rounded-lg border border-border bg-bg p-5 text-sm text-text sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="text-base font-semibold break-words">{issuer.name || "Configura tu nombre en Ajustes"}</p>
          <p className="tp-muted text-text-muted">{docLabel(issuer.docType, issuer.docNumber)}</p>
          <p className="tp-muted text-text-muted">{[issuer.city, issuer.phone, issuer.email].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl">Cuenta de cobro</p>
          <p className="font-semibold tabular-nums">No. {number}</p>
          {stamp && <p className="tp-stamp mt-1 inline-block rounded-sm border border-danger px-2 text-[12px] font-semibold tracking-wide text-danger uppercase">{stamp}</p>}
        </div>
      </header>

      <p className="mt-4">
        {issuer.city ? `${issuer.city}, ` : ""}
        {formatLongDate(bill.issuedAt)}
      </p>

      <section aria-label="Cliente" className="mt-4">
        <p className="font-semibold break-words">{client?.name ?? "Cliente eliminado"}</p>
        {client && <p className="tp-muted text-text-muted">{docLabel(client.docType, client.docNumber)}</p>}
        {client && (client.contact || client.city || client.email) && (
          <p className="tp-muted break-words text-text-muted">{[client.contact && `Atención: ${client.contact}`, client.email, client.city].filter(Boolean).join(" · ")}</p>
        )}
      </section>

      <section aria-label="Cobro" className="mt-5 flex flex-col gap-1.5 rounded-md border border-border p-4">
        <p className="tracking-wide uppercase">
          <span className="tp-muted text-text-muted">Debe a: </span>
          <span className="font-semibold">{issuer.name || "—"}</span>
          <span className="tp-muted text-text-muted"> · {docLabel(issuer.docType, issuer.docNumber)}</span>
        </p>
        <p className="tracking-wide uppercase">
          <span className="tp-muted text-text-muted">La suma de: </span>
          <span className="text-lg font-semibold tabular-nums">{formatMoney(bill.total)} COP</span>
        </p>
        <p>
          <span className="tp-muted text-text-muted">Por concepto de: </span>
          servicios profesionales de desarrollo de software prestados entre el {formatLongDate(bill.periodFrom)} y el{" "}
          {formatLongDate(bill.periodTo)}, según el siguiente detalle.
        </p>
      </section>

      <section aria-label="Detalle" className="mt-5">
        <h3 className="mb-2 font-semibold">Detalle</h3>
        <div className="tp-scroll overflow-x-auto">
          <table aria-label={`Detalle de ${number}`} className="w-full text-left text-[13px]" style={{ minWidth: "32rem" }}>
            <thead className="tp-muted text-text-muted">
              <tr className="border-b border-border">
                <th scope="col" className="py-1.5 pr-3 font-semibold">Concepto</th>
                <th scope="col" className="py-1.5 pr-3 text-right font-semibold">Horas</th>
                <th scope="col" className="py-1.5 pr-3 text-right font-semibold">Valor hora</th>
                <th scope="col" className="py-1.5 text-right font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group, gi) => (
                <GroupRows key={`${group.projectName}-${gi}`} name={group.projectName} lines={group.lines} />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border-strong">
                <th scope="row" className="py-2 pr-3 text-left font-semibold">
                  Total
                </th>
                <td className="py-2 pr-3 text-right tabular-nums">{totalMinutes ? formatHours(totalMinutes) : ""}</td>
                <td />
                <td className="py-2 text-right font-semibold tabular-nums">{formatMoney(bill.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {bill.notes && (
        <section aria-label="Observaciones" className="mt-4">
          <h3 className="mb-1 font-semibold">Observaciones</h3>
          <p className="whitespace-pre-wrap">{bill.notes}</p>
        </section>
      )}

      <section aria-label="Datos para el pago" className="mt-5">
        <h3 className="mb-1 font-semibold">Datos para el pago</h3>
        {issuer.bank && issuer.accountNumber ? (
          <p>
            Consignar o transferir a la cuenta {accountType} No. <span className="font-semibold tabular-nums">{issuer.accountNumber}</span> de {issuer.bank}, a nombre de{" "}
            {issuer.name} ({docLabel(issuer.docType, issuer.docNumber)}).
          </p>
        ) : (
          <p className="tp-muted text-text-muted">Sin datos bancarios. Agrégalos en Ajustes.</p>
        )}
        {bill.status === "paid" && bill.paidAt != null && <p className="mt-1 font-semibold">Pagada el {formatLongDate(bill.paidAt)}.</p>}
      </section>

      <section aria-label="Firma" className="mt-10 max-w-xs">
        <div className="border-t border-border-strong pt-1.5">
          <p className="font-semibold">{issuer.name}</p>
          <p className="tp-muted text-text-muted">{docLabel(issuer.docType, issuer.docNumber)}</p>
        </div>
      </section>

      {issuer.footer && <footer className="tp-muted mt-6 border-t border-border pt-3 text-[12px] text-text-subtle">{issuer.footer}</footer>}
    </article>
  );
}

function GroupRows({ name, lines }: { name: string; lines: Bill["lines"] }) {
  return (
    <>
      <tr>
        <th colSpan={4} scope="colgroup" className="pt-3 pb-1 text-left font-semibold">
          {name || "General"}
        </th>
      </tr>
      {lines.map((line) => (
        <tr key={line.id} className="border-b border-border align-top">
          <td className="py-1.5 pr-3">{line.description}</td>
          <td className="py-1.5 pr-3 text-right tabular-nums">{line.kind === "time" ? formatHours(line.minutes) : "—"}</td>
          <td className="py-1.5 pr-3 text-right tabular-nums">{line.kind === "time" ? formatMoney(line.rate) : "—"}</td>
          <td className="py-1.5 text-right tabular-nums">{formatMoney(line.amount)}</td>
        </tr>
      ))}
    </>
  );
}
