"use client";

import { Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DosesList } from "./DosesList";
import { SaveBar } from "./SaveBar";
import { FilterBottomSheet } from "./FilterBottomSheet";
import { AddDoseModal } from "./AddDoseModal";
import { EditDoseModal } from "./EditDoseModal";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";
import { useDosesSemenWorkspace } from "@/hooks/forms/useDosesSemenWorkspace";

type CatalogState = ReturnType<typeof useDosesSemenWorkspace>;

interface DosesCatalogTabProps {
  workspace: CatalogState;
}

export function DosesCatalogTab({ workspace }: DosesCatalogTabProps) {
  const { data, loading, error, actions } = workspace;

  return (
    <>
      {error && (
        <div className="mx-4 mt-4 bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
        <Button
          type="button"
          variant="outline"
          onClick={() => actions.setFilterSheetOpen(true)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtrar
          {actions.selectedBreed && (
            <span className="ml-1 px-1.5 py-0.5 bg-primary text-white text-xs rounded">
              1
            </span>
          )}
        </Button>
        <Button type="button" onClick={() => actions.setAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      <DosesList
        groupedDoses={data.groupedByBreed}
        isLoading={loading}
        onEdit={(id) => actions.setEditModalDoseId(id)}
        onDelete={(id) => actions.setDeleteConfirmId(id)}
        selectedBreed={actions.selectedBreed}
      />

      {actions.hasChanges && (
        <SaveBar
          onSave={actions.handleSave}
          onCancel={actions.revert}
          isSaving={actions.isSaving}
          changeCount={actions.changeCount}
        />
      )}

      <FilterBottomSheet
        open={actions.filterSheetOpen}
        onClose={() => actions.setFilterSheetOpen(false)}
        breeds={data.breeds}
        selectedBreed={actions.selectedBreed}
        onBreedSelect={actions.setSelectedBreed}
        sortBy={actions.sortBy}
        onSortChange={actions.setSortBy}
      />

      <AddDoseModal
        open={actions.addModalOpen}
        onClose={() => actions.setAddModalOpen(false)}
        onAdd={actions.handleAddDose}
        existingBreeds={data.breeds}
      />

      <EditDoseModal
        open={!!actions.editModalDoseId}
        onClose={() => actions.setEditModalDoseId(null)}
        dose={data.doseToEdit}
        onSave={actions.handleEditDose}
        existingBreeds={data.breeds}
      />

      <ConfirmActionModal
        open={!!actions.deleteConfirmId}
        onClose={() => actions.setDeleteConfirmId(null)}
        onConfirm={actions.handleConfirmDelete}
        title="Excluir Animal"
        description={
          data.doseToDelete
            ? `Tem certeza que deseja remover "${data.doseToDelete.animal_name}" da lista? Esta ação será aplicada ao salvar.`
            : "Tem certeza que deseja remover este animal?"
        }
      />
    </>
  );
}
