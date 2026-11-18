"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SituationSelector } from "@/components/features/animals/situation/SituationSelector";
import {
  useSituations,
  useCreateSituation,
  useDeleteSituation,
} from "@/hooks/db/situations";
import { useUpdateAnimal } from "@/hooks/db/animals/useUpdateAnimal";
import { Animal } from "@/types/animal.type";
import { AnimalSituation } from "@/types/situation.type";
import { SituationSuccessModal } from "@/components/features/animals/modals/situation/SituationSuccessModal";
import { AddSituationModal } from "@/components/features/animals/modals/situation/AddSituationModal";
import { DeleteSituationModal } from "@/components/features/animals/modals/situation/DeleteSituationModal";
import { FeatureErrorBoundary } from "@/components/ui/FeatureErrorBoundary";

interface ManageSituationProps {
  selectedAnimal: Animal | null;
  onSuccess?: () => void;
}

export const ManageSituation = (props: ManageSituationProps) => {
  return (
    <FeatureErrorBoundary featureName="Gerenciar Situação">
      <ManageSituationContent {...props} />
    </FeatureErrorBoundary>
  );
};

const ManageSituationContent = ({
  selectedAnimal,
  onSuccess,
}: ManageSituationProps) => {
  const {
    actions: { updateAnimal },
  } = useUpdateAnimal();
  const { data: situations = [], loading: isLoading } = useSituations();
  const {
    actions: { createSituation },
  } = useCreateSituation();
  const {
    actions: { deleteSituation },
  } = useDeleteSituation();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSituationNames, setSelectedSituationNames] = useState<
    string[]
  >([]);

  useEffect(() => {
    if (selectedAnimal?.document_situation && situations.length > 0) {
      const animalSituationParts =
        selectedAnimal.document_situation.split(" / ");
      const validSituationNames = situations.map(
        (s: AnimalSituation) => s.situation_name,
      );

      setSelectedSituationNames(
        animalSituationParts.filter(
          (s) =>
            s && s !== "-" && s !== "Nenhum" && validSituationNames.includes(s),
        ),
      );
    } else if (selectedAnimal) {
      setSelectedSituationNames([]);
    }
  }, [selectedAnimal, situations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal) return;
    setError(null);

    try {
      await updateAnimal(selectedAnimal.animal_key || selectedAnimal.rgn, {
        document_situation:
          selectedSituationNames.length > 0
            ? selectedSituationNames.join(" / ")
            : "-",
      });
      setSuccessModalOpen(true);
      onSuccess?.();
    } catch (err) {
      console.error("Erro ao atualizar situação:", err);
      setError("Erro ao atualizar situação");
    }
  };

  const handleCreateSituation = async (name: string) => {
    try {
      await createSituation({ situation_name: name });
    } catch (err) {
      console.error("Erro ao criar situação:", err);
      setError("Erro ao criar situação");
    }
  };

  const handleDeleteSituation = async (id: string) => {
    try {
      await deleteSituation(id);
      const situation = situations.find((s: AnimalSituation) => s.id === id);
      if (
        situation &&
        selectedSituationNames.includes(situation.situation_name)
      ) {
        setSelectedSituationNames((prev) =>
          prev.filter((name) => name !== situation.situation_name),
        );
      }
    } catch (err) {
      console.error("Erro ao deletar situação:", err);
      setError("Erro ao deletar situação");
    }
  };

  if (!selectedAnimal) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
        <p className="text-muted-foreground font-medium">
          Selecione um animal acima para gerenciar sua situação.
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
            Situação Atual:
          </span>
          <span className="text-base font-black text-primary uppercase">
            {selectedAnimal.document_situation &&
            selectedAnimal.document_situation !== "-" &&
            selectedAnimal.document_situation !== "Nenhum"
              ? selectedAnimal.document_situation
              : "Nenhuma"}
          </span>
        </div>

        <SituationSelector
          situations={situations}
          loading={isLoading}
          selectedSituationNames={selectedSituationNames}
          onToggle={setSelectedSituationNames}
          onAddClick={() => setAddModalOpen(true)}
          onDeleteClick={() => setDeleteModalOpen(true)}
        />

        <Button
          variant="default"
          type="submit"
          className="w-full text-sm font-bold py-4 rounded-xl mt-2 uppercase shadow-lg shadow-primary/10 active:scale-[0.98] transition-all"
        >
          Confirmar Alteração
        </Button>
      </form>

      <SituationSuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
      />

      <AddSituationModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleCreateSituation}
      />

      <DeleteSituationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        situations={situations}
        onDelete={handleDeleteSituation}
      />
    </div>
  );
};
