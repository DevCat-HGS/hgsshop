import type { Product } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { StatusBoard } from "@/components/home/StatusBoard";
import { Slide } from "@/components/home/Slide";
import { ArrowRightIcon } from "@/components/icons";

/** Asomo del fotograma anterior de la tira: el final de una solicitud ya recibida. */
function PreviousSliver() {
  return (
    <div data-ui aria-hidden="true" className="flex h-[60px] items-end overflow-hidden">
      <div className="w-full rounded-b-[6px] border border-t-0 border-border-strong bg-bg px-4 pb-3 pt-8 text-[13px] text-success">
        Solicitud recibida · te respondo en uno o dos días hábiles
      </div>
    </div>
  );
}

/** Asomo del fotograma siguiente: el comienzo del tablero de DevPanel. */
function NextSliver() {
  return (
    <div data-ui aria-hidden="true" className="h-[60px] overflow-hidden">
      <div className="rounded-t-[6px] border border-b-0 border-border-strong bg-bg px-4 pt-3 text-[13px]">
        <div className="flex justify-between text-text-muted">
          <span className="font-semibold text-text">DevPanel · tablero</span>
          <span>1 de 5 tareas hechas</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-hover">
          <div className="h-full w-1/5 bg-brand" />
        </div>
      </div>
    </div>
  );
}

/**
 * S1 · Portada. Dirección "product-performs", héroe "frase partida por un marco": la frase se abre a
 * los dos bordes y en el centro, un fragmento real de la plataforma (el estado del catálogo, con datos
 * reales y navegable) dentro de una tira que asoma el fotograma anterior y el siguiente.
 */
export function Portada({ products }: { products: Product[] }) {
  return (
    <Slide id="portada" labelledBy="portada-titulo" className="!justify-between !py-0">
      <Container className="relative flex flex-1 flex-col justify-center py-10 lg:py-0">
        <h1
          id="portada-titulo"
          className="font-display flex flex-col text-[11vw] text-text lg:flex-row lg:items-center lg:justify-between lg:text-[clamp(2.5rem,3.6vw,4rem)]"
        >
          <span>Software que se</span>
          <span className="self-end lg:self-auto">puede probar</span>
        </h1>

        <div className="mt-8 lg:absolute lg:left-1/2 lg:top-1/2 lg:mt-0 lg:w-[35vw] lg:-translate-x-1/2 lg:-translate-y-1/2">
          <div className="hidden lg:block">
            <PreviousSliver />
          </div>
          <div className="aspect-[4/3] lg:my-6 lg:aspect-video">
            <StatusBoard products={products} compact />
          </div>
          <div className="hidden lg:block">
            <NextSliver />
          </div>
        </div>
      </Container>

      <Container className="flex flex-col gap-6 pb-12 sm:flex-row sm:items-end sm:justify-between lg:pb-16">
        <p className="max-w-md text-lg text-pretty text-text">
          Aplicaciones para negocios, cada una con su etapa real. Las que tienen demo se usan aquí mismo; las demás, te
          las muestro o las construimos a tu medida.
        </p>
        <Button to="/productos" size="lg" className="self-start sm:self-auto">
          Ver los {products.length || 5} productos
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Button>
      </Container>
    </Slide>
  );
}
