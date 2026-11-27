"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PartnershipSelector } from "@/components/features/animals/sociedade/PartnershipSelector";
import { useUpdateAnimal } from "@/hooks/db/animals/useUpdateAnimal";
import { Animal } from "@/types/animal.type";
import { PartnershipSuccessModal } from "@/components/features/animals/modals/sociedade/PartnershipSuccessModal";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";
import { FeatureErrorBoundary } from "@/components/ui/FeatureErrorBoundary";
import { usePartnerships } from "@/hooks/db/partnerships";
import {
  formatPartnershipNames,
  parsePartnershipNames,
} from "@/utils/partnership";

interface ManageSocietyProps {
  selectedAnimal: Animal | null;
  onSuccess?: () => void;
}

export const ManageSociety = (props: ManageSocietyProps) => {
  return (
    <FeatureErrorBoundary featureName="Gerenciar Sociedade">
      <ManageSocietyContent {...props} />
    </FeatureErrorBoundary>
  );
};

const ManageSocietyContent = ({
  selectedAnimal,
  onSuccess,
}: ManageSocietyProps) => {
  const {
    actions: { updateAnimal },
  } = useUpdateAnimal();
  const { data: partnerships = [] } = usePartnerships();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  useEffect(() => {
    if (selectedAnimal) {
      setSelectedNames(
        parsePartnershipNames(
          selectedAnimal.partnership,
          partnerships.map((p) => p.partner_name),
        ),
      );
    } else {
      setSelectedNames([]);
    }
  }, [selectedAnimal, partnerships]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal) return;
    setError(null);

    try {
      const partnershipString = formatPartnershipNames(selectedNames);
      await updateAnimal(selectedAnimal.animal_key || selectedAnimal.rgn, {
        partnership: partnershipString,
      });
      setSuccessModalOpen(true);
      onSuccess?.();
    } catch (err) {
      console.error("Erro ao atualizar sociedade:", err);
      setError("Erro ao atualizar sociedade");
    }
  };

  const handleConfirmClear = async () => {
    if (!selectedAnimal) return;
    try {
      await updateAnimal(selectedAnimal.animal_key || selectedAnimal.rgn, {
        partnership: "",
      });
      setSelectedNames([]);
      setConfirmModalOpen(false);
    } catch (err) {
      console.error("Erro ao limpar sociedade:", err);
      setError("Erro ao limpar sociedade");
    }
  };

  const togglePartnership = (name: string) => {
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  if (!selectedAnimal) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
        <p className="text-muted-foreground font-medium">
          Selecione um animal acima para gerenciar sua sociedade.
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

        <div className="flex flex-row justify-between items-end gap-2 w-full">
          <div className="p-3 flex-1 rounded-xl bg-primary/5 border border-primary/10 flex flex-col gap-0.5">
            <span className="text-[9px] font-bold uppercase text-primary/60 tracking-wider">
              Vínculos Atuais:
            </span>
            <span className="text-base font-black text-primary uppercase">
              {selectedAnimal.partnership || "Nenhuma"}
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

        <PartnershipSelector
          selectedPartnershipNames={selectedNames}
          onToggle={togglePartnership}
        />

        <Button
          variant="default"
          type="submit"
          className="w-full text-sm font-bold py-4 rounded-xl mt-2 uppercase shadow-lg shadow-primary/10 active:scale-[0.98] transition-all"
        >
          Confirmar Alteração
        </Button>
      </form>

      <PartnershipSuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
      />

      <ConfirmActionModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Limpar Sociedade"
        description="Tem certeza que deseja remover todos os vínculos de sociedade deste animal?"
      />
    </div>
  );
};
