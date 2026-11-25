"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatusSelector } from "@/components/features/animals/status/StatusSelector";
import { useUpdateAnimal } from "@/hooks/db/animals/useUpdateAnimal";
import { Animal } from "@/types/animal.type";
import { STATUS_ABCZ_OPTIONS } from "@/types/status.type";
import { StatusSuccessModal } from "@/components/features/animals/modals/status/StatusSuccessModal";
import { FeatureErrorBoundary } from "@/components/ui/FeatureErrorBoundary";

interface ManageStatusProps {
  selectedAnimal: Animal | null;
  onSuccess?: () => void;
}

export const ManageStatus = (props: ManageStatusProps) => {
  return (
    <FeatureErrorBoundary featureName="Gerenciar Status ABCZ">
      <ManageStatusContent {...props} />
    </FeatureErrorBoundary>
  );
};

const ManageStatusContent = ({
  selectedAnimal,
  onSuccess,
}: ManageStatusProps) => {
  const {
    actions: { updateAnimal },
  } = useUpdateAnimal();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatusNames, setSelectedStatusNames] = useState<string[]>([]);

  useEffect(() => {
    if (selectedAnimal?.status) {
      const animalStatusParts = selectedAnimal.status.split(" / ");
      const validStatusNames: readonly string[] = STATUS_ABCZ_OPTIONS;

      setSelectedStatusNames(
        animalStatusParts.filter(
          (s) =>
            s && s !== "-" && s !== "Nenhum" && validStatusNames.includes(s),
        ),
      );
    } else if (selectedAnimal) {
      setSelectedStatusNames([]);
    }
  }, [selectedAnimal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal) return;
    setError(null);

    try {
      await updateAnimal(selectedAnimal.animal_key || selectedAnimal.rgn, {
        status:
          selectedStatusNames.length > 0
            ? selectedStatusNames.join(" / ")
            : "-",
      });
      setSuccessModalOpen(true);
      onSuccess?.();
    } catch (err) {
      console.error("Erro ao atualizar status ABCZ:", err);
      setError("Erro ao atualizar status ABCZ");
    }
  };

  if (!selectedAnimal) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
        <p className="text-muted-foreground font-medium">
          Selecione um animal acima para gerenciar seu Status ABCZ.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">
            {error}
          </div>
        )}

        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex flex-col gap-0.5">
          <span className="text-[9px] font-bold uppercase text-primary/60 tracking-wider">
            Status ABCZ Atual:
          </span>
          <span className="text-base font-black text-primary uppercase">
            {selectedAnimal.status &&
            selectedAnimal.status !== "-" &&
            selectedAnimal.status !== "Nenhum"
              ? selectedAnimal.status
              : "Nenhum"}
          </span>
        </div>

        <StatusSelector
          selectedStatusNames={selectedStatusNames}
          onToggle={setSelectedStatusNames}
        />

        <Button
          variant="default"
          type="submit"
          className="w-full text-sm font-bold py-4 rounded-xl mt-2 uppercase shadow-lg shadow-primary/10 active:scale-[0.98] transition-all"
        >
          Confirmar Alteração
        </Button>
      </form>

      <StatusSuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
      />
    </div>
  );
};
