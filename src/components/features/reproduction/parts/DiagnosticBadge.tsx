import { cn } from "@/lib/utils";
import { DIAGNOSTIC_STYLES, isDiagnostic } from "../reproduction.config";

export const DiagnosticBadge = ({ result }: { result?: string | null }) => {
  if (!isDiagnostic(result)) return null;

  const { label, className } = DIAGNOSTIC_STYLES[result];

  return (
    <span
      className={cn(
        "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border shadow-sm",
        className,
      )}
    >
      {label}
    </span>
  );
};
