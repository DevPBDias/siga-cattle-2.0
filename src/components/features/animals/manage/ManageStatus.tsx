"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatusSelector } from "@/components/features/animals/status/StatusSelector";
import {
  useStatuses,
  useCreateStatus,
  useDeleteStatus,
} from "@/hooks/db/statuses";
import { useUpdateAnimal } from "@/hooks/db/animals/useUpdateAnimal";
import { Animal } from "@/types/animal.type";
import { StatusSuccessModal } from "@/components/features/animals/modals/status/StatusSuccessModal";
import { AddStatusModal } from "@/components/features/animals/modals/status/AddStatusModal";
import { DeleteStatusModal } from "@/components/features/animals/modals/status/DeleteStatusModal";
import { FeatureErrorBoundary } from "@/components/ui/FeatureErrorBoundary";

interface ManageStatusProps {
  selectedAnimal: Animal | null;
  onSuccess?: () => void;
}

export const ManageStatus = (props: ManageStatusProps) => {
  return (
    <FeatureErrorBoundary featureName="Gerenciar Status">
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
  const { data: statuses = [], loading: isLoading } = useStatuses();
  const {
    actions: { createStatus },
  } = useCreateStatus();
  const {
    actions: { deleteStatus },
  } = useDeleteStatus();

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatusNames, setSelectedStatusNames] = useState<string[]>([]);

  useEffect(() => {
    if (selectedAnimal?.status && statuses.length > 0) {
      const animalStatusParts = selectedAnimal.status.split(" / ");
      const validStatusNames = statuses.map((s) => s.status_name);

      setSelectedStatusNames(
        animalStatusParts.filter(
          (s) =>
            s && s !== "-" && s !== "Nenhum" && validStatusNames.includes(s),
        ),
      );
    } else if (selectedAnimal) {
      setSelectedStatusNames([]);
    }
  }, [selectedAnimal, statuses]);

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
      console.error("Erro ao atualizar status:", err);
      setError("Erro ao atualizar status");
    }
  };

  const handleCreateStatus = async (name: string) => {
    try {
      await createStatus({ status_name: name });
    } catch (err) {
      console.error("Erro ao criar status:", err);
      setError("Erro ao criar status");
    }
  };

  const handleDeleteStatus = async (id: string) => {
    try {
      await deleteStatus(id);
      const status = statuses.find((s) => s.id === id);
      if (status && selectedStatusNames.includes(status.status_name)) {
        setSelectedStatusNames((prev) =>
          prev.filter((name) => name !== status.status_name),
        );
      }
    } catch (err) {
      console.error("Erro ao deletar status:", err);
      setError("Erro ao deletar status");
    }
  };

  if (!selectedAnimal) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
        <p className="text-muted-foreground font-medium">
          Selecione um animal acima para gerenciar seu status.
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
            Status Atual:
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
          statuses={statuses}
          loading={isLoading}
          selectedStatusNames={selectedStatusNames}
          onToggle={setSelectedStatusNames}
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

      <StatusSuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
      />

      <AddStatusModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleCreateStatus}
      />

      <DeleteStatusModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        statuses={statuses}
        onDelete={handleDeleteStatus}
      />
    </div>
  );
};
