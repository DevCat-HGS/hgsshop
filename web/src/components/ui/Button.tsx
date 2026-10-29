import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { SpinnerIcon } from "@/components/icons";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-contrast hover:bg-brand-hover",
  secondary: "border border-border-strong bg-surface text-text hover:bg-surface-hover",
  ghost: "text-text-muted hover:bg-surface hover:text-text",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
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
