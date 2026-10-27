import type { ReactNode } from "react";
import { cn } from "@/lib/utils";


interface FormRowProps {
  label: string;
  hint?: string;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormRow({
  label,
  hint,
  htmlFor,
  required,
  children,
  className,
}: FormRowProps) {
  return (
    <div className={cn("grid grid-cols-[2fr_3fr] items-center gap-3", className)}>
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
      {/* min-w-0 evita que Select/Input estourem a largura da coluna */}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FormSection: título + espaçamento padrão entre linhas                      */
/* -------------------------------------------------------------------------- */

interface FormSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, children, className }: FormSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="border-b border-border/60 pb-1 text-[10px] font-bold uppercase text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}
