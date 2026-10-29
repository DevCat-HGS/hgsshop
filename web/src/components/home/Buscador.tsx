import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "@/types/product";
import { getProducts, queryTerms } from "@/lib/catalog";
import { Container } from "@/components/ui/Container";
import { FacetStage } from "@/components/product/FacetStage";
import { Slide } from "@/components/home/Slide";
import { ArrowRightIcon } from "@/components/icons";

const EXAMPLES = ["agenda de citas", "academia de robótica", "automatizar reportes"];
const INITIAL = "inventario para mi tienda";
const MAX_RESULTS = 3;

/**
 * S2 · Buscador. Sección "titular que se escribe": el titular es un campo de texto real y, debajo,
 * el catálogo responde con sus productos mientras se escribe. Usa la misma búsqueda que /productos.
 */
export function Buscador() {
  const [query, setQuery] = useState(INITIAL);
  const [results, setResults] = useState<Product[]>([]);
  const hasTerms = queryTerms(query).length > 0;

  useEffect(() => {
    let cancelled = false;
    getProducts({ query }).then((found) => {
      if (!cancelled) setResults(found);
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <Slide id="buscador" tone="surface" labelledBy="buscador-titulo">
      <Container>
        <h2 id="buscador-titulo" data-reveal className="text-[length:var(--text-step-lead)] font-semibold text-text-muted">
          ¿Qué necesitas resolver?
        </h2>

        <div data-ui data-reveal className="mt-4">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Describe lo que necesitas resolver"
            aria-describedby="buscador-ayuda"
            spellCheck={false}
            className="font-display w-full bg-transparent text-[8.4vw] text-text caret-brand placeholder:text-text-subtle border-b-2 border-transparent focus:outline-none focus-visible:border-brand sm:text-[clamp(3rem,6.4vw,7rem)] [&::-webkit-search-cancel-button]:hidden"
            placeholder="Escribe aquí…"
          />
        </div>

        <div data-reveal className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,35rem)_1fr]">
          <div>
            {/* Se anuncia solo el número de resultados, no la lista entera en cada tecla. */}
            <p role="status" className="sr-only">
              {hasTerms ? (results.length === 0 ? "Ningún producto coincide" : `${results.length} ${results.length === 1 ? "producto coincide" : "productos coinciden"}`) : ""}
            </p>
            {hasTerms && results.length > 0 && (
              <ul data-ui className="overflow-hidden rounded-[6px] border border-border-strong bg-bg">
                {results.slice(0, MAX_RESULTS).map((product) => (
                  <li key={product.id} /* taste-skill-ignore: dentro de un fragmento data-ui */ className="border-b border-border last:border-b-0">
                    <Link to={`/productos/${product.slug}`} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface">
                      <FacetStage status={product.status} className="size-8" label={false} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-text">{product.name}</span>
                        <span className="block truncate text-[14px] text-text-muted">{product.shortDescription}</span>
                      </span>
                      <ArrowRightIcon className="size-4 shrink-0 text-text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-text" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {hasTerms && results.length === 0 && (
              <p data-ui className="rounded-[6px] border border-border-strong bg-bg px-5 py-4 text-[15px] text-text">
                Nada del catálogo lo cubre todavía. Suele ser un buen caso para{" "}
                <Link to="/desarrollo-a-medida" className="font-semibold text-brand underline-offset-4 hover:underline">
                  desarrollo a medida
                </Link>
                .
              </p>
            )}

            {hasTerms && results.length > 0 && (
              <Link
                to={`/productos?q=${encodeURIComponent(query.trim())}`}
                className="mt-5 inline-flex items-center gap-1.5 text-base font-semibold text-brand underline-offset-4 hover:underline"
              >
                Ver todos los resultados en el catálogo
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            )}
          </div>

          <div id="buscador-ayuda" className="flex flex-col gap-3 lg:items-end lg:text-right">
            <p className="text-base text-text-muted">O prueba con:</p>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setQuery(example)}
                  className="press rounded-sm bg-surface-hover px-4 py-3 text-base font-semibold text-text transition-colors hover:bg-depth"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Slide>
  );
}
