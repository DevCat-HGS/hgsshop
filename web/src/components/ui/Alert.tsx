import type { ReactNode } from "react";
import { AlertTriangleIcon, CheckIcon } from "@/components/icons";

type AlertVariant = "success" | "error";

const variantClasses: Record<AlertVariant, string> = {
  success: "border-success/30 bg-success-muted text-success",
  error: "border-danger/30 bg-danger-muted text-danger",
};

const icons: Record<AlertVariant, ReactNode> = {
  success: <CheckIcon className="size-5 shrink-0" aria-hidden="true" />,
  error: <AlertTriangleIcon className="size-5 shrink-0" aria-hidden="true" />,
};

export function Alert({ variant, children }: { variant: AlertVariant; children: ReactNode }) {
  return (
    <div role={variant === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${variantClasses[variant]}`}>
      {icons[variant]}
      <div>{children}</div>
    </div>
  );
}
