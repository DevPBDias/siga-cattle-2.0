"use client";

import { formatDate } from "@/utils/dates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface BirthReviewData {
  sexo: string;
  rgn: string;
  isAutoRgn: boolean;
  data: string;
  peso: string;
  mae: string;
  farmName: string;
  cor: string;
  raca: string;
}

interface BirthReviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  reviewData: BirthReviewData;
}

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 border-b border-border/50 py-1.5 last:border-b-0">
    <span className="text-[11px] font-bold uppercase text-muted-foreground">
      {label}
    </span>
    <span className="text-right text-xs font-semibold text-primary">
      {value}
    </span>
  </div>
);

export function BirthReviewModal({
  open,
  onClose,
  onConfirm,
  isSubmitting,
  reviewData,
}: BirthReviewModalProps) {
  const pesoLabel = reviewData.peso.trim()
    ? `${reviewData.peso.trim()} kg`
    : "Não informado";
  const rgnLabel = reviewData.isAutoRgn
    ? `${reviewData.rgn} (automático)`
    : reviewData.rgn;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="max-w-sm rounded-2xl border border-border/60 bg-card shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-extrabold uppercase text-primary">
            Revisão do Nascimento
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Confira se todas as informações estão corretas antes de registrar.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-1.5">
          <ReviewRow label="Sexo" value={reviewData.sexo || "-"} />
          <ReviewRow label="RGN (Bezerro)" value={rgnLabel || "-"} />
          <ReviewRow
            label="Data de nascimento"
            value={formatDate(reviewData.data) || "-"}
          />
          <ReviewRow label="Peso ao nascer" value={pesoLabel} />
          <ReviewRow label="RGN da mãe" value={reviewData.mae || "-"} />
          <ReviewRow label="Fazenda" value={reviewData.farmName || "-"} />
          <ReviewRow label="Pelagem / Cor" value={reviewData.cor || "-"} />
          <ReviewRow label="Raça" value={reviewData.raca || "-"} />
        </div>

        <DialogFooter className="flex flex-row gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Voltar e editar
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-xl bg-primary text-white hover:bg-field-green"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registrando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

