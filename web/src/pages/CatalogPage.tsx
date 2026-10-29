import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { getCategories, getProducts } from "@/lib/catalog";
import type { Category } from "@/types/category";
import type { Product, ProductStatus } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { SearchBar } from "@/components/product/SearchBar";
import { ProductFilters, type SortOption } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Pagination } from "@/components/product/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchIcon } from "@/components/icons";

const PAGE_SIZE = 9;
const SEARCH_DEBOUNCE_MS = 250;

function sortProducts(products: Product[], sort: SortOption): Product[] {
  if (sort === "name-asc") return [...products].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "name-desc") return [...products].sort((a, b) => b.name.localeCompare(a.name));
  return products;
}

export function CatalogPage() {
  useDocumentHead({
    title: "Catálogo de productos",
    description: "Explora aplicaciones y herramientas de software por categoría y estado: disponibles, en desarrollo, prototipos o bajo cotización.",
    path: "/productos",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const categorySlug = searchParams.get("categoria") ?? "";
  const status = (searchParams.get("estado") as ProductStatus | null) ?? "";
  const sort = (searchParams.get("orden") as SortOption | null) ?? "relevance";
  const page = Number(searchParams.get("pagina") ?? "1");

  const [queryInput, setQueryInput] = useState(urlQuery);
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  // Debounce: espera a que la persona deje de escribir antes de reflejarlo en la URL y disparar la búsqueda.
  useEffect(() => {
    if (queryInput === urlQuery) return;
    const timeout = setTimeout(() => {
      // Se parte de la URL actual, no de los parámetros de cuando empezó la espera: si entretanto se
      // eligió un filtro, una copia vieja lo borraría.
      const next = new URLSearchParams(window.location.search);
      if (queryInput) next.set("q", queryInput);
      else next.delete("q");
      next.delete("pagina");
      setSearchParams(next, { replace: true });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getProducts({ query: urlQuery, categorySlug: categorySlug || undefined, status: status || undefined }).then((products) => {
      if (!cancelled) {
        setResults(products);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [urlQuery, categorySlug, status]);

  const sorted = useMemo(() => sortProducts(results ?? [], sort), [results, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("pagina");
    setSearchParams(next);
  }

  return (
    <Container className="pb-12 pt-14 sm:pt-20">
      <div className="max-w-2xl">
        <h1 className="font-display text-[length:var(--text-step-head)] text-balance text-text">
          Todo lo que hay en el taller
        </h1>
        <p className="mt-5 text-lg text-pretty text-text">
          Cada producto muestra su etapa real. Filtra por categoría o estado para encontrar lo que necesitas.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-4 rounded-sm bg-surface p-4 sm:p-5">
        <SearchBar value={queryInput} onChange={setQueryInput} isLoading={isLoading} />
        <ProductFilters
          categories={categories}
          categorySlug={categorySlug}
          onCategoryChange={(value) => updateParam("categoria", value)}
          status={status}
          onStatusChange={(value) => updateParam("estado", value)}
          sort={sort}
          onSortChange={(value) => updateParam("orden", value)}
        />
      </div>

      <p className="mt-8 text-[15px] text-text-muted" aria-live="polite">
        {isLoading && results === null ? "Cargando…" : `${sorted.length} ${sorted.length === 1 ? "resultado" : "resultados"}`}
      </p>

      <div className="mt-4">
        {isLoading && results === null ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-[4/5] animate-pulse rounded-lg border border-border bg-surface" />
            ))}
          </div>
        ) : paginated.length > 0 ? (
          <ProductGrid products={paginated} />
        ) : (
          <EmptyState
            icon={<SearchIcon className="size-8" aria-hidden="true" />}
            title="No encontramos productos con esos filtros"
            description="Prueba con otra palabra clave o quita algún filtro. Si buscas algo muy específico, puede que valga más un desarrollo a medida."
          />
        )}
      </div>

      <div className="mt-10">
        <Pagination page={currentPage} pageCount={pageCount} onPageChange={(value) => updateParam("pagina", String(value))} />
      </div>
    </Container>
  );
}

export default CatalogPage;
