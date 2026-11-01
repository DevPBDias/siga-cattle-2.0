"use client";

import { Animal } from "@/types/animal.type";

interface AnimalChipGridProps {
  animals: Animal[];
  selectedRgns: Set<string>;
  onToggle: (rgn: string) => void;
}

export function AnimalChipGrid({
  animals,
  selectedRgns,
  onToggle,
}: AnimalChipGridProps) {
  if (animals.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Nenhum animal encontrado nesta fazenda.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {animals.map((animal) => {
        const selected = selectedRgns.has(animal.rgn);
        return (
          <button
            type="button"
            key={animal.rgn}
            onClick={() => onToggle(animal.rgn)}
            className={
              selected
                ? "px-3 py-1.5 rounded-md text-xs font-bold bg-field-green text-white border border-field-green"
                : "px-3 py-1.5 rounded-md text-xs font-bold bg-card text-primary border border-border/60"
            }
          >
            {animal.rgn}
          </button>
        );
      })}
    </div>
  );
}
