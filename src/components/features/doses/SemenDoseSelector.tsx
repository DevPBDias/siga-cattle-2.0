"use client";

import { useSemenDoses } from "@/hooks/db/doses/useSemenDoses";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SemenDoseSelectorProps {
  value: string;
  onValueChange: (value: string, doseId?: string) => void;
  placeholder?: string;
  label?: string;
}

export function SemenDoseSelector({
  value,
  onValueChange,
  placeholder = "Selecione um touro",
  label,
}: SemenDoseSelectorProps) {
  const { data: doses = [], loading: isLoading } = useSemenDoses();

  const handleValueChange = (bullName: string) => {
    const selectedDose = doses.find((d) => d.animal_name === bullName);
    onValueChange(bullName, selectedDose?.id);
  };

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label className="text-[10px] font-bold text-primary uppercase tracking-tight">
          {label}
        </label>
      )}
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className="bg-muted/40 border-0 w-full text-sm">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Carregando touros...</span>
            </div>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          {doses
            .filter((d) => (d.quantity || 0) > 0 || d.animal_name === value) // Show if has quantity or is already selected
            .map((dose) => (
              <SelectItem key={dose.id} value={dose.animal_name}>
                <div className="flex justify-between items-center w-full min-w-[200px]">
                  <span>{dose.animal_name}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full ml-2 font-bold",
                      (dose.quantity || 0) <= 5
                        ? "bg-amber-100 text-amber-600 border border-amber-200"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {dose.quantity} {dose.quantity === 1 ? "dose" : "doses"}
                  </span>
                </div>
              </SelectItem>
            ))}
          {doses.length === 0 && !isLoading && (
            <div className="p-2 text-xs text-muted-foreground text-center">
              Nenhuma dose no estoque
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
