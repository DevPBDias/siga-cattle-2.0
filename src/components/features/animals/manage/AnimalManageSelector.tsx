"use client";

import { Animal } from "@/types/animal.type";
import { RgnOption } from "@/components/features/animals/RgnAutocomplete";
import { RgnSearchField } from "@/components/features/animals/manage/RgnSearchField";
import { SelectedEntityCard } from "@/components/shared/SelectedEntityCard";

interface AnimalManageSelectorProps {
  selectedAnimal: Animal | null;
  rgnOptions: RgnOption[];
  selectedRgn: string;
  onSelect: (rgn: string) => void;
  onClear: () => void;
}

export function AnimalManageSelector({
  selectedAnimal,
  rgnOptions,
  selectedRgn,
  onSelect,
  onClear,
}: AnimalManageSelectorProps) {
  if (!selectedAnimal) {
    return (
      <RgnSearchField
        label="Buscar Animal (RGN):"
        options={rgnOptions}
        value={selectedRgn}
        onSelect={onSelect}
      />
    );
  }

  return (
    <SelectedEntityCard
      caption="Animal Selecionado"
      title={selectedAnimal.rgn}
      onClear={onClear}
    />
  );
}
