import { CheckIcon, SearchIcon } from "@/components/icons";

/*
 * Fotogramas de la tira de S1. Son fragmentos de interfaz de la plataforma con contenido real de sus
 * pantallas (los textos de los formularios, el tablero de TaskPro de la demo). Solo el tablero de estado
 * es navegable; estos acompañan a la frase y se ocultan a los lectores de pantalla para no duplicar
 * contenido que existe en su página.
 */

const frame = "flex size-full flex-col overflow-hidden rounded-[6px] border border-border-strong bg-bg text-left text-[13px]";

export function SearchFrame() {
  return (
    <div data-ui aria-hidden="true" className={frame}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-[15px] text-text">
        <SearchIcon className="size-4 text-text-muted" />
        inventario para mi tienda
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 px-4 text-text-muted">
        <span className="font-semibold text-text">StockFlow</span>
        Inventario y pedidos para negocios con stock físico.
      </div>
    </div>
  );
}

export function QuoteFrame() {
  return (
    <div data-ui aria-hidden="true" className={frame}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="font-semibold text-text">Solicitar cotización</span>
        <span className="text-text-muted">Producto: StockFlow</span>
      </div>
      <div className="grid flex-1 grid-cols-2 content-center gap-3 px-4">
        <div className="col-span-2">
          <p className="text-text-muted">¿Qué problema quieres resolver?</p>
          <p className="mt-1 rounded-[4px] border border-border-strong px-2.5 py-2 text-text">
            Llevamos el inventario en Excel y siempre se nos acaba algo sin avisar.
          </p>
        </div>
        <div>
          <p className="text-text-muted">Presupuesto orientativo</p>
          <p className="mt-1 rounded-[4px] border border-border-strong px-2.5 py-2 text-text">Entre 500 y 2.000 USD</p>
        </div>
        <div className="flex items-end">
          <span className="w-full rounded-[4px] bg-brand px-3 py-2 text-center font-semibold text-brand-contrast">Enviar solicitud</span>
        </div>
      </div>
    </div>
  );
}

const devTasks = [
  { title: "Pantalla de carrito en móvil", column: "En progreso" },
  { title: "Login con correo", column: "En progreso" },
  { title: "Definir modelo de datos", column: "Hecho" },
];

export function TaskProFrame() {
  return (
    <div data-ui aria-hidden="true" className={frame}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="font-semibold text-text">TaskPro · tablero</span>
        <span className="text-text-muted">1 de 5 tareas hechas</span>
      </div>
      <div className="grid flex-1 grid-cols-3 gap-2 p-3">
        {["Pendiente", "En progreso", "Hecho"].map((column) => (
          <div key={column} className="flex flex-col gap-1.5 rounded-[4px] bg-surface p-2">
            <span className="font-semibold text-text-muted">{column}</span>
            {devTasks
              .filter((task) => task.column === column)
              .map((task) => (
                <span key={task.title} className={`rounded-[4px] bg-bg px-2 py-1.5 ${column === "Hecho" ? "text-text-muted line-through" : "text-text"}`}>
                  {task.title}
                </span>
              ))}
            {column === "Pendiente" && <span className="rounded-[4px] bg-bg px-2 py-1.5 text-text">Webhook de pagos</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReceivedFrame() {
  return (
    <div data-ui aria-hidden="true" className={frame}>
      <div className="flex items-start gap-3 px-4 pt-5 text-[15px] text-success">
        <CheckIcon className="size-5 shrink-0" />
        Recibí tu solicitud. La reviso personalmente y te respondo en uno o dos días hábiles.
      </div>
    </div>
  );
}
