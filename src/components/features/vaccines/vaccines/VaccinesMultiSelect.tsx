"use client";

import { Check } from "lucide-react";
import { Vaccine } from "@/types/vaccine.type";

interface VaccinesMultiSelectProps {
  vaccines: Vaccine[];
  loading: boolean;
  selected: string[];
  onToggle: (name: string, checked: boolean) => void;
}

export function VaccinesMultiSelect({
  vaccines,
  loading,
  selected,
  onToggle,
}: VaccinesMultiSelectProps) {
  if (loading) {
    return (
      <div className="text-xs text-muted-foreground py-2 font-medium">
        Carregando catálogo de vacinas...
      </div>
    );
  }

  if (vaccines.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-2 italic">
        Nenhuma vacina cadastrada. Clique no botão "+" para adicionar.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      {vaccines.map((vaccine) => {
        const name = vaccine.vaccine_name;
        const isSelected = selected.includes(name);

        return (
          <button
            key={vaccine.id ?? name}
            type="button"
            onClick={() => onToggle(name, !isSelected)}
            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer active:scale-98 ${isSelected
              ? "bg-primary border-field-green text-white shadow-xs"
              : "bg-background border-border text-primary hover:border-field-green/40"
              }`}
          >
            <span
              className={`p-1 rounded-md flex items-center justify-center border shrink-0 transition-colors ${isSelected
                ? "bg-field-green border-white text-white"
                : "border-border bg-white"
                }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
            <span className="truncate">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
