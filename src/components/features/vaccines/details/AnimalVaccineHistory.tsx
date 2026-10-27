"use client";

import { Syringe } from "lucide-react";
import { formatDate } from "@/utils/dates";
import { VaccineHistoryEntry } from "@/types/vaccine.type";

interface AnimalVaccineHistoryProps {
  rgn: string;
  loading: boolean;
  vaccines: VaccineHistoryEntry[];
}

export function AnimalVaccineHistory({ rgn, loading, vaccines }: AnimalVaccineHistoryProps) {
  if (loading) {
    return (
      <p className="text-[11px] text-muted-foreground animate-pulse">
        Verificando histórico de vacinas do animal...
      </p>
    );
  }

  if (vaccines.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground italic">
        Nenhuma vacina prévia registrada para este animal.
      </p>
    );
  }

  return (
    <div className="bg-field-green/10 border border-field-green/30 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-2 text-field-green text-xs font-bold">
        <Syringe size={15} />
        <span>Vacinas já registradas para {rgn}:</span>
      </div>
      <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
        {vaccines.map((vac) => (
          <div
            key={vac.id}
            className="flex items-center justify-between bg-card px-2.5 py-1.5 rounded-lg border border-border/60 text-xs"
          >
            <span className="font-semibold text-primary">{vac.name}</span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {formatDate(vac.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
