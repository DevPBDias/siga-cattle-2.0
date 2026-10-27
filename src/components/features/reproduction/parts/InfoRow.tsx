import { cn } from "@/lib/utils";

export interface InfoRowProps {
  label: string;
  value?: string | number | null;
  subLabel?: string;
  highlight?: boolean;
}

export const InfoRow = ({ label, value, subLabel, highlight }: InfoRowProps) => (
  <div className="flex justify-between items-center border-b border-border/50 py-1 last:border-0">
    <div className="flex flex-row gap-1 items-center">
      <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-tight">
        {label}
      </span>
      {subLabel && (
        <span className="text-[10px] text-muted-foreground/90 italic leading-none">
          {subLabel}
        </span>
      )}
    </div>
    <span
      className={cn(
        "text-[13px] font-semibold uppercase",
        highlight ? "text-primary" : "text-foreground",
      )}
    >
      {value || "-"}
    </span>
  </div>
);
