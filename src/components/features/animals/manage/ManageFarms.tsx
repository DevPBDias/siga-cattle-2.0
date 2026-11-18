"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FarmSelector } from "@/components/features/farm/farms/FarmSelector";
import { useFarms } from "@/hooks/db/farms/useFarms";
import { useCreateFarm } from "@/hooks/db/farms/useCreateFarm";
import { useDeleteFarm } from "@/hooks/db/farms/useDeleteFarm";
import { useUpdateAnimal } from "@/hooks/db/animals/useUpdateAnimal";
import { Animal } from "@/types/animal.type";
import { AddFarmModal } from "@/components/features/farm/modals/farm/AddFarmModal";
import { DeleteFarmModal } from "@/components/features/farm/modals/farm/DeleteFarmModal";
import { FarmSuccessModal } from "@/components/features/farm/modals/farm/FarmSuccessModal";
import { FeatureErrorBoundary } from "@/components/ui/FeatureErrorBoundary";

interface ManageFarmsProps {
  selectedAnimal: Animal | null;
  onSuccess?: () => void;
}

export const ManageFarms = (props: ManageFarmsProps) => {
  return (
    <FeatureErrorBoundary featureName="Gerenciar Fazenda">
      <ManageFarmsContent {...props} />
    </FeatureErrorBoundary>
  );
};

const ManageFarmsContent = ({
  selectedAnimal,
  onSuccess,
}: ManageFarmsProps) => {
  const {
    actions: { updateAnimal },
  } = useUpdateAnimal();
  const {
    data: farms = [],
    loading: isLoading,
    error: farmsError,
  } = useFarms();
  const {
    actions: { createFarm },
  } = useCreateFarm();
  const {
    actions: { deleteFarm },
  } = useDeleteFarm();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAnimal) {
      setSelectedFarmId(selectedAnimal.farm_id || null);
    } else {
      setSelectedFarmId(null);
    }
  }, [selectedAnimal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal) return;
    setError(null);

    try {
      await updateAnimal(selectedAnimal.animal_key || selectedAnimal.rgn, {
        farm_id: selectedFarmId || undefined,
      });
      setSuccessModalOpen(true);
      onSuccess?.();
    } catch (err) {
      console.error("Erro ao atualizar fazenda:", err);
      setError("Erro ao atualizar fazenda");
    }
  };

  const handleCreateFarm = async (name: string) => {
    try {
      await createFarm({ farm_name: name });
    } catch (err) {
      console.error("Erro ao criar fazenda:", err);
      setError("Erro ao criar fazenda");
    }
  };

  const handleDeleteFarm = async (id: string) => {
    try {
      await deleteFarm(id);
      if (selectedFarmId === id) setSelectedFarmId(null);
    } catch (err) {
      console.error("Erro ao deletar fazenda:", err);
      setError("Erro ao deletar fazenda");
    }
  };

  if (!selectedAnimal) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
        <p className="text-muted-foreground font-medium">
          Selecione um animal acima para gerenciar sua fazenda.
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
            Fazenda Atual:
          </span>
          <span className="text-base font-black text-primary uppercase">
            {farms.find((f) => f.id === selectedAnimal.farm_id)?.farm_name ||
              "Nenhuma"}
          </span>
        </div>

        <FarmSelector
          farms={farms}
          loading={isLoading}
          selectedFarmId={selectedFarmId}
          onToggle={setSelectedFarmId}
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

      <FarmSuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
      />

      <AddFarmModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleCreateFarm}
      />

      <DeleteFarmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        farms={farms}
        onDelete={handleDeleteFarm}
      />
    </div>
  );
};
