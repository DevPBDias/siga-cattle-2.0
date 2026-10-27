"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AnimalCadastroSuccessModalProps {
  open: boolean;
  rgn: string;
  onClose: () => void;
}

export function AnimalCadastroSuccessModal({
  open,
  rgn,
  onClose,
}: AnimalCadastroSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm bg-card rounded-2xl border border-border/60 shadow-2xl">
        <DialogHeader className="items-center text-center space-y-3">
          <div className="w-16 h-16 bg-field-green/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-field-green" strokeWidth={2.5} />
          </div>
          <DialogTitle className="text-lg font-bold text-primary">Sucesso!</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            O animal <span className="font-bold text-primary">{rgn}</span> foi cadastrado com sucesso.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose} className="w-full rounded-xl">
            OK, Voltar para Consulta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
