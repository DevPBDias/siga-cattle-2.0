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
import { Checkbox } from "@/components/ui/checkbox";

interface ClassFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentClasses?: string[];
  currentFilterMode?: "all" | "specific";
  onConfirm: (
    classes: string[] | undefined,
    filterMode: "all" | "specific"
  ) => void;
}

const AVAILABLE_CLASSES = ["A", "B", "C", "D"];

export function ClassFilterModal({
  open,
  onOpenChange,
  currentClasses = [],
  currentFilterMode = "all",
  onConfirm,
}: ClassFilterModalProps) {
  const [filterMode, setFilterMode] = React.useState<"all" | "specific">(
    currentFilterMode
  );
  const [selectedClasses, setSelectedClasses] = React.useState<string[]>(
    currentClasses || []
  );

  React.useEffect(() => {
    if (open) {
      setFilterMode(currentFilterMode);
      setSelectedClasses(currentClasses || []);
    }
  }, [open, currentClasses, currentFilterMode]);

  const toggleClass = (cls: string) => {
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const handleConfirm = () => {
    if (filterMode === "specific" && selectedClasses.length === 0) {
      return; 
    }
    onConfirm(filterMode === "all" ? [] : selectedClasses, filterMode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar por Classe Visual</DialogTitle>
          <DialogDescription>
            Escolha se deseja mostrar animais de todas as classes visuais ou filtrar por
            classes visuais específicas.
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
              }}
            >
              <Checkbox
                checked={filterMode === "all"}
                onCheckedChange={() => {
                  setFilterMode("all");
                }}
                className="h-5 w-5"
              />
              <Label className="text-sm font-medium cursor-pointer flex-1">
                Todas as Classes Visuais
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
                Classes Visuais Específicas
              </Label>
            </div>
          </div>

          {filterMode === "specific" && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {AVAILABLE_CLASSES.map((cls) => (
                <div
                  key={cls}
                  className="flex items-center space-x-2 p-2 rounded-md border border-border bg-muted/20"
                >
                  <Checkbox
                    id={`class-${cls}`}
                    checked={selectedClasses.includes(cls)}
                    onCheckedChange={() => toggleClass(cls)}
                  />
                  <Label
                    htmlFor={`class-${cls}`}
                    className="text-sm font-bold cursor-pointer flex-1"
                  >
                    Classe visual {cls}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={filterMode === "specific" && selectedClasses.length === 0}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
