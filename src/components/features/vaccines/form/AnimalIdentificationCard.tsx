"use client";

import { RgnAutocomplete } from "@/components/features/animals/RgnAutocomplete";
import { AnimalVaccineHistory } from "@/components/features/vaccines/details/AnimalVaccineHistory";
import { VaccineDuplicateWarning } from "@/components/features/vaccines/form/VaccineDuplicateWarning";
import { Input } from "@/components/ui/input";
import { VaccineHistoryEntry } from "@/types/vaccine.type";

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
}: AnimalIdentificationCardProps) {
  return (
    <section className="p-3.5 border border-border rounded-[15px] bg-card shadow-xs space-y-3">
      {/* Header com toggle de múltiplos animais */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold uppercase text-primary">
          Animal vacinado (RGN): *
        </label>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={multipleAnimals}
            onChange={(e) => onMultipleAnimalsChange(e.target.checked)}
            className="rounded border-border text-field-green focus:ring-field-green"
          />
          Vários animais
        </label>
      </div>

      {/* Input de RGN — simples ou autocomplete */}
      {multipleAnimals ? (
        <div>
          <Input
            value={rgn}
            onChange={(e) => onRgnChange(e.target.value)}
            placeholder="Ex: 580, 103, 214 (separados por vírgula)"
            className="rounded-xl"
          />
          <span className="block mt-1 text-[10px] text-muted-foreground">
            Separe os números de RGN com vírgulas ou quebras de linha.
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
