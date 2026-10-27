"use client";

import { formatDate } from "@/utils/dates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface VaccineReviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  vacinas: string[];
  rgn: string;
  data: string;
  multipleAnimals: boolean;
}

export function VaccineReviewModal({
  open,
  onClose,
  onConfirm,
  isSubmitting,
  vacinas,
  rgn,
  data,
  multipleAnimals,
}: VaccineReviewModalProps) {
  const animaisLabel = multipleAnimals
    ? rgn.split(/[\n,;]+/).filter(Boolean).join(", ")
    : rgn;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm bg-card rounded-2xl border border-border/60 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-extrabold uppercase text-primary">
            Revisão da Vacinação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-xs text-primary py-1">
          <p>
            <span className="text-muted-foreground font-semibold">Vacina(s): </span>
            <strong>{vacinas.join(", ")}</strong>
          </p>
          <p>
            <span className="text-muted-foreground font-semibold">Animal(is): </span>
            <strong>{animaisLabel}</strong>
          </p>
          <p>
            <span className="text-muted-foreground font-semibold">Data: </span>
            <strong>{formatDate(data)}</strong>
          </p>
        </div>

        <DialogFooter className="flex flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Voltar
          </Button>
          <Button
            className="flex-1 rounded-xl"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
