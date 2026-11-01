"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { RgnAutocomplete } from "@/components/features/animals/RgnAutocomplete";
import { AnimalVaccineHistory } from "@/components/features/vaccines/details/AnimalVaccineHistory";
import { VaccineDuplicateWarning } from "@/components/features/vaccines/form/VaccineDuplicateWarning";
import { Input } from "@/components/ui/input";
import { VaccineHistoryEntry } from "@/types/vaccine.type";
import { cn } from "@/lib/utils";

interface RgnOption {
  label: string;
  value: string;
}

interface AnimalIdentificationCardProps {
  rgn: string;
  multipleAnimals: boolean;
  rgnOptions: RgnOption[];
  existingVaccines: VaccineHistoryEntry[];
  loadingHistory: boolean;
  duplicateWarnings: string[];
  onRgnChange: (rgn: string) => void;
  onMultipleAnimalsChange: (value: boolean) => void;
  className?: string;
}

export function AnimalIdentificationCard({
  rgn,
  multipleAnimals,
  rgnOptions,
  existingVaccines,
  loadingHistory,
  duplicateWarnings,
  onRgnChange,
  onMultipleAnimalsChange,
  className,
}: AnimalIdentificationCardProps) {
  // Internal chip list derived from the rgn prop when switching into multi mode.
  // We keep a local draft input value separate from the committed chips.
  const [chipInput, setChipInput] = useState("");

  // Parse current chips from the comma-separated rgn string.
  const chips: string[] = rgn
    ? rgn
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const commitChip = () => {
    const value = chipInput.trim();
    if (!value) return;
    const next = [...chips, value];
    onRgnChange(next.join(","));
    setChipInput("");
  };

  const removeChip = (index: number) => {
    const next = chips.filter((_, i) => i !== index);
    onRgnChange(next.join(","));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      commitChip();
    }
  };

  return (
    <section
      className={cn(
        "p-3.5 border border-border rounded-[15px] bg-card shadow-xs space-y-3",
        className,
      )}
    >
      {/* Header com toggle de múltiplos animais */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold uppercase text-primary">
          Animal vacinado (RGN): *
        </label>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={multipleAnimals}
            onChange={(e) => {
              // Reset chips/input when toggling mode
              setChipInput("");
              onMultipleAnimalsChange(e.target.checked);
            }}
            className="rounded-none border-border text-field-green focus:ring-field-green"
          />
          Vários animais
        </label>
      </div>

      {/* Input de RGN — chip input (multiple) or autocomplete (single) */}
      {multipleAnimals ? (
        <div>
          {/* Chip container + input */}
          <div className="flex flex-wrap gap-1.5 min-h-[40px] rounded-xl border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
            {chips.map((chip, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 border border-border rounded px-2 py-0.5 text-xs font-semibold text-primary bg-muted/40"
              >
                {chip}
                <button
                  type="button"
                  onClick={() => removeChip(index)}
                  aria-label={`Remover ${chip}`}
                  className="text-muted-foreground hover:text-destructive focus:outline-none ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              value={chipInput}
              onChange={(e) => setChipInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={commitChip}
              placeholder={chips.length === 0 ? "Ex: 580 103 214" : ""}
              className="flex-1 min-w-[80px] bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
          <span className="block mt-1 text-[10px] text-muted-foreground">
            Digite um RGN e pressione Espaço ou Enter para adicionar.
          </span>
        </div>
      ) : (
        <RgnAutocomplete
          options={rgnOptions}
          value={rgn}
          onSelect={onRgnChange}
        />
      )}

      {/* Histórico de vacinas do animal */}
      {!multipleAnimals && rgn && (
        <div className="pt-2 border-t border-border/50">
          <AnimalVaccineHistory
            rgn={rgn}
            loading={loadingHistory}
            vaccines={existingVaccines}
          />
        </div>
      )}

      {/* Alerta de duplicação */}
      <VaccineDuplicateWarning duplicates={duplicateWarnings} />
    </section>
  );
}
