import type { ComponentProps } from "react";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/icons";

type ButtonProps = ComponentProps<typeof Button>;

/**
 * Abre la demo de un producto en la misma pestaña; para volver basta el botón atrás del navegador. Sin demo
 * no pinta nada: nunca se ofrece algo que no se puede usar.
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
      variant={variant}
      size={size}
      className={className}
      aria-label={`${label} de ${product.name}`}
    >
      {label}
      <ArrowRightIcon className="size-4" aria-hidden="true" />
    </Button>
  );
}
