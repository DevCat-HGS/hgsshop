import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { formatDate, formatMoney, fromDateInput, startOfDay, toDateInput } from "@/demos/kit/format";
import { downloadCsv } from "@/demos/kit/csv";
import { uid } from "@/demos/kit/storage";
import { Btn, ConfirmButton, Dialog, Field, FormError, Pill, Stat, Table, inputClass } from "@/demos/kit/ui";
import { AlertTriangleIcon, ArrowRightIcon } from "@/components/icons";
import { BILL_STATUS, type Bill, type BillLine, type BillStatus, type Client, type Issuer, type Project, type Task, type TimeEntry } from "./data";
import { billNumber, billTotal, buildTimeLines, collectedThisMonth, fixedBilled, formatHours, minutesOf, monthStartOf, nextBillNumber, outstanding, pendingEntriesFor, unbilledSummary } from "./billing";
import { BillDocument } from "./BillDocument";
import { EmptyState, PrintStyle } from "./shared";
import { moneyInput, parseMoney } from "./util";

const NOT_E_INVOICE =
  "Una cuenta de cobro no es una factura electrónica: sirve a personas naturales no obligadas a facturar ante la DIAN. Si estás obligado a facturar, usa tu software de facturación electrónica.";

type StatusFilter = BillStatus | "all";

export function BillsView({
  clients,
  projects,
  tasks,
  entries,
  bills,
  issuer,
  now,
  setBills,
  setEntries,
  notify,
  selectedId,
  onSelect,
  createRequest,
  onCreateHandled,
  onGoSettings,
  onNewClient,
}: {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  entries: TimeEntry[];
  bills: Bill[];
  issuer: Issuer;
  now: number;
  setBills: Dispatch<SetStateAction<Bill[]>>;
  setEntries: Dispatch<SetStateAction<TimeEntry[]>>;
  notify: (message: string) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Pedido desde otra pantalla (Clientes, Hoy): abrir el diálogo de nueva cuenta con ese cliente. */
  createRequest: { clientId: string | null } | null;
  onCreateHandled: () => void;
  onGoSettings: () => void;
  onNewClient: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [creating, setCreating] = useState<{ clientId: string | null } | null>(null);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [paying, setPaying] = useState<Bill | null>(null);

  const [handled, setHandled] = useState<{ clientId: string | null } | null>(null);
  if (createRequest && createRequest !== handled) {
    setHandled(createRequest);
    setCreating(createRequest);
  }
  useEffect(() => {
    if (createRequest) onCreateHandled();
  }, [createRequest, onCreateHandled]);

  const byClient = new Map(clients.map((c) => [c.id, c]));
  const selected = selectedId ? bills.find((b) => b.id === selectedId) : undefined;
  const lastNumber = bills.reduce((max, b) => Math.max(max, b.number), 0);

  function create(draft: Omit<Bill, "createdAt">) {
    const bill: Bill = { ...draft, createdAt: Date.now() };
    const ids = new Set(bill.entryIds);
    setBills((list) => [...list, bill]);
    setEntries((list) => list.map((e) => (ids.has(e.id) ? { ...e, billId: bill.id } : e)));
    setCreating(null);
    onSelect(bill.id);
    notify(`Cuenta de cobro ${billNumber(bill.number)} creada como borrador`);
  }

  function update(id: string, change: Partial<Bill>) {
    setBills((list) => list.map((b) => (b.id === id ? { ...b, ...change } : b)));
  }

  function release(bill: Bill) {
    setEntries((list) => list.map((e) => (e.billId === bill.id ? { ...e, billId: null } : e)));
  }

  function voidBill(bill: Bill) {
    update(bill.id, { status: "void", voidedAt: Date.now() });
    release(bill);
    notify(`${billNumber(bill.number)} anulada; sus horas vuelven a estar por cobrar`);
  }

  function deleteDraft(bill: Bill) {
    setBills((list) => list.filter((b) => b.id !== bill.id));
    release(bill);
    onSelect(null);
    notify(`Borrador ${billNumber(bill.number)} eliminado`);
  }

  const pending = unbilledSummary(entries, projects);
  const owed = outstanding(bills);
  const collected = collectedThisMonth(bills, now);

  if (selected) {
    const client = byClient.get(selected.clientId);
    const number = billNumber(selected.number);
    return (
      <div className="flex flex-col gap-4">
        <PrintStyle />
        <div className="tp-no-print flex flex-col gap-3">
          <button type="button" onClick={() => onSelect(null)} className="flex items-center gap-1.5 self-start rounded-md py-1 text-sm text-brand hover:underline">
            <ArrowRightIcon className="size-4 rotate-180" aria-hidden="true" />
            Todas las cuentas de cobro
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-text tabular-nums">{number}</h3>
            <Pill tone={BILL_STATUS[selected.status].tone}>{BILL_STATUS[selected.status].label}</Pill>
            <span className="text-sm text-text-muted">{client?.name}</span>
          </div>
          <p className="text-[13px] text-text-muted">
            {selected.status === "draft" && "Borrador: revisa el detalle y márcala como enviada cuando se la mandes al cliente. Sus horas ya están reservadas."}
            {selected.status === "sent" && selected.sentAt != null && `Enviada el ${formatDate(selected.sentAt)}. Registra el pago cuando llegue a tu cuenta.`}
            {selected.status === "paid" && selected.paidAt != null && `Pagada el ${formatDate(selected.paidAt)}.`}
            {selected.status === "void" && selected.voidedAt != null && `Anulada el ${formatDate(selected.voidedAt)}. Sus horas volvieron a quedar por cobrar; el número no se reutiliza.`}
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.status === "draft" && (
              <>
                <Btn
                  variant="primary"
                  onClick={() => {
                    update(selected.id, { status: "sent", sentAt: Date.now() });
                    notify(`${number} marcada como enviada`);
                  }}
                >
                  Marcar como enviada
                </Btn>
                <Btn onClick={() => setEditing(selected)}>Editar borrador</Btn>
              </>
            )}
            {selected.status === "sent" && (
              <Btn variant="primary" onClick={() => setPaying(selected)}>
                Registrar pago
              </Btn>
            )}
            <Btn onClick={() => window.print()}>Imprimir</Btn>
            {(selected.status === "draft" || selected.status === "sent") && (
              <ConfirmButton
                label="Anular"
                size="md"
                ariaLabel={`Anular ${number}`}
                title={`Anular ${number}`}
                message="La cuenta queda anulada (el número no se reutiliza) y sus horas vuelven a estar por cobrar. No se puede deshacer."
                confirmLabel="Anular"
                onConfirm={() => voidBill(selected)}
              />
            )}
            {selected.status === "draft" && selected.number === lastNumber && (
              <ConfirmButton
                label="Eliminar borrador"
                size="md"
                title="Eliminar borrador"
                message={`Es la última cuenta, así que ${number} queda libre para la siguiente y no hay saltos en la numeración. Sus horas vuelven a estar por cobrar.`}
                onConfirm={() => deleteDraft(selected)}
              />
            )}
          </div>
          {(!issuer.name || !issuer.docNumber || !issuer.accountNumber) && (
            <p className="flex items-center gap-2 text-sm text-warning">
              <AlertTriangleIcon className="size-4 shrink-0" aria-hidden="true" />
              Faltan tus datos de emisor o bancarios.
              <button type="button" onClick={onGoSettings} className="text-brand hover:underline">
                Completar en Ajustes
              </button>
            </p>
          )}
        </div>
        <BillDocument bill={selected} client={client} issuer={issuer} />
        {editing && (
          <EditDraftDialog
            bill={editing}
            onClose={() => setEditing(null)}
            onSave={(change) => {
              update(editing.id, change);
              setEditing(null);
              notify("Borrador actualizado");
            }}
          />
        )}
        {paying && (
          <PaymentDialog
            bill={paying}
            onClose={() => setPaying(null)}
            onSave={(paidAt) => {
              update(paying.id, { status: "paid", paidAt });
              setPaying(null);
              notify(`${billNumber(paying.number)} pagada`);
            }}
          />
        )}
      </div>
    );
  }

  const listed = bills
    .filter((b) => (statusFilter === "all" || b.status === statusFilter) && (clientFilter === "all" || b.clientId === clientFilter))
    .sort((a, b) => b.number - a.number);

  function exportCsv() {
    downloadCsv(
      "taskpro-cuentas-de-cobro",
      ["Número", "Cliente", "Expedida", "Periodo", "Estado", "Total (COP)", "Fecha de pago"],
      listed.map((b) => [
        billNumber(b.number),
        byClient.get(b.clientId)?.name ?? "Cliente eliminado",
        toDateInput(b.issuedAt),
        `${toDateInput(b.periodFrom)} a ${toDateInput(b.periodTo)}`,
        BILL_STATUS[b.status].label,
        b.total,
        b.paidAt != null ? toDateInput(b.paidAt) : "",
      ]),
    );
  }

  const billable = clients.filter((c) => projects.some((p) => p.clientId === c.id));

  return (
    <div className="flex flex-col gap-5">
      <p className="flex gap-2 rounded-md border border-border bg-bg px-3 py-2.5 text-[13px] text-text-muted">
        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        {NOT_E_INVOICE}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Por cobrar" value={formatMoney(pending.value)} detail={`${formatHours(pending.minutes)} facturables sin cuenta`} />
        <Stat label="Enviadas sin pagar" value={formatMoney(owed.total)} detail={`${owed.count} ${owed.count === 1 ? "cuenta" : "cuentas"}`} tone={owed.count ? "warning" : undefined} />
        <Stat label="Cobrado este mes" value={formatMoney(collected)} detail={`Pagos desde el ${formatDate(monthStartOf(now))}`} tone={collected ? "success" : undefined} />
      </div>

      {bills.length === 0 ? (
        <EmptyState
          title="Aún no tienes cuentas de cobro"
          actions={
            billable.length ? (
              <Btn variant="primary" onClick={() => setCreating({ clientId: null })}>
                Nueva cuenta de cobro
              </Btn>
            ) : (
              <Btn variant="primary" onClick={onNewClient}>
                Nuevo cliente
              </Btn>
            )
          }
        >
          {billable.length
            ? "Crea la primera a partir de las horas facturables sin cobrar de un cliente, o con conceptos manuales para proyectos de precio fijo."
            : "Para cobrar necesitas un cliente con al menos un proyecto. Empieza por registrar el cliente."}
        </EmptyState>
      ) : (
        <section aria-label="Cuentas de cobro" className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="grid grid-cols-2 gap-3 sm:contents">
              <Field label="Estado" className="sm:w-40">
                {(id) => (
                  <select id={id} className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
                    <option value="all">Todos</option>
                    {(Object.keys(BILL_STATUS) as BillStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {BILL_STATUS[s].label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Cliente" className="sm:w-56">
                {(id) => (
                  <select id={id} className={inputClass} value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                    <option value="all">Todos</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Btn size="sm" onClick={exportCsv} disabled={listed.length === 0} aria-label="Exportar cuentas de cobro a CSV">
                Exportar CSV
              </Btn>
              <Btn variant="primary" onClick={() => setCreating({ clientId: clientFilter !== "all" ? clientFilter : null })} disabled={billable.length === 0}>
                Nueva cuenta de cobro
              </Btn>
            </div>
          </div>
          {listed.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-text-muted">Ninguna cuenta de cobro coincide con los filtros.</p>
          ) : (
            <Table label="Cuentas de cobro" head={["Número", "Cliente", "Expedida", "Periodo", "Total", "Estado", ""]} minWidth="44rem">
              {listed.map((b) => (
                <tr key={b.id}>
                  <th scope="row" className="font-semibold whitespace-nowrap text-text tabular-nums">
                    {billNumber(b.number)}
                  </th>
                  <td className="text-text">{byClient.get(b.clientId)?.name ?? "Cliente eliminado"}</td>
                  <td className="whitespace-nowrap text-text-muted tabular-nums">{formatDate(b.issuedAt)}</td>
                  <td className="whitespace-nowrap text-text-muted tabular-nums">
                    {formatDate(b.periodFrom)} – {formatDate(b.periodTo)}
                  </td>
                  <td className={`text-right whitespace-nowrap tabular-nums ${b.status === "void" ? "text-text-subtle line-through" : "font-semibold text-text"}`}>{formatMoney(b.total)}</td>
                  <td>
                    <Pill tone={BILL_STATUS[b.status].tone}>{BILL_STATUS[b.status].label}</Pill>
                  </td>
                  <td className="text-right">
                    <Btn variant="ghost" size="sm" onClick={() => onSelect(b.id)} aria-label={`Ver ${billNumber(b.number)}`}>
                      Ver
                    </Btn>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </section>
      )}

      {creating && (
        <NewBillDialog
          initialClientId={creating.clientId}
          clients={billable}
          projects={projects}
          tasks={tasks}
          entries={entries}
          bills={bills}
          onClose={() => setCreating(null)}
          onCreate={create}
        />
      )}
    </div>
  );
}

interface ManualDraft {
  id: string;
  projectId: string;
  description: string;
  amount: string;
}

function NewBillDialog({
  initialClientId,
  clients,
  projects,
  tasks,
  entries,
  bills,
  onClose,
  onCreate,
}: {
  initialClientId: string | null;
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  entries: TimeEntry[];
  bills: Bill[];
  onClose: () => void;
  /** La fecha de creación la pone quien guarda. */
  onCreate: (bill: Omit<Bill, "createdAt">) => void;
}) {
  const [today] = useState(() => startOfDay(Date.now()));
  const defaultFrom = (clientId: string) => {
    const pending = pendingEntriesFor(entries, projects, clientId, 0, today);
    return pending.length ? startOfDay(Math.min(...pending.map((e) => e.start))) : monthStartOf(today);
  };
  const firstClient = clients.find((c) => c.id === initialClientId)?.id ?? clients[0]?.id ?? "";
  const [clientId, setClientId] = useState(firstClient);
  const [issued, setIssued] = useState(toDateInput(today));
  const [from, setFrom] = useState(() => toDateInput(firstClient ? defaultFrom(firstClient) : today));
  const [to, setTo] = useState(toDateInput(today));
  const [includeTime, setIncludeTime] = useState(true);
  const [manual, setManual] = useState<ManualDraft[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const own = projects.filter((p) => p.clientId === clientId);
  const fixed = own.filter((p) => p.billing === "fixed");
  const fromMs = from ? fromDateInput(from) : NaN;
  const toMs = to ? fromDateInput(to) : NaN;
  const validRange = !Number.isNaN(fromMs) && !Number.isNaN(toMs) && fromMs <= toMs;
  const pending = validRange ? pendingEntriesFor(entries, projects, clientId, fromMs, toMs) : [];
  const { lines: timeLines, included, skipped } = buildTimeLines(pending, projects, tasks);
  const usedTime = includeTime ? timeLines : [];
  const manualTotal = manual.reduce((sum, m) => sum + (parseMoney(m.amount) ?? 0), 0);
  const total = billTotal(usedTime) + manualTotal;

  function changeClient(id: string) {
    setClientId(id);
    setFrom(toDateInput(defaultFrom(id)));
    setManual([]);
    setError("");
  }

  function addManual(project?: Project) {
    const balance = project ? Math.max(0, project.fixedPrice - fixedBilled(bills, project.id) - manual.filter((m) => m.projectId === project.id).reduce((s, m) => s + (parseMoney(m.amount) ?? 0), 0)) : 0;
    setManual((list) => [...list, { id: uid("bl"), projectId: project?.id ?? "", description: project ? (balance === project.fixedPrice ? "Desarrollo (precio fijo)" : "Saldo del desarrollo (precio fijo)") : "", amount: moneyInput(balance) }]);
  }

  function submit() {
    if (!clientId) return setError("Elige un cliente.");
    if (!issued) return setError("Indica la fecha de expedición.");
    if (!validRange) return setError("Revisa el periodo: la fecha inicial no puede ser posterior a la final.");
    const lines: BillLine[] = [...usedTime];
    for (const [i, m] of manual.entries()) {
      const description = m.description.trim();
      const amount = parseMoney(m.amount);
      if (!description) return setError(`Escribe la descripción del concepto ${i + 1}.`);
      if (amount == null) return setError(`El valor del concepto ${i + 1} debe ser un número entero de pesos mayor que cero.`);
      const project = own.find((p) => p.id === m.projectId);
      lines.push({ id: m.id, kind: "manual", projectId: project?.id ?? null, projectName: project?.name ?? "", description: description.slice(0, 160), minutes: 0, rate: 0, amount });
    }
    for (const project of fixed) {
      const inBill = lines.filter((l) => l.kind === "manual" && l.projectId === project.id).reduce((s, l) => s + l.amount, 0);
      const balance = project.fixedPrice - fixedBilled(bills, project.id);
      if (inBill > balance) return setError(`Los conceptos de "${project.name}" suman ${formatMoney(inBill)} y el saldo por cobrar del precio fijo es ${formatMoney(Math.max(0, balance))}.`);
    }
    if (lines.length === 0) return setError(includeTime ? "No hay horas facturables sin cobrar en ese periodo. Cambia el periodo o agrega un concepto." : "Agrega al menos un concepto o incluye las horas del periodo.");
    onCreate({
      id: uid("b"),
      number: nextBillNumber(bills),
      clientId,
      issuedAt: fromDateInput(issued),
      periodFrom: fromMs,
      periodTo: toMs,
      status: "draft",
      lines,
      total: billTotal(lines),
      notes: notes.trim(),
      entryIds: includeTime ? included.map((e) => e.id) : [],
      sentAt: null,
      paidAt: null,
      voidedAt: null,
    });
  }

  const groups = new Map<string, BillLine[]>();
  for (const line of timeLines) groups.set(line.projectName, [...(groups.get(line.projectName) ?? []), line]);
  const skippedMinutes = skipped.reduce((s, e) => s + minutesOf(e), 0);

  return (
    <Dialog open onClose={onClose} title={`Nueva cuenta de cobro ${billNumber(nextBillNumber(bills))}`} onSubmit={submit} submitLabel="Crear borrador" wide>
      <div className="flex flex-col gap-4 text-sm">
        <p className="text-[13px] text-text-muted">{NOT_E_INVOICE}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Cliente" className="sm:col-span-2">
            {(id) => (
              <select id={id} className={inputClass} value={clientId} onChange={(e) => changeClient(e.target.value)}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Desde">{(id) => <input id={id} type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />}</Field>
          <Field label="Hasta">{(id) => <input id={id} type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />}</Field>
          <Field label="Fecha de expedición">{(id) => <input id={id} type="date" className={inputClass} value={issued} onChange={(e) => setIssued(e.target.value)} />}</Field>
        </div>

        <section aria-label="Horas del periodo" className="flex flex-col gap-2 rounded-md border border-border bg-bg p-3">
          <label className="flex items-center gap-2 font-semibold text-text">
            <input type="checkbox" className="size-4 accent-[var(--color-brand)]" checked={includeTime} onChange={(e) => setIncludeTime(e.target.checked)} />
            Incluir las horas facturables sin cobrar del periodo
          </label>
          {!validRange ? (
            <p className="text-text-muted">Elige un periodo válido para ver las horas.</p>
          ) : timeLines.length === 0 ? (
            <p className="text-text-muted">No hay horas facturables sin cobrar de este cliente en el periodo.</p>
          ) : (
            <div className={`overflow-x-auto ${includeTime ? "" : "opacity-50"}`}>
              <table aria-label="Vista previa de horas" className="w-full text-left text-[13px]" style={{ minWidth: "28rem" }}>
                <thead className="text-text-muted">
                  <tr>
                    <th scope="col" className="py-1 pr-2 font-semibold">Proyecto y tarea</th>
                    <th scope="col" className="py-1 pr-2 text-right font-semibold">Horas</th>
                    <th scope="col" className="py-1 pr-2 text-right font-semibold">Tarifa</th>
                    <th scope="col" className="py-1 text-right font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {[...groups.entries()].map(([projectName, lines]) => (
                    <PreviewGroup key={projectName} name={projectName} lines={lines} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {skipped.length > 0 && (
            <p className="text-[13px] text-warning">
              {formatHours(skippedMinutes)} de proyectos sin tarifa por hora no se incluyen. Define la tarifa en Proyectos para cobrarlas.
            </p>
          )}
        </section>

        <section aria-label="Conceptos manuales" className="flex flex-col gap-2 rounded-md border border-border bg-bg p-3">
          <h3 className="font-semibold text-text">Conceptos manuales</h3>
          {fixed.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {fixed.map((p) => {
                const billed = fixedBilled(bills, p.id);
                return (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-text-muted">
                    <span>
                      <span className="font-semibold text-text">{p.name}</span>: precio fijo {formatMoney(p.fixedPrice)}, cobrado {formatMoney(billed)}, saldo{" "}
                      <span className="text-text tabular-nums">{formatMoney(Math.max(0, p.fixedPrice - billed))}</span>
                    </span>
                    <Btn size="sm" onClick={() => addManual(p)} aria-label={`Agregar concepto de "${p.name}"`}>
                      Agregar concepto
                    </Btn>
                  </li>
                );
              })}
            </ul>
          )}
          {manual.map((m, i) => (
            <fieldset key={m.id} className="grid grid-cols-1 gap-2 rounded-md border border-border p-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_8rem_auto] sm:items-end">
              <legend className="sr-only">Concepto {i + 1}</legend>
              <Field label={`Proyecto del concepto ${i + 1}`}>
                {(id) => (
                  <select id={id} className={inputClass} value={m.projectId} onChange={(e) => setManual((list) => list.map((x) => (x.id === m.id ? { ...x, projectId: e.target.value } : x)))}>
                    <option value="">General</option>
                    {own.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label={`Descripción del concepto ${i + 1}`}>
                {(id) => <input id={id} className={inputClass} value={m.description} maxLength={160} onChange={(e) => setManual((list) => list.map((x) => (x.id === m.id ? { ...x, description: e.target.value } : x)))} />}
              </Field>
              <Field label={`Valor del concepto ${i + 1}`}>
                {(id) => <input id={id} inputMode="numeric" className={inputClass} value={m.amount} placeholder="0" onChange={(e) => setManual((list) => list.map((x) => (x.id === m.id ? { ...x, amount: e.target.value } : x)))} />}
              </Field>
              <Btn variant="ghost" size="sm" onClick={() => setManual((list) => list.filter((x) => x.id !== m.id))} aria-label={`Quitar concepto ${i + 1}`} className="justify-self-start sm:mb-1.5">
                Quitar
              </Btn>
            </fieldset>
          ))}
          <Btn size="sm" className="self-start" onClick={() => addManual()}>
            Agregar concepto libre
          </Btn>
        </section>

        <Field label="Observaciones" hint="Opcional. Salen en el documento.">
          {(id) => <textarea id={id} className={`${inputClass} min-h-16`} value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />}
        </Field>

        <p className="flex items-baseline justify-between gap-3 border-t border-border pt-3 text-base">
          <span className="font-semibold text-text">Total</span>
          <span className="font-semibold text-text tabular-nums" aria-live="polite">
            {formatMoney(total)} COP
          </span>
        </p>
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}

function PreviewGroup({ name, lines }: { name: string; lines: BillLine[] }) {
  const subtotal = billTotal(lines);
  return (
    <>
      <tr className="border-t border-border">
        <th scope="colgroup" colSpan={3} className="pt-2 pb-0.5 text-left font-semibold text-text">
          {name}
        </th>
        <td className="pt-2 pb-0.5 text-right font-semibold text-text tabular-nums">{formatMoney(subtotal)}</td>
      </tr>
      {lines.map((l) => (
        <tr key={l.id} className="text-text-muted">
          <td className="py-0.5 pr-2 pl-3">{l.description}</td>
          <td className="py-0.5 pr-2 text-right tabular-nums">{formatHours(l.minutes)}</td>
          <td className="py-0.5 pr-2 text-right tabular-nums">{formatMoney(l.rate)}</td>
          <td className="py-0.5 text-right tabular-nums">{formatMoney(l.amount)}</td>
        </tr>
      ))}
    </>
  );
}

function EditDraftDialog({ bill, onClose, onSave }: { bill: Bill; onClose: () => void; onSave: (change: Partial<Bill>) => void }) {
  const [issued, setIssued] = useState(toDateInput(bill.issuedAt));
  const [descriptions, setDescriptions] = useState(() => Object.fromEntries(bill.lines.map((l) => [l.id, l.description])));
  const [notes, setNotes] = useState(bill.notes);
  const [error, setError] = useState("");

  function submit() {
    if (!issued) return setError("Indica la fecha de expedición.");
    const empty = bill.lines.findIndex((l) => !descriptions[l.id]?.trim());
    if (empty >= 0) return setError(`Escribe la descripción de la línea ${empty + 1}.`);
    onSave({ issuedAt: fromDateInput(issued), notes: notes.trim(), lines: bill.lines.map((l) => ({ ...l, description: descriptions[l.id].trim().slice(0, 160) })) });
  }

  return (
    <Dialog open onClose={onClose} title={`Editar borrador ${billNumber(bill.number)}`} onSubmit={submit} wide>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-text-muted">Las horas y los valores salen del registro de tiempo y de las tarifas. Para cambiarlos, elimina o anula el borrador y créalo de nuevo.</p>
        <Field label="Fecha de expedición" className="sm:w-56">
          {(id) => <input id={id} type="date" className={inputClass} value={issued} onChange={(e) => setIssued(e.target.value)} />}
        </Field>
        {bill.lines.map((l, i) => (
          <Field key={l.id} label={`Línea ${i + 1}${l.projectName ? ` (${l.projectName})` : ""} · ${formatMoney(l.amount)}`}>
            {(id) => <input id={id} className={inputClass} value={descriptions[l.id] ?? ""} maxLength={160} onChange={(e) => setDescriptions((d) => ({ ...d, [l.id]: e.target.value }))} />}
          </Field>
        ))}
        <Field label="Observaciones">{(id) => <textarea id={id} className={`${inputClass} min-h-16`} value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />}</Field>
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}

function PaymentDialog({ bill, onClose, onSave }: { bill: Bill; onClose: () => void; onSave: (paidAt: number) => void }) {
  const [today] = useState(() => toDateInput(Date.now()));
  const [date, setDate] = useState(today);
  const [error, setError] = useState("");

  function submit() {
    if (!date) return setError("Indica la fecha de pago.");
    const paid = fromDateInput(date);
    if (paid > fromDateInput(today)) return setError("La fecha de pago no puede ser futura.");
    if (paid < startOfDay(bill.issuedAt)) return setError(`La fecha de pago no puede ser anterior a la expedición (${formatDate(bill.issuedAt)}).`);
    onSave(paid + 12 * 3_600_000);
  }

  return (
    <Dialog open onClose={onClose} title={`Registrar pago de ${billNumber(bill.number)}`} onSubmit={submit} submitLabel="Registrar pago">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text">
          Total: <span className="font-semibold tabular-nums">{formatMoney(bill.total)} COP</span>
        </p>
        <Field label="Fecha de pago">{(id) => <input id={id} type="date" className={inputClass} value={date} max={today} onChange={(e) => setDate(e.target.value)} />}</Field>
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}
