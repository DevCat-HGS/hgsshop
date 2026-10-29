import type { Product } from "@/types/product";
import { Button } from "@/components/ui/Button";
import { DemoButton } from "@/components/product/DemoButton";

export function DemoCallout({ product }: { product: Product }) {
  if (product.status === "idea") {
    return (
      <div className="rounded-sm bg-surface p-6">
        <p className="text-base font-semibold text-text">Todavía es una idea</p>
        <p className="mt-2 text-base text-text">
          {product.name} no existe aún: no hay demo ni sesión guiada que mostrar. Si te serviría, cuéntame tu caso; los
          primeros interesados deciden qué se construye.
        </p>
        <Button to={`/desarrollo-a-medida?producto=${product.slug}`} variant="secondary" size="sm" className="mt-4">
          Contarte mi caso
        </Button>
      </div>
    );
  }

  if (!product.demo) {
    return (
      <div className="rounded-sm bg-surface p-6">
        <p className="text-base font-semibold text-text">Demo aún no disponible</p>
        <p className="mt-2 text-base text-text">
          {product.name} todavía no tiene una demo pública. En lugar de mostrar una captura que aparente un producto
          terminado, puedes solicitar una sesión guiada para ver su estado real.
        </p>
        <Button to={`/desarrollo-a-medida?producto=${product.slug}`} variant="secondary" size="sm" className="mt-4">
          Solicitar sesión guiada
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-sm bg-brand-muted p-6">
      <p className="text-base font-semibold text-text">Demo disponible</p>
      <p className="mt-2 text-base text-text">{product.demo.instructions}</p>
      <DemoButton product={product} label="Abrir demo" className="mt-4" />
    </div>
  );
}
