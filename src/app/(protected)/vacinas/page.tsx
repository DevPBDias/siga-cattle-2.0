"use client";

import ShortHeader from "@/components/layout/ShortHeader";
import { DatePicker } from "@/components/ui/date-picker";
import { AddVaccineModal } from "@/components/features/vaccines/modals/vaccines/AddVaccineModal";
import { DeleteVaccineModal } from "@/components/features/vaccines/modals/vaccines/DeleteVaccineModal";
import { VaccineSuccessModal } from "@/components/features/vaccines/modals/vaccines/VaccineSuccessModal";
import { VaccineSelectionCard } from "@/components/features/vaccines/form/VaccineSelectionCard";
import { AnimalIdentificationCard } from "@/components/features/vaccines/form/AnimalIdentificationCard";
import { VaccineReviewModal } from "@/components/features/vaccines/modals/VaccineReviewModal";
import { VaccineFormActions } from "@/components/features/vaccines/form/VaccineFormActions";
import { useVaccineForm } from "@/hooks/forms/useVaccineForm";
import { getDeviceHomeRoute } from "@/hooks/use-mobile";

export default function VaccinesPage() {
  const {
    vaccines, isLoading, rgnOptions,
    existingVaccinesWithNames, duplicateWarnings, loadingAnimalVaccines,
    formData, setFormData, multipleAnimals, setMultipleAnimals,
    error, isSubmitting,
    successModalOpen, addModalOpen, deleteModalOpen, reviewModalOpen,
    setAddModalOpen, setDeleteModalOpen, setReviewModalOpen,
    handleOpenReview, handleConfirmRegister, handleCloseSuccess,
    handleCreateVaccine, handleDeleteVaccine, toggleVaccine, router,
  } = useVaccineForm();

  return (
    <main className="h-[100dvh] min-h-[100dvh] overflow-hidden bg-background pb-[82px] flex flex-col">
      <ShortHeader title="Vacinação" />

      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 pb-8">
        <form onSubmit={handleOpenReview} className="space-y-4">
          {/* Erro global do formulário */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-3.5 py-2.5 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Seleção de vacinas */}
          <VaccineSelectionCard
            vaccines={vaccines}
            loading={isLoading}
            selected={formData.vacinas}
            onToggle={toggleVaccine}
            onAddClick={() => setAddModalOpen(true)}
            onDeleteClick={() => setDeleteModalOpen(true)}
          />

          {/* Identificação do animal */}
          <AnimalIdentificationCard
            rgn={formData.rgn}
            multipleAnimals={multipleAnimals}
            rgnOptions={rgnOptions}
            existingVaccines={existingVaccinesWithNames}
            loadingHistory={loadingAnimalVaccines}
            duplicateWarnings={duplicateWarnings}
            onRgnChange={(rgn) => setFormData((prev) => ({ ...prev, rgn }))}
            onMultipleAnimalsChange={setMultipleAnimals}
          />

          {/* Data da vacinação */}
          <section className="p-3.5 border border-border rounded-[15px] bg-card shadow-xs">
            <DatePicker
              label="Data da vacinação *"
              value={formData.data}
              onChange={(value) => setFormData((prev) => ({ ...prev, data: value }))}
              required
            />
          </section>

          <VaccineFormActions
            isSubmitting={isSubmitting}
            onCancel={() => router.push(getDeviceHomeRoute())}
          />
        </form>
      </div>

      {/* Modais */}
      <VaccineReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onConfirm={handleConfirmRegister}
        isSubmitting={isSubmitting}
        vacinas={formData.vacinas}
        rgn={formData.rgn}
        data={formData.data}
        multipleAnimals={multipleAnimals}
      />

      <VaccineSuccessModal
        open={successModalOpen}
        onClose={handleCloseSuccess}
        onNavigateHome={() => { handleCloseSuccess(); router.push(getDeviceHomeRoute()); }}
      />

      <AddVaccineModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleCreateVaccine}
      />

      <DeleteVaccineModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        vaccines={vaccines}
        onDelete={handleDeleteVaccine}
      />
    </main>
  );
}
