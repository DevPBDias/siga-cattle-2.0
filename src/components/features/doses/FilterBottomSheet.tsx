"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { DoseSortOption } from "@/types/semen_dose.type";

export type SortOption = DoseSortOption;

interface FilterBottomSheetProps {
  open: boolean;
  onClose: () => void;
  breeds: string[];
  selectedBreed: string | null;
  onBreedSelect: (breed: string | null) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Nome (A-Z)" },
  { value: "name-desc", label: "Nome (Z-A)" },
  { value: "qty-asc", label: "Quantidade (Menor)" },
  { value: "qty-desc", label: "Quantidade (Maior)" },
];

export function FilterBottomSheet({
  open,
  onClose,
  breeds,
  selectedBreed,
  onBreedSelect,
  sortBy,
  onSortChange,
}: FilterBottomSheetProps) {
  const handleClearFilters = () => {
    onBreedSelect(null);
    onSortChange("name-asc");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[95%] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center justify-between">
            <span>Filtros e Ordenação</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs text-muted-foreground"
            >
              Limpar
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase text-muted-foreground">
            Filtrar por Raça
          </h4>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={selectedBreed === null ? "default" : "outline"}
              size="sm"
              onClick={() => onBreedSelect(null)}
              className="text-xs"
            >
              Todas
            </Button>
            {breeds.map((breed) => (
              <Button
                key={breed}
                type="button"
                variant={selectedBreed === breed ? "default" : "outline"}
                size="sm"
                onClick={() => onBreedSelect(breed)}
                className="text-xs"
              >
                {breed}
              </Button>
            ))}
          </div>
          {breeds.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              Nenhuma raça cadastrada
            </p>
          )}
        </div>

        <div className="space-y-3 mt-4">
          <h4 className="text-xs font-bold uppercase text-muted-foreground">
            Ordenar por
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {SORT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={sortBy === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => onSortChange(option.value)}
                className="justify-start gap-2 text-xs"
              >
                {sortBy === option.value && <Check className="h-3 w-3" />}
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          onClick={onClose}
          className="w-full mt-4 uppercase font-semibold py-5"
        >
          Aplicar Filtros
        </Button>
      </DialogContent>
    </Dialog>
  );
}
