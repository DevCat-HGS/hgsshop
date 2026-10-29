import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { getCategoryBySlug, getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { commercialModelLabels, formatPrice } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { ProductCoverArt } from "@/components/product/ProductCoverArt";
import { ArchivePhoto } from "@/components/ui/ArchivePhoto";
import { photoFor } from "@/components/product/categoryPhotos";
import { ProductGrid } from "@/components/product/ProductGrid";
import { DemoCallout } from "@/components/product/DemoCallout";
import { CheckList, DetailSection, LimitationsList } from "@/components/product/InfoList";
import { Lifecycle } from "@/components/product/Lifecycle";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { site } from "@/config/site";

type LoadState = { status: "loading" } | { status: "not_found" } | { status: "ready"; product: Product; category?: Category; related: Product[] };

export function ProductDetailPage() {
  const { slug = "" } = useParams();
  // La key reinicia el estado de carga al pasar de un producto a otro (p. ej. desde "relacionados").
  return <ProductLoader key={slug} slug={slug} />;
}

function ProductLoader({ slug }: { slug: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getProductBySlug(slug).then(async (product) => {
      if (cancelled) return;
      if (!product) {
        setState({ status: "not_found" });
        return;
      }
      const [category, related] = await Promise.all([getCategoryBySlug(product.categorySlug), getRelatedProducts(product)]);
      if (!cancelled) setState({ status: "ready", product, category, related });
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.status === "not_found") return <NotFoundPage />;
  if (state.status === "loading") return <ProductDetailSkeleton />;

  return <ProductDetail product={state.product} category={state.category} related={state.related} />;
}

function ProductDetailSkeleton() {
  return (
    <Container className="py-12">
      <div aria-busy="true" aria-label="Cargando producto">
        <div /* taste-skill-ignore: esqueleto de carga */ className="h-4 w-48 animate-pulse rounded bg-surface" />
        <div /* taste-skill-ignore: esqueleto de carga */ className="mt-6 h-10 w-72 animate-pulse rounded bg-surface" />
        <div /* taste-skill-ignore: esqueleto de carga */ className="mt-8 aspect-video w-full animate-pulse rounded-lg bg-surface" />
      </div>
    </Container>
  );
}

function ProductDetail({ product, category, related }: { product: Product; category?: Category; related: Product[] }) {
  useDocumentHead({
    title: product.name,
    description: product.shortDescription,
    path: `/productos/${product.slug}`,
  });

  useEffect(() => {
    trackEvent("product_viewed", { product: product.slug, status: product.status });
  }, [product.slug, product.status]);

  const isReadyToSell = product.status === "available";
  const photo = photoFor(product.categorySlug);

  return (
    <>
      <Container className="py-12">
        <Breadcrumbs
          items={[
            { label: "Inicio", to: "/" },
            { label: "Productos", to: "/productos" },
            ...(category ? [{ label: category.name, to: `/productos?categoria=${category.slug}` }] : []),
            { label: product.name },
          ]}
        />

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_20rem]">
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="font-display text-[clamp(3rem,6vw,5.5rem)] text-text">{product.name}</h1>
              <StatusBadge status={product.status} />
            </div>
            <p className="mt-5 max-w-2xl text-xl text-pretty text-text">{product.shortDescription}</p>

            <div className="mt-8 max-w-2xl rounded-sm bg-surface p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[15px] font-semibold text-text-muted">Etapa actual</p>
              </div>
              <div className="mt-4">
                <Lifecycle status={product.status} />
              </div>
            </div>

            <div className="mt-8">
              {product.screenshots.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {product.screenshots.map((shot) => (
                    <img key={shot.src} src={shot.src} alt={shot.alt} loading="lazy" className="rounded-lg border border-border" />
                  ))}
                </div>
              ) : photo ? (
                <ArchivePhoto photo={photo} caption eager className="aspect-[16/9] rounded-sm sm:aspect-[21/9]" />
              ) : (
                <ProductCoverArt categorySlug={product.categorySlug} aspect="aspect-[16/9] sm:aspect-[21/9]" className="rounded-sm" />
              )}
            </div>

            <div className="mt-12">
              <DetailSection title="Qué es">
                <div className="flex flex-col gap-3 text-base leading-relaxed text-text">
                  {product.description.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </DetailSection>

              <DetailSection title="Problema que resuelve">
                <p className="text-base leading-relaxed text-text">{product.problem}</p>
              </DetailSection>

              <DetailSection title="Para quién es">
                <p className="text-base leading-relaxed text-text">{product.audience}</p>
              </DetailSection>

              <DetailSection title="Beneficios">
                <CheckList items={product.benefits} />
              </DetailSection>

              <DetailSection title="Características principales">
                <CheckList items={product.features} />
              </DetailSection>

              {Boolean(product.technologies?.length || product.requirements?.length) && (
                <DetailSection title="Información técnica">
                  {product.technologies && product.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {product.technologies.map((tech) => (
                        <Badge key={tech}>{tech}</Badge>
                      ))}
                    </div>
                  )}
                  {product.requirements && product.requirements.length > 0 && (
                    <ul className="mt-4 list-disc pl-5 text-sm text-text-muted">
                      {product.requirements.map((req) => (
                        <li key={req}>{req}</li>
                      ))}
                    </ul>
                  )}
                </DetailSection>
              )}

              <DetailSection title="Estado actual y limitaciones conocidas">
                <LimitationsList items={product.limitations} />
              </DetailSection>

              {product.faqs.length > 0 && (
                <DetailSection title="Preguntas frecuentes">
                  <Accordion items={product.faqs} />
                </DetailSection>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-sm bg-surface p-6">
              <p className="text-[15px] font-semibold text-text-muted">Precio</p>
              <p className="mt-1 text-lg font-semibold text-text">{formatPrice(product.pricing)}</p>
              {product.pricing.note && <p className="mt-1.5 text-[13px] text-text-muted">{product.pricing.note}</p>}

              <p className="mt-5 text-[15px] font-semibold text-text-muted">Modelo de contratación</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.commercialModels.map((model) => (
                  <Badge key={model}>{commercialModelLabels[model]}</Badge>
                ))}
              </div>

              <Button to={`/desarrollo-a-medida?producto=${product.slug}`} className="mt-6 w-full">
                {isReadyToSell ? "Contratar" : "Solicitar cotización"}
              </Button>
              <Button to="/contacto" variant="ghost" className="mt-2 w-full">
                Hablar con ventas
              </Button>
            </div>

            <DemoCallout product={product} />

            <p className="px-1 text-[13px] text-text-subtle">
              ¿Dudas? Escribe a{" "}
              <a href={`mailto:${site.contact.email}`} className="underline hover:text-text-muted">
                {site.contact.email}
              </a>
            </p>
          </aside>
        </div>
      </Container>

      {related.length > 0 && (
        <section className="bg-surface py-16">
          <Container>
            <h2 className="text-xl font-semibold text-text">Productos relacionados</h2>
            <div className="mt-6">
              <ProductGrid products={related} />
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

export default ProductDetailPage;
