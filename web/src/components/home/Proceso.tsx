import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Slide } from "@/components/home/Slide";
import { CheckIcon } from "@/components/icons";

function Exchange({ step, call, children }: { step: string; call: string; children: ReactNode }) {
  return (
    <li data-reveal className="flex flex-col gap-4">
      <p className="text-xl font-semibold text-pretty text-text">{step}</p>
      <p className="rounded-sm bg-surface px-5 py-4 text-lg text-text">“{call}”</p>
      <div className="pl-6 sm:pl-10 lg:pl-6">{children}</div>
    </li>
  );
}

function SampleLabel() {
  return <span className="rounded-sm bg-warning-muted px-1.5 py-0.5 text-[13px] font-semibold text-warning">Ejemplo</span>;
}

/**
 * S6 · Proceso. "Pregunta y respuesta": cada paso muestra lo que escribes tú y lo que vuelve. En
 * escritorio los tres pasos van en columnas para que la sección quepa en una sola diapositiva.
 * La primera respuesta es el mensaje real del formulario; las otras dos son ejemplos y lo dicen.
 */
export function Proceso() {
  return (
    <Slide id="proceso" labelledBy="proceso-titulo">
      <Container className="flex flex-col gap-12">
        <div className="grid gap-4 lg:grid-cols-2 lg:items-end">
          <h2 id="proceso-titulo" data-reveal className="font-display text-[length:var(--text-step-head)] text-text">
            Cómo trabajamos
          </h2>
          <p className="max-w-lg text-lg text-pretty text-text lg:justify-self-end">Sin carritos ni pagos sorpresa: todo empieza con tu caso.</p>
        </div>

        <ol className="grid gap-12 lg:grid-cols-3 lg:gap-8">
          <Exchange step="Primero, me cuentas el problema." call="Llevamos el inventario en Excel y siempre se nos acaba algo sin avisar.">
            <p data-ui className="flex items-start gap-3 rounded-[6px] border border-success/30 bg-success-muted px-4 py-3 text-[15px] text-success">
              <CheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Recibí tu solicitud. La reviso personalmente y te respondo en uno o dos días hábiles.
            </p>
          </Exchange>

          <Exchange step="Después, te propongo un alcance." call="¿Se puede conectar con la tienda en línea que ya tengo?">
            <div data-ui className="rounded-[6px] border border-border-strong bg-bg text-[14px]">
              <div /* taste-skill-ignore: dentro de un fragmento data-ui */ className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <span className="font-semibold text-text">Propuesta</span>
                <SampleLabel />
              </div>
              <ul /* taste-skill-ignore: dentro de un fragmento data-ui */ className="divide-y divide-border">
                <li className="flex justify-between gap-4 px-4 py-2.5 text-text">
                  <span>Fase 1 · Inventario y alertas de stock mínimo</span>
                </li>
                <li className="flex justify-between gap-4 px-4 py-2.5 text-text">
                  <span>Fase 2 · Conexión con tu tienda en línea</span>
                </li>
                <li className="px-4 py-2.5 text-text-muted">Plazo y costo: se fijan al cerrar el alcance contigo.</li>
              </ul>
            </div>
          </Exchange>

          <Exchange step="Y lo construimos por entregas que puedes revisar." call="¿Cuándo puedo ver algo funcionando?">
            <div data-ui className="overflow-hidden rounded-[6px] border border-border-strong bg-bg text-[14px]">
              <div /* taste-skill-ignore: dentro de un fragmento data-ui */ className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <span className="font-semibold text-text">Entregas</span>
                <SampleLabel />
              </div>
              <table className="w-full text-left">
                <thead className="text-[13px] text-text-muted">
                  <tr /* taste-skill-ignore: dentro de un fragmento data-ui */ className="border-b border-border">
                    <th className="px-4 py-2 font-semibold">Entrega</th>
                    <th className="px-4 py-2 font-semibold">Qué incluye</th>
                    <th className="px-4 py-2 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr /* taste-skill-ignore: dentro de un fragmento data-ui */ className="border-b border-border">
                    <td className="px-4 py-2.5 text-text">1</td>
                    <td className="px-4 py-2.5 text-text">Registro de entradas y salidas</td>
                    <td className="px-4 py-2.5 text-success">Revisada por ti</td>
                  </tr>
                  <tr /* taste-skill-ignore: dentro de un fragmento data-ui */ className="border-b border-border bg-surface">
                    <td className="px-4 py-2.5 text-text">2</td>
                    <td className="px-4 py-2.5 text-text">Alertas de stock mínimo</td>
                    <td className="px-4 py-2.5 text-warning">Lista para revisar</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-text">3</td>
                    <td className="px-4 py-2.5 text-text">Conexión con la tienda en línea</td>
                    <td className="px-4 py-2.5 text-text-muted">Pendiente</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Exchange>
        </ol>
      </Container>
    </Slide>
  );
}
