"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReproductionForm } from "./ReproductionForm";
import { useCreateReproductionEvent } from "@/hooks/db/reproduction_event/useCreateReproductionEvent";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { useSemenDoses } from "@/hooks/db/doses/useSemenDoses";
import { useUpdateDose } from "@/hooks/db/doses/useUpdateDose";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateReproductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rgn: string;
  onSuccess?: () => void;
}

export function CreateReproductionModal({
  isOpen,
  onClose,
  rgn,
  onSuccess,
}: CreateReproductionModalProps) {
  const {
    actions: { createReproductionEvent: createEvent },
    loading: isLoading,
  } = useCreateReproductionEvent();
  const { data: doses = [] } = useSemenDoses();
  const {
    actions: { updateQuantity },
  } = useUpdateDose();

  const handleSubmit = async (data: Partial<ReproductionEvent>) => {
    try {
      // 1. Criar o evento
      await createEvent({
        ...(data as any),
        rgn,
      });

      // 2. Subtrair doses do estoque (Touro D0 e Resync)
      // Se o touro resync for o mesmo do D0, debita 2 vezes do mesmo touro
      const bullD0 = data.bull_name;
      const bullResync = data.resync_bull;

      // Debitar do touro D0
      if (bullD0) {
        const doseD0 = doses.find((d) => d.animal_name === bullD0);
        if (doseD0 && doseD0.quantity > 0) {
          const quantityToDebit = bullD0 === bullResync ? 2 : 1;
          console.log(
            `📉 Criando evento: Subtraindo ${quantityToDebit} dose(s) de ${bullD0} (ID: ${doseD0.id})`,
          );
          await updateQuantity(doseD0.id, doseD0.quantity - quantityToDebit);
        }
      }

      // Debitar do touro Resync apenas se for diferente do D0
      if (bullResync && bullResync !== bullD0) {
        const doseResync = doses.find((d) => d.animal_name === bullResync);
        if (doseResync && doseResync.quantity > 0) {
          console.log(
            `📉 Criando evento: Subtraindo 1 dose de ${bullResync} (ID: ${doseResync.id})`,
          );
          await updateQuantity(doseResync.id, doseResync.quantity - 1);
        }
      }
      toast.success("Evento de reprodução cadastrado com sucesso!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      toast.error("Erro ao cadastrar evento de reprodução.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" hideDefaultClose>
        <DialogHeader className="flex flex-row items-center justify-between pr-0">
          <DialogTitle className="text-primary font-bold uppercase">
            Novo Evento de Reprodução
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
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onCancel={onClose}
          initialData={{ rgn }}
        />
      </DialogContent>
    </Dialog>
  );
}
