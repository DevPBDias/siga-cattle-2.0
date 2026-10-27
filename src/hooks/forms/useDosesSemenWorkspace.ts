"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSemenDoses, useCreateDose, useUpdateDose, useDeleteDose } from "@/hooks/db/doses";
import { useDoseLocalState } from "@/hooks/doses/useDoseLocalState";
import { DoseSortOption } from "@/types/semen_dose.type";
import { SemenDose } from "@/types/semen_dose.type";

export function useDosesSemenWorkspace() {
  const { data: doses = [], loading: isLoading } = useSemenDoses();
  const { actions: { createDose } } = useCreateDose();
  const { actions: { updateDose } } = useUpdateDose();
  const { actions: { deleteDose } } = useDeleteDose();
  const localState = useDoseLocalState(doses);

  const [selectedBreed, setSelectedBreed] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<DoseSortOption>("name-asc");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalDoseId, setEditModalDoseId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("doses");

  const doseToDelete = useMemo(() => {
    if (!deleteConfirmId) return null;
    return localState.displayDoses.find((d) => d.id === deleteConfirmId) ?? null;
  }, [deleteConfirmId, localState.displayDoses]);

  const doseToEdit = useMemo(() => {
    if (!editModalDoseId) return null;
    return localState.displayDoses.find((d) => d.id === editModalDoseId) ?? null;
  }, [editModalDoseId, localState.displayDoses]);

  const filteredDoses = useMemo(() => {
    let result = [...localState.displayDoses];
    if (selectedBreed) result = result.filter((d) => d.breed === selectedBreed);
    result.sort((a, b) => {
      const nameA = a.animal_name ?? "";
      const nameB = b.animal_name ?? "";
      switch (sortBy) {
        case "name-asc":
          return nameA.localeCompare(nameB);
        case "name-desc":
          return nameB.localeCompare(nameA);
        case "qty-asc":
          return (a.quantity ?? 0) - (b.quantity ?? 0);
        case "qty-desc":
          return (b.quantity ?? 0) - (a.quantity ?? 0);
        default:
          return 0;
      }
    });
    return result;
  }, [localState.displayDoses, selectedBreed, sortBy]);

  const groupedByBreed = useMemo(() => {
    const groups = new Map<string, typeof filteredDoses>();
    for (const dose of filteredDoses) {
      const existing = groups.get(dose.breed) || [];
      groups.set(dose.breed, [...existing, dose]);
    }
    return groups;
  }, [filteredDoses]);

  const breeds = useMemo(
    () => [...new Set(doses.map((d) => d.breed))].sort(),
    [doses],
  );

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const changes = localState.getChanges();
      for (const update of changes.updates) await updateDose(update.id, update);
      for (const id of changes.deletions) await deleteDose(id);
      for (const dose of changes.creations) {
        await createDose({
          animal_name: dose.animal_name,
          breed: dose.breed,
          quantity: dose.quantity,
          animal_image: dose.animal_image,
          father_name: dose.father_name,
          maternal_grandfather_name: dose.maternal_grandfather_name,
          iabcz: dose.iabcz,
          registration: dose.registration,
          center_name: dose.center_name,
        });
      }
      localState.clearAfterSave();
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      const message = "Erro ao salvar alterações. Tente novamente.";
      setSaveError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    data: {
      groupedByBreed,
      breeds,
      doseToDelete,
      doseToEdit,
    },
    loading: isLoading,
    error: saveError,
    actions: {
      activeTab,
      setActiveTab,
      selectedBreed,
      setSelectedBreed,
      sortBy,
      setSortBy,
      filterSheetOpen,
      setFilterSheetOpen,
      addModalOpen,
      setAddModalOpen,
      editModalDoseId,
      setEditModalDoseId,
      deleteConfirmId,
      setDeleteConfirmId,
      isSaving,
      hasChanges: localState.hasChanges,
      changeCount: localState.changeCount,
      handleSave,
      revert: localState.revert,
      handleConfirmDelete: () => {
        if (deleteConfirmId) {
          localState.markForDeletion(deleteConfirmId);
          setDeleteConfirmId(null);
        }
      },
      handleAddDose: (
        data: Omit<SemenDose, "id" | "updated_at" | "_deleted" | "created_at">,
      ) => localState.addLocalDose(data),
      handleEditDose: (data: Partial<SemenDose>) => {
        if (!editModalDoseId) return;
        localState.updateLocalDose(editModalDoseId, data);
      },
    },
  };
}
