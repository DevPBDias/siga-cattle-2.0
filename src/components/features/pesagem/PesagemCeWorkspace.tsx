"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { StandardTabList } from "@/components/ui/StandardTabList";
import { SuccessModal } from "@/components/modals/SuccessModal";
import { AnimalManageSelector } from "@/components/features/animals/manage/AnimalManageSelector";
import { WeightHistorySection } from "@/components/features/pesagem/lists/WeightHistorySection";
import { CeHistorySection } from "@/components/features/pesagem/lists/CeHistorySection";
import { usePesagemCe } from "@/hooks/forms/usePesagemCe";
import { Scale, Ruler } from "lucide-react";

const TABS = [
  { value: "pesagem", label: "Pesagem", icon: Scale },
  { value: "circunferencia", label: "Perím. Escrotal", icon: Ruler },
];

export function PesagemCeWorkspace() {
  const { data, loading, error, actions } = usePesagemCe();

  return (
    <>
      <div className="flex flex-col gap-8 px-6 py-8">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}

        <AnimalManageSelector
          selectedAnimal={data.selectedAnimal}
          rgnOptions={data.rgnOptions}
          selectedRgn={actions.rgn}
          onSelect={actions.setRgn}
          onClear={actions.clearSelection}
        />
      </div>

      {data.selectedAnimal && !loading && (
        <div className="w-full px-6 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Tabs value={actions.type} onValueChange={actions.setType} className="w-full">
            <StandardTabList
              tabs={TABS}
              activeTab={actions.type}
              variant="simple"
              className="mb-4"
            />

            <TabsContent value="pesagem" className="mt-0">
              <WeightHistorySection
                bornDate={data.selectedAnimal.born_date}
                lastValue={data.pesosMedidos[data.pesosMedidos.length - 1]?.value}
                isBorn={actions.isBorn}
                setIsBorn={actions.setIsBorn}
                pesos={data.pesosMedidos}
                onAdd={actions.handleAddPeso}
                onEdit={actions.handleEditPeso}
                onDelete={actions.handleDeletePeso}
              />
            </TabsContent>

            <TabsContent value="circunferencia" className="mt-0">
              <CeHistorySection
                bornDate={data.selectedAnimal.born_date}
                lastValue={
                  data.circunferenciaEscrotal[data.circunferenciaEscrotal.length - 1]?.value
                }
                isBorn={actions.isBorn}
                setIsBorn={actions.setIsBorn}
                medidas={data.circunferenciaEscrotal}
                onAdd={actions.handleAddCE}
                onEdit={actions.handleEditCE}
                onDelete={actions.handleDeleteCE}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      <SuccessModal
        open={data.successModal.open}
        onClose={actions.closeSuccess}
        title={data.successModal.title}
      />
    </>
  );
}
