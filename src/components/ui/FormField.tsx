import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  orientation?: "stacked" | "horizontal";
  className?: string;
}

/** Campo compartilhado para manter label, hint e espaçamento consistentes. */
export function FormField({
  label,
  children,
  htmlFor,
  hint,
  required,
  orientation = "stacked",
  className,
}: FormFieldProps) {
  return (
    <div
      className={cn(
        orientation === "horizontal"
          ? "grid grid-cols-[2fr_3fr] items-center gap-3"
          : "space-y-1",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col">
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold uppercase leading-tight tracking-tight text-primary"
        >
          {label}
          {required && <span className="text-destructive"> *</span>}
        </label>
        {hint && (
          <span className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
