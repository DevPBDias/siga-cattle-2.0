"use client";

import { X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectedEntityCardProps {
  caption: string;
  title: string;
  subtitle?: string;
  /** Nó opcional renderizado ao lado do título (ex: badge de raça). */
  badge?: React.ReactNode;
  onClear: () => void;
  clearLabel?: string;
  onEdit?: () => void;
  editLabel?: string;
}

export function SelectedEntityCard({
  caption,
  title,
  subtitle,
  badge,
  onClear,
  clearLabel = "Trocar seleção",
  onEdit,
  editLabel = "Editar informações",
}: SelectedEntityCardProps) {
  return (
    <div className="bg-primary/5 border border-primary/20 px-4 py-1 rounded-md flex justify-between items-center animate-in zoom-in-95 duration-300 shadow-xs">
      <div className="min-w-0 flex-1">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5 block">
          {caption}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-lg font-black text-primary leading-tight">{title}</p>
          {badge}
        </div>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEdit}
            aria-label={editLabel}
            title={editLabel}
            className="text-primary/70 hover:text-white hover:bg-primary h-8 w-8 p-0 rounded-md transition-all group border border-primary/10 cursor-pointer"
          >
            <Pencil className="w-4 h-4 group-hover:scale-110" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          aria-label={clearLabel}
          title={clearLabel}
          className="text-destructive/70 hover:text-white hover:bg-destructive h-8 w-8 p-0 rounded-md transition-all group border border-destructive/10 cursor-pointer"
        >
          <X className="w-4 h-4 group-hover:scale-110" />
        </Button>
      </div>
    </div>
  );
}
