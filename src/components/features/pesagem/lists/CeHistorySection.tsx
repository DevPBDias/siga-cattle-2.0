"use client";

import { AddPesoModal } from "@/components/features/animals/modals/weight-ce-modal/AddPesoModal";
import { CircunfList } from "@/components/features/animals/lists/CircunfList";
import { AnimalMetric } from "@/types/animal_metrics.type";

interface CeHistorySectionProps {
  bornDate?: string;
  lastValue?: number;
  isBorn: boolean;
  setIsBorn: (value: boolean) => void;
  medidas: AnimalMetric[];
  onAdd: (date: string, valor: number) => void;
  onEdit: (id: string, valor: number) => void;
  onDelete: (id: string) => void;
}

export function CeHistorySection({
  bornDate,
  lastValue,
  isBorn,
  setIsBorn,
  medidas,
  onAdd,
  onEdit,
  onDelete,
}: CeHistorySectionProps) {
  return (
    <section className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-primary font-bold text-xs uppercase w-full text-left">
          Histórico de Perímetro
        </h2>
        <AddPesoModal
          type="circunferencia"
          onAddPeso={onAdd}
          isBorn={isBorn}
          setIsBorn={setIsBorn}
          bornDate={bornDate}
          lastValue={lastValue}
        />
      </div>

      {medidas.length > 0 ? (
        <CircunfList deleteCE={onDelete} editCE={onEdit} CEMedidos={medidas} />
      ) : (
        <div className="mt-8 text-center text-muted-foreground bg-muted/20 py-8 rounded-xl border border-dashed border-border">
          Nenhuma medição registrada ainda.
        </div>
      )}
    </section>
  );
}
