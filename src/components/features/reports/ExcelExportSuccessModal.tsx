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
import { ExportMethod } from "@/hooks/forms/useAnimalExcelExport";

interface ExcelExportSuccessModalProps {
  open: boolean;
  fileName: string;
  method: ExportMethod;
  onClose: () => void;
  onGoHome: () => void;
}

function successCopy(method: ExportMethod, fileName: string) {
  if (method === "share") {
    return `Arquivo ${fileName} compartilhado com sucesso.`;
  }
  if (method === "save-picker") {
    return `Arquivo ${fileName} salvo com sucesso.`;
  }
  return `Arquivo ${fileName} baixado. Verifique a pasta Downloads do seu dispositivo.`;
}

export function ExcelExportSuccessModal({
  open,
  fileName,
  method,
  onClose,
  onGoHome,
}: ExcelExportSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm bg-card rounded-2xl border border-border/60 shadow-2xl">
        <DialogHeader className="items-center text-center space-y-3">
          <div className="w-16 h-16 bg-field-green/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-field-green" strokeWidth={2.5} />
          </div>
          <DialogTitle className="text-lg font-bold text-primary">
            {method === "share" ? "Arquivo compartilhado" : "Exportação concluída"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {successCopy(method, fileName)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row gap-2">
          <Button variant="secondary" className="flex-1 rounded-xl" onClick={onClose}>
            Fechar
          </Button>
          <Button className="flex-1 rounded-xl" onClick={onGoHome}>
            Página inicial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
