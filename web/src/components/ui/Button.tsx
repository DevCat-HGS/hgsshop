import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { SpinnerIcon } from "@/components/icons";

type Variant = "primary" | "secondary" | "ghost" | "ink";
type Size = "sm" | "md" | "lg";

// Botón plano, de un solo color y radio casi recto: ni degradados ni sombras. `press` da la respuesta al pulsar.
const base =
  "press inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-[background-color,color,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-contrast hover:bg-brand-hover",
  secondary: "bg-surface-hover text-text hover:bg-depth",
  ghost: "text-text hover:bg-surface",
  // Para usar sobre un campo Ice Blue: tinta navy sobre el acento.
  ink: "bg-bg text-text hover:bg-surface",
};

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-2 text-[15px]",
  md: "px-5 py-3 text-base",
  lg: "px-6 py-4 text-[17px]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { isLoading?: boolean; to?: never };
type ButtonAsLink = CommonProps & Omit<LinkProps, "className" | "children">;

/** Un mismo estilo para tres usos: `<button>`, enlace interno (`to`) o, con `to` absoluto, enlace externo. */
export function Button(props: ButtonAsButton | ButtonAsLink) {
  if ("to" in props && props.to !== undefined) {
    const { variant = "primary", size = "md", className = "", children, to, ...linkProps } = props;
    const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

    if (typeof to === "string" && /^https?:\/\//.test(to)) {
      return (
        <a href={to} target="_blank" rel="noreferrer" className={classes}>
          {children}
        </a>
      );
    }

    return (
      <Link to={to} {...linkProps} className={classes}>
        {children}
      </Link>
    );
  }

  const { variant = "primary", size = "md", className = "", children, isLoading, type = "button", disabled, ...buttonProps } =
    props as ButtonAsButton;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...buttonProps}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {isLoading && <SpinnerIcon className="size-4" aria-hidden="true" />}
      {children}
    </button>
  );
}
