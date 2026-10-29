import type { ComponentProps } from "react";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/Button";
import { ExternalLinkIcon } from "@/components/icons";

type ButtonProps = ComponentProps<typeof Button>;

/**
 * Abre la demo de un producto en una pestaña nueva, para que quien la prueba no pierda la página desde la
 * que llegó. Sin demo no pinta nada: nunca se ofrece algo que no se puede usar. El nombre accesible avisa
 * de la pestaña nueva, que de otro modo solo anuncia el icono.
 */
export function DemoButton({
  product,
  label = "Probar demo",
  variant,
  size = "sm",
  className = "",
}: {
  product: Product;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  if (!product.demo) return null;

  return (
    <Button
      to={product.demo.url}
      target="_blank"
      rel="noopener"
      variant={variant}
      size={size}
      className={className}
      aria-label={`${label} de ${product.name} (se abre en una pestaña nueva)`}
    >
      {label}
      <ExternalLinkIcon className="size-4" aria-hidden="true" />
    </Button>
  );
}
