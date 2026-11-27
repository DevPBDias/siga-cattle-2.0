"use client";

import ShortHeader from "@/components/layout/ShortHeader";
import { AnimalManageSelector } from "@/components/features/animals/manage/AnimalManageSelector";
import { EditAnimalManagementLayout } from "@/components/features/animals/manage/EditAnimalManagementLayout";
import { useAnimalManage } from "@/hooks/forms/useAnimalManage";

export default function GerenciarPage() {
  const { data, actions } = useAnimalManage();

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background pb-12">
      <ShortHeader title="Gestão Animal" />

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 no-scrollbar">
        <div className="mx-auto w-full max-w-lg space-y-2.5">
          <AnimalManageSelector
            selectedAnimal={data.selectedAnimal}
            rgnOptions={data.rgnOptions}
            selectedRgn={actions.selectedRgn}
            onSelect={actions.setSelectedRgn}
            onClear={actions.clearSelection}
          />

          {data.selectedAnimal && (
            <EditAnimalManagementLayout
              animal={data.selectedAnimal}
            />
          )}
        </div>
      </div>
    </main>
  );
}
