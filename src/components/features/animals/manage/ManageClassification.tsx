"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ClassificationSelector } from "@/components/features/animals/classe/ClassificationSelector";
import { useUpdateAnimal } from "@/hooks/db/animals/useUpdateAnimal";
import { Animal } from "@/types/animal.type";
import { ClassificationSuccessModal } from "@/components/features/animals/modals/classe/ClassificationSuccessModal";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";
import { FeatureErrorBoundary } from "@/components/ui/FeatureErrorBoundary";

interface ManageClassificationProps {
  selectedAnimal: Animal | null;
  onSuccess?: () => void;
}

export const ManageClassification = (props: ManageClassificationProps) => {
  return (
    <FeatureErrorBoundary featureName="Gerenciar Classificação">
      <ManageClassificationContent {...props} />
    </FeatureErrorBoundary>
  );
};

const ManageClassificationContent = ({
  selectedAnimal,
  onSuccess,
}: ManageClassificationProps) => {
  const {
    actions: { updateAnimal },
  } = useUpdateAnimal();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassification, setSelectedClassification] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (selectedAnimal) {
      setSelectedClassification(selectedAnimal.classification || null);
    } else {
      setSelectedClassification(null);
    }
  }, [selectedAnimal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal) return;
    setError(null);

    try {
      await updateAnimal(selectedAnimal.animal_key || selectedAnimal.rgn, {
        classification: selectedClassification || "-",
      });
      setSuccessModalOpen(true);
      onSuccess?.();
    } catch (err) {
      console.error("Erro ao atualizar classificação:", err);
      setError("Erro ao atualizar classificação");
    }
  };

  const handleConfirmClear = async () => {
    if (!selectedAnimal) return;
    try {
      await updateAnimal(selectedAnimal.animal_key || selectedAnimal.rgn, {
        classification: "-",
      });
      setSelectedClassification(null);
      setConfirmModalOpen(false);
    } catch (err) {
      console.error("Erro ao limpar classificação:", err);
      setError("Erro ao limpar classificação");
    }
  };

  if (!selectedAnimal) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
        <p className="text-muted-foreground font-medium">
          Selecione um animal acima para gerenciar sua classificação.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">
            {error}
          </div>
        )}

        <div className="flex flex-row justify-between items-end gap-3 w-full">
          <div className="p-3 flex-1 rounded-xl bg-primary/5 border border-primary/10 flex flex-col gap-0.5">
            <span className="text-[9px] font-bold uppercase text-primary/60 tracking-wider">
              Classe Atual:
            </span>
            <span className="text-base font-black text-primary uppercase">
              {selectedAnimal.classification || "Nenhuma"}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmModalOpen(true)}
            className="px-2 h-auto py-1.5 text-[9px] font-bold uppercase text-destructive hover:bg-destructive/10 rounded-lg border-2 border-destructive/20 active:scale-95 transition-all"
          >
            Limpar
          </Button>
        </div>

        <ClassificationSelector
          selectedClassificationName={selectedClassification}
          onToggle={setSelectedClassification}
        />

        <Button
          variant="default"
          type="submit"
          className="w-full text-sm font-bold py-4 rounded-lg mt-2 uppercase shadow-lg shadow-primary/10 transition-all"
        >
          Confirmar Alteração
        </Button>
      </form>

      <ClassificationSuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
      />

      <ConfirmActionModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Limpar Classificação"
        description="Tem certeza que deseja remover a classificação deste animal?"
      />
    </div>
  );
};
