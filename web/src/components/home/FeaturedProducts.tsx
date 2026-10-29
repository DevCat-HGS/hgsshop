import type { Product } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/product/ProductGrid";

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="02 · Productos"
          title="Lo que hay en el taller ahora mismo"
          description="Una muestra del catálogo. La barra de cada tarjeta indica su etapa: prototipo, en desarrollo o disponible."
          action={
            <Button to="/productos" variant="secondary">
              Ver todo el catálogo
            </Button>
          }
        />
        <div className="mt-12">
          <ProductGrid products={products} />
        </div>
      </Container>
    </section>
  );
}
