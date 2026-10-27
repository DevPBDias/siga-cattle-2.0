"use client";

import ShortHeader from "@/components/layout/ShortHeader";
import { AnimalManageSelector } from "@/components/features/animals/manage/AnimalManageSelector";
import { AnimalManageTabs } from "@/components/features/animals/manage/AnimalManageTabs";
import { useAnimalManage } from "@/hooks/forms/useAnimalManage";

export default function GerenciarPage() {
  const { data, actions } = useAnimalManage();

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background pb-12">
      <ShortHeader title="Gestão Animal" />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 no-scrollbar">
        <AnimalManageSelector
          selectedAnimal={data.selectedAnimal}
          rgnOptions={data.rgnOptions}
          selectedRgn={actions.selectedRgn}
          onSelect={actions.setSelectedRgn}
          onClear={actions.clearSelection}
        />

        {data.selectedAnimal && (
          <AnimalManageTabs
            animal={data.selectedAnimal}
            activeTab={actions.activeTab}
            onTabChange={actions.setActiveTab}
          />
        )}
      </div>
    </main>
  );
}
