"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReproductionForm } from "./ReproductionForm";
import { useUpdateReproductionEvent } from "@/hooks/db/reproduction_event/useUpdateReproductionEvent";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { useSemenDoses } from "@/hooks/db/doses/useSemenDoses";
import { useUpdateDose } from "@/hooks/db/doses/useUpdateDose";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditReproductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ReproductionEvent;
  onSuccess?: () => void;
}

export function EditReproductionModal({
  isOpen,
  onClose,
  event,
  onSuccess,
}: EditReproductionModalProps) {
  const {
    actions: { updateReproductionEvent: updateEvent },
    loading: isLoading,
  } = useUpdateReproductionEvent();
  const { data: doses = [] } = useSemenDoses();
  const {
    actions: { updateQuantity },
  } = useUpdateDose();

  const handleSubmit = async (data: Partial<ReproductionEvent>) => {
    try {
      // 1. Gerenciar débito/devolução de doses apenas quando touros mudarem
      const oldBullD0 = event.bull_name || "";
      const oldBullResync = event.resync_bull || "";
      const newBullD0 = data.bull_name ?? oldBullD0;
      const newBullResync = data.resync_bull ?? oldBullResync;

      // Calcular quantas doses cada touro tinha debitadas antes
      const getOldDebitedQuantity = (bullName: string): number => {
        if (!bullName) return 0;
        if (bullName === oldBullD0 && bullName === oldBullResync) return 2;
        if (bullName === oldBullD0 || bullName === oldBullResync) return 1;
        return 0;
      };

      // Calcular quantas doses cada touro deve ter debitadas agora
      const getNewDebitedQuantity = (bullName: string): number => {
        if (!bullName) return 0;
        if (bullName === newBullD0 && bullName === newBullResync) return 2;
        if (bullName === newBullD0 || bullName === newBullResync) return 1;
        return 0;
      };

      // Obter todos os touros únicos (antigos e novos)
      const allBulls = new Set([
        oldBullD0,
        oldBullResync,
        newBullD0,
        newBullResync,
      ].filter(Boolean));

      // Para cada touro, calcular a diferença e ajustar
      for (const bullName of allBulls) {
        const oldQty = getOldDebitedQuantity(bullName);
        const newQty = getNewDebitedQuantity(bullName);
        const difference = newQty - oldQty;

        if (difference !== 0) {
          const dose = doses.find((d) => d.animal_name === bullName);
          if (dose) {
            const newQuantity = dose.quantity - difference;
            if (newQuantity >= 0) {
              if (difference > 0) {
                console.log(
                  `📉 Edit: Subtraindo ${difference} dose(s) de ${bullName} (ID: ${dose.id})`
                );
              } else {
                console.log(
                  `📈 Edit: Devolvendo ${Math.abs(difference)} dose(s) para ${bullName} (ID: ${dose.id})`
                );
              }
              await updateQuantity(dose.id, newQuantity);
            } else {
              console.warn(
                `⚠️ Edit: Não é possível debitar ${Math.abs(difference)} dose(s) de ${bullName} - estoque insuficiente`
              );
            }
          }
        }
      }

      // 2. Atualizar o evento
      await updateEvent(event.event_id, {
        ...data,
      });
      toast.success("Evento de reprodução atualizado com sucesso!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      toast.error("Erro ao atualizar evento de reprodução.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" hideDefaultClose>
        <DialogHeader className="flex flex-row items-center justify-between pr-0">
          <DialogTitle className="text-primary font-bold uppercase">
            Editar Evento de Reprodução
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fechar"
            className="h-8 w-8 p-0 rounded-md text-destructive border border-destructive/40 hover:bg-destructive hover:text-white transition-all"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <ReproductionForm
          initialData={event}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isEdit
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
