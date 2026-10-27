"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Animal } from "@/types/animal.type";
import { RgnOption } from "@/components/features/animals/RgnAutocomplete";
import { RgnSearchField } from "@/components/features/animals/manage/RgnSearchField";
import { SelectedEntityCard } from "@/components/shared/SelectedEntityCard";

interface ReproductionSelectorProps {
  selectedMatriz: Animal | null;
  rgnOptions: RgnOption[];
  selectedRgn: string;
  loading: boolean;
  onSelect: (rgn: string) => void;
  onClear: () => void;
}

export function ReproductionSelector({
  selectedMatriz,
  rgnOptions,
  selectedRgn,
  loading,
  onSelect,
  onClear,
}: ReproductionSelectorProps) {
  const router = useRouter();

  if (selectedMatriz) {
    return (
      <SelectedEntityCard
        caption="Matriz Selecionada"
        title={selectedMatriz.rgn}
        subtitle={selectedMatriz.name || undefined}
        onClear={onClear}
        clearLabel="Trocar animal"
      />
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-700 ease-in-out">
      <RgnSearchField
        label="Buscar Matriz (RGN):"
        options={rgnOptions}
        value={selectedRgn}
        onSelect={onSelect}
        placeholder="Digite o RGN da matriz..."
        requireSearchTerm
        emptyMessage="Nenhuma matriz encontrada."
      />

      {loading && (
        <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando matrizes...</span>
        </div>
      )}
    </div>
  );
}
