import { deliveries } from "@/data/deliveries";
import { site } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { Slide } from "@/components/home/Slide";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

/**
 * S7 · Entregados. Antes de pedir que alguien cuente su proyecto, lo que ya está funcionando para otros
 * negocios: nombre, qué hace y en qué quedó, con enlace al sitio cuando es público. Sin capturas: el
 * sitio en vivo es la prueba. El resto del recorrido profesional vive en el portafolio.
 */
export function Entregados() {
  return (
    <Slide id="entregados" tone="surface" labelledBy="entregados-titulo">
      <Container className="flex flex-col gap-12">
        <div className="grid gap-4 lg:grid-cols-2 lg:items-end">
          <h2 id="entregados-titulo" data-reveal className="font-display text-[length:var(--text-step-head)] text-text">
            Ya está funcionando para otros
          </h2>
          <p data-reveal className="max-w-lg text-lg text-pretty text-text lg:justify-self-end">
            Software entregado a comercios, talleres e instituciones antes de este catálogo. Los que son públicos se
            pueden visitar.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {deliveries.map((work) => (
            <li key={work.name} data-reveal className="flex flex-col gap-3 rounded-sm bg-bg/50 p-6 sm:p-7">
              <p className="text-[15px] text-text-muted">{work.tag}</p>
              <h3 className="font-display text-3xl text-text">{work.name}</h3>
              <p className="text-base text-pretty text-text">{work.summary}</p>
              <p className="flex items-start gap-2 text-[15px] font-semibold text-text">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                {work.result}
              </p>
              <div className="mt-auto pt-2">
                {work.href ? (
                  <a
                    href={work.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-brand underline-offset-4 hover:underline"
                  >
                    Visitar {new URL(work.href).host.replace(/^www\./, "")}
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                    <ArrowRightIcon className="size-4 -rotate-45" aria-hidden="true" />
                  </a>
                ) : (
                  <p className="text-[15px] text-text-muted">Uso interno del cliente, sin enlace público.</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <a
          data-reveal
          href={site.owner.portfolioUrl}
          target="_blank"
          rel="noreferrer"
          className="press group inline-flex items-center gap-2 self-start text-lg font-semibold text-brand"
        >
          Ver todos los proyectos en el portafolio
          <span className="sr-only"> (se abre en otra pestaña)</span>
          <ArrowRightIcon className="size-5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </a>
      </Container>
    </Slide>
  );
}
