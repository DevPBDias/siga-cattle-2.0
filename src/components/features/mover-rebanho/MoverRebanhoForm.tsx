"use client";

import { useState, useEffect } from "react";
import { ArrowLeftRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFarms } from "@/hooks/db/farms/useFarms";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useUpdateAnimal } from "@/hooks/db/animals/useUpdateAnimal";
import { toast } from "sonner";
import { AnimalChipGrid } from "./AnimalChipGrid";

const FIELD_CLASS = "h-10 w-full border-0 bg-muted/40 text-sm";

export function MoverRebanhoForm() {
  const [originFarmId, setOriginFarmId] = useState("");
  const [destFarmId, setDestFarmId] = useState("");
  const [selectedRgns, setSelectedRgns] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: farms = [], loading: farmsLoading } = useFarms();
  const { data: allAnimals = [] } = useAnimals();
  const {
    actions: { updateAnimal },
  } = useUpdateAnimal();

  const originAnimals = allAnimals.filter(
    (a) => a.farm_id === originFarmId && !a._deleted,
  );

  const allSelected =
    originAnimals.length > 0 &&
    originAnimals.every((a) => selectedRgns.has(a.rgn));

  // Reset selected animals when origin farm changes
  useEffect(() => {
    setSelectedRgns(new Set());
  }, [originFarmId]);

  const toggleRgn = (rgn: string) => {
    setSelectedRgns((prev) => {
      const next = new Set(prev);
      if (next.has(rgn)) {
        next.delete(rgn);
      } else {
        next.add(rgn);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedRgns(new Set());
    } else {
      setSelectedRgns(new Set(originAnimals.map((a) => a.rgn)));
    }
  };

  const handleMove = async () => {
    setErrorMessage(null);

    if (selectedRgns.size === 0) {
      setErrorMessage("Selecione pelo menos um animal.");
      return;
    }
    if (!destFarmId) {
      setErrorMessage("Selecione a fazenda de destino.");
      return;
    }
    if (originFarmId === destFarmId) {
      setErrorMessage("A fazenda de destino deve ser diferente da origem.");
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.all(
        Array.from(selectedRgns).map((rgn) =>
          updateAnimal(rgn, { farm_id: destFarmId, updated_at: Date.now() }),
        ),
      );
      toast.success("Rebanho movido com sucesso!");
      setShowSuccess(true);
    } catch {
      toast.error("Erro ao mover o rebanho.");
      setErrorMessage("Ocorreu um erro ao mover os animais. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setOriginFarmId("");
    setDestFarmId("");
    setSelectedRgns(new Set());
    setErrorMessage(null);
    setShowSuccess(false);
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-field-green" strokeWidth={2.5} />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-foreground text-2xl font-bold">Rebanho Movido!</h3>
          <p className="text-muted-foreground text-sm">
            Os animais foram transferidos para a fazenda de destino com sucesso.
          </p>
        </div>
        <Button
          onClick={resetForm}
          className="h-12 w-full max-w-xs rounded-xl font-bold shadow-md"
        >
          Mover Mais Animais
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-primary uppercase">Mover Rebanho</h2>
        <p className="text-muted-foreground text-sm">
          Selecione a origem, os animais e o destino para transferência.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm space-y-4">
        {/* LOCAL 1 — origem */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-primary uppercase tracking-tight">
              Local 1
            </h3>
            {originFarmId && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-field-green uppercase tracking-wide"
              >
                {allSelected ? "Desselecionar Todos" : "Selecionar Todos"}
              </button>
            )}
          </div>
          <Select
            value={originFarmId}
            onValueChange={(v) => {
              setOriginFarmId(v);
              setSelectedRgns(new Set());
            }}
          >
            <SelectTrigger className={FIELD_CLASS}>
              <SelectValue
                placeholder={
                  farmsLoading ? "Carregando..." : "Selecione a fazenda de origem"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {farms.map((farm) => (
                <SelectItem key={farm.id} value={farm.id}>
                  {farm.farm_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Animal chips */}
        {originFarmId && (
          farmsLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-16 rounded-md" />
              ))}
            </div>
          ) : (
            <AnimalChipGrid
              animals={originAnimals}
              selectedRgns={selectedRgns}
              onToggle={toggleRgn}
            />
          )
        )}

        {/* Separator */}
        <div className="flex justify-center py-2">
          <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* LOCAL 2 — destino */}
        <div>
          <h3 className="text-sm font-bold text-primary uppercase tracking-tight mb-2">
            Local 2
          </h3>
          <Select value={destFarmId} onValueChange={setDestFarmId}>
            <SelectTrigger className={FIELD_CLASS}>
              <SelectValue
                placeholder={
                  farmsLoading ? "Carregando..." : "Selecione a fazenda de destino"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {farms.map((farm) => (
                <SelectItem key={farm.id} value={farm.id}>
                  {farm.farm_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        )}

        {/* Action button */}
        <Button
          type="button"
          disabled={isSubmitting || selectedRgns.size === 0 || !destFarmId}
          onClick={handleMove}
          className="w-full h-11 font-black uppercase tracking-wider text-xs shadow-md"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Movendo...
            </>
          ) : (
            `Mover Rebanho (${selectedRgns.size} animal${selectedRgns.size !== 1 ? "is" : ""})`
          )}
        </Button>
      </div>
    </div>
  );
}
