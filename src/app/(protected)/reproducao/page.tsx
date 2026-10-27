"use client";

import ShortHeader from "@/components/layout/ShortHeader";
import { ReproductionSelector } from "@/components/features/reproduction/lists/ReproductionSelector";
import { ReproductionEventList } from "@/components/features/reproduction/lists/ReproductionEventList";
import { CreateReproductionModal } from "@/components/features/reproduction/modals/reproduction/CreateReproductionModal";
import { EditReproductionModal } from "@/components/features/reproduction/modals/reproduction/EditReproductionModal";
import { DeleteReproductionModal } from "@/components/features/reproduction/modals/reproduction/DeleteReproductionModal";
import { useReproductionList } from "@/hooks/forms/useReproductionList";

export default function ReproducaoPage() {
  const { data, loading, actions } = useReproductionList();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background pb-12">
      <ShortHeader title="Reprodução" />

      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 no-scrollbar">
        <ReproductionSelector
          selectedMatriz={data.selectedMatriz}
          rgnOptions={data.rgnOptions}
          selectedRgn={actions.selectedRgn}
          loading={loading.matrizesLoading}
          onSelect={actions.setSelectedRgn}
          onClear={actions.clearSelection}
        />

        {data.selectedMatriz && (
          <ReproductionEventList
            matriz={data.selectedMatriz}
            events={data.reproductionEvents}
            loading={loading.eventsLoading}
            onCreate={() => actions.setIsCreateModalOpen(true)}
            onEdit={actions.handleEditEvent}
            onDelete={actions.handleDeleteEvent}
          />
        )}
      </main>

      {data.selectedMatriz && (
        <CreateReproductionModal
          isOpen={actions.isCreateModalOpen}
          onClose={() => actions.setIsCreateModalOpen(false)}
          rgn={data.selectedMatriz.rgn}
        />
      )}

      {actions.eventToEdit && (
        <EditReproductionModal
          isOpen={actions.isEditModalOpen}
          onClose={actions.closeEdit}
          event={actions.eventToEdit}
        />
      )}

      {actions.eventToDelete && (
        <DeleteReproductionModal
          isOpen={actions.isDeleteModalOpen}
          onClose={actions.closeDelete}
          event={actions.eventToDelete}
        />
      )}
    </div>
  );
}
