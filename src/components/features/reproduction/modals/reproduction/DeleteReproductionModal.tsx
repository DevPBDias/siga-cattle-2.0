"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteReproductionEvent } from "@/hooks/db/reproduction_event/useDeleteReproductionEvent";
import { Loader2, Trash2 } from "lucide-react";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { formatDate } from "@/utils/dates";
import { toast } from "sonner";

interface DeleteReproductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ReproductionEvent;
  onSuccess?: () => void;
}

export function DeleteReproductionModal({
  isOpen,
  onClose,
  event,
  onSuccess,
}: DeleteReproductionModalProps) {
  const {
    actions: { deleteReproductionEvent: deleteEvent },
    loading: isLoading,
  } = useDeleteReproductionEvent();

  const handleDelete = async () => {
    try {
      await deleteEvent(event.event_id);
      toast.success("Evento de reprodução excluído com sucesso!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao deletar evento:", error);
      toast.error("Erro ao excluir evento de reprodução.");
    }
  };

  const d10Date = event.d10_date || event.d0_date;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600 font-bold uppercase flex items-center gap-2">
            <Trash2 className="w-5 h-5" /> Excluir Evento
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir este evento de reprodução? Esta ação
            não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2 border border-border">
          <div className="flex justify-between">
            <span className="font-bold text-muted-foreground uppercase text-xs">
              Tipo
            </span>
            <span className="font-semibold text-foreground">
              {event.event_type}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-muted-foreground uppercase text-xs">
              Data D10
            </span>
            <span className="font-semibold text-foreground">
              {d10Date ? formatDate(d10Date) : "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-muted-foreground uppercase text-xs">
              Touro
            </span>
            <span className="font-semibold text-foreground">
              {event.bull_name || "-"}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="uppercase font-bold text-xs"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="uppercase font-bold text-xs"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              "Sim, Excluir"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

