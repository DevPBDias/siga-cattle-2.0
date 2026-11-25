"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { STATUS_ABCZ_OPTIONS } from "@/types/status.type";

interface StatusFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statuses?: readonly string[];
  currentStatus?: string;
  currentFilterMode?: "all" | "specific";
  onConfirm: (
    status: string | undefined,
    filterMode: "all" | "specific"
  ) => void;
}

export function StatusFilterModal({
  open,
  onOpenChange,
  statuses = STATUS_ABCZ_OPTIONS,
  currentStatus,
  currentFilterMode = "all",
  onConfirm,
}: StatusFilterModalProps) {
  const [filterMode, setFilterMode] = React.useState<"all" | "specific">(
    currentFilterMode
  );
  const [selectedStatus, setSelectedStatus] = React.useState<
    string | undefined
  >(currentStatus);

  React.useEffect(() => {
    if (open) {
      setFilterMode(currentFilterMode);
      setSelectedStatus(currentStatus);
    }
  }, [open, currentStatus, currentFilterMode]);

  const handleConfirm = () => {
    if (filterMode === "specific" && !selectedStatus) {
      return; // Não permite confirmar sem selecionar status
    }
    onConfirm(filterMode === "all" ? "Todos" : selectedStatus, filterMode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar por Status</DialogTitle>
          <DialogDescription>
            Escolha se deseja mostrar animais de todos os status ou filtrar por
            um status específico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div
              className="flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-muted/50"
              style={{
                borderColor:
                  filterMode === "all"
                    ? "hsl(var(--primary))"
                    : "hsl(var(--border))",
                backgroundColor:
                  filterMode === "all"
                    ? "hsl(var(--primary) / 0.05)"
                    : "transparent",
              }}
              onClick={() => {
                setFilterMode("all");
                setSelectedStatus("Todos");
              }}
            >
              <Checkbox
                checked={filterMode === "all"}
                onCheckedChange={() => {
                  setFilterMode("all");
                  setSelectedStatus("Todos");
                }}
                className="h-5 w-5"
              />
              <Label className="text-sm font-medium cursor-pointer flex-1">
                Todos os Status
              </Label>
            </div>
            <div
              className="flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-muted/50"
              style={{
                borderColor:
                  filterMode === "specific"
                    ? "hsl(var(--primary))"
                    : "hsl(var(--border))",
                backgroundColor:
                  filterMode === "specific"
                    ? "hsl(var(--primary) / 0.05)"
                    : "transparent",
              }}
              onClick={() => setFilterMode("specific")}
            >
              <Checkbox
                checked={filterMode === "specific"}
                onCheckedChange={() => setFilterMode("specific")}
                className="h-5 w-5"
              />
              <Label className="text-sm font-medium cursor-pointer flex-1">
                Status Específico
              </Label>
            </div>
          </div>

          {filterMode === "specific" && (
            <Select
              value={selectedStatus || ""}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger id="status-select" className="w-full text-black">
                Selecione um status
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={filterMode === "specific" && !selectedStatus}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
