import { Button } from "@/components/ui/Button";
import { ProductIcon } from "@/components/product/ProductIcon";
import { Slide } from "@/components/home/Slide";
import { ArrowRightIcon } from "@/components/icons";

/**
 * S7 · A medida. "La placa de acción": una fila de tres placas como recortada de un tablero más largo.
 * La central, en Ice Blue, lleva la única acción; las de los lados se salen de la pantalla: el isotipo
 * de FlowAuto (las automatizaciones a medida) y un campo plano.
 */
export function AMedida() {
  return (
    <Slide id="a-medida" labelledBy="a-medida-titulo">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_4fr_1fr]">
        <div data-reveal className="col-span-2 flex min-h-[19rem] flex-col justify-center gap-6 rounded-sm bg-brand px-8 py-10 text-brand-contrast sm:px-12 lg:order-2 lg:col-span-1 lg:min-h-[22.5rem]">
          <h2 id="a-medida-titulo" className="font-display max-w-2xl text-[clamp(2rem,3.4vw,3.25rem)]">
            ¿Tu caso no está en el catálogo?
          </h2>
          <p className="max-w-xl text-lg text-pretty">
            Aplicaciones, automatizaciones e integraciones a partir de tu problema real. Primero entiendo el alcance;
            después hablamos de precio y fechas.
          </p>
          <Button to="/desarrollo-a-medida" variant="ink" size="lg" className="self-start">
            Contar mi proyecto
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Placas laterales: sin texto, cortadas por los bordes de la pantalla. */}
        <div aria-hidden="true" data-reveal className="h-32 overflow-hidden rounded-sm lg:order-1 lg:h-auto lg:rounded-l-none">
          <ProductIcon slug="flowauto" status="quote_required" size={72} className="size-full" />
        </div>
        <div aria-hidden="true" data-reveal className="h-32 rounded-sm bg-depth lg:order-3 lg:h-auto lg:rounded-r-none" />
      </div>
    </Slide>
  );
}
