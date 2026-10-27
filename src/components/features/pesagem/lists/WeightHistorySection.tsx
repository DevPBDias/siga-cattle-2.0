"use client";

import { AddPesoModal } from "@/components/features/animals/modals/weight-ce-modal/AddPesoModal";
import { WeightList } from "@/components/features/animals/lists/WeightList";
import { AnimalMetric } from "@/types/animal_metrics.type";

interface WeightHistorySectionProps {
  bornDate?: string;
  lastValue?: number;
  isBorn: boolean;
  setIsBorn: (value: boolean) => void;
  pesos: AnimalMetric[];
  onAdd: (date: string, valor: number) => void;
  onEdit: (id: string, valor: number) => void;
  onDelete: (id: string) => void;
}

export function WeightHistorySection({
  bornDate,
  lastValue,
  isBorn,
  setIsBorn,
  pesos,
  onAdd,
  onEdit,
  onDelete,
}: WeightHistorySectionProps) {
  return (
    <section className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-primary font-bold text-xs uppercase w-full text-left">
          Histórico de Pesos
        </h2>
        <AddPesoModal
          type="peso"
          onAddPeso={onAdd}
          isBorn={isBorn}
          setIsBorn={setIsBorn}
          bornDate={bornDate}
          lastValue={lastValue}
        />
      </div>

      {pesos.length > 0 ? (
        <WeightList
          deletePeso={onDelete}
          editPeso={onEdit}
          pesosMedidos={pesos}
          gainDaily={[]}
        />
      ) : (
        <div className="mt-8 text-center text-muted-foreground bg-muted/20 py-8 rounded-xl border border-dashed border-border">
          Nenhum peso registrado ainda.
        </div>
      )}
    </section>
  );
}
