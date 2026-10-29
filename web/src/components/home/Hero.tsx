import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { StatusBoard } from "@/components/home/StatusBoard";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";

const suggestions = ["inventario", "agenda", "automatización"];

export function Hero({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const demoCount = products.filter((p) => p.demo).length;

  function search(term: string) {
    const params = term.trim() ? `?q=${encodeURIComponent(term.trim())}` : "";
    navigate(`/productos${params}`);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    search(query);
  }

  return (
    <section className="relative">
      <Container className="grid grid-cols-1 items-center gap-14 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-28 lg:pt-24">
        <div>
          <Eyebrow>Software con estado real</Eyebrow>
          <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.035em] text-balance text-text sm:text-6xl">
            Software que resuelve <span className="text-gradient">un problema concreto</span> de tu negocio
          </h1>
          <p className="mt-6 max-w-xl text-lg text-pretty text-text-muted">
            Aplicaciones y herramientas que puedes explorar, probar cuando tienen demo y contratar tal cual o adaptadas a
            tu caso. Cada una dice con honestidad en qué etapa está.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 max-w-xl" role="search">
            <div className="flex items-center gap-2 rounded-xl border border-border-strong bg-bg/80 p-1.5 shadow-card backdrop-blur-sm transition-colors focus-within:border-brand/60">
              <SearchIcon className="ml-2.5 size-4 shrink-0 text-text-subtle" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="¿Qué problema quieres resolver?"
                aria-label="Buscar en el catálogo"
                className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-text placeholder:text-text-subtle focus:outline-none"
              />
              <Button type="submit" size="sm" className="px-4 py-2">
                Buscar
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs text-text-subtle">
              <span>Prueba:</span>
              {suggestions.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => search(term)}
                  className="rounded-md border border-border px-2 py-1 transition-colors hover:border-border-strong hover:text-text"
                >
                  {term}
                </button>
              ))}
            </div>
          </form>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button to="/productos" size="lg">
              Explorar el catálogo
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Button>
            <Button to="/desarrollo-a-medida" variant="ghost" size="lg">
              Necesito algo a medida
            </Button>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-text-subtle">Productos</dt>
              <dd className="mt-1 text-2xl font-semibold text-text">{products.length}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-text-subtle">Demos</dt>
              <dd className="mt-1 text-2xl font-semibold text-text">{demoCount}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-text-subtle">A medida</dt>
              <dd className="mt-1 text-2xl font-semibold text-accent">Sí</dd>
            </div>
          </dl>
        </div>

        <StatusBoard products={products} />
      </Container>
    </section>
  );
}
