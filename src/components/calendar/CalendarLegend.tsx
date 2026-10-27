"use client";

import { STAGE_METADATA, EventStage } from "@/types/calendar.types";
import { formatDate } from "@/utils/dates";

interface CalendarLegendProps {
  activeCycles: { date: string; color: string }[];
}

export function CalendarLegend({ activeCycles }: CalendarLegendProps) {
  // Group by similar stages to keep it compact
  const groupedStages = [
    {
      label: "IATF / FIV",
      items: ["D0", "D8", "D10", "D11"].filter(
        (s) => STAGE_METADATA[s as EventStage],
      ),
    },
    {
      label: "Resync",
      items: ["D22", "D23", "D30", "D32", "D34"].filter(
        (s) => STAGE_METADATA[s as EventStage],
      ),
    },
    {
      label: "Monta / Final",
      items: ["D35", "D37", "D80", "D82", "D110"].filter(
        (s) => STAGE_METADATA[s as EventStage],
      ),
    },
  ];

  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm space-y-6">
      {/* Ciclos Ativos */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b pb-2">
          Ciclos de Manejo (Cores)
        </h3>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {activeCycles.length === 0 ? (
            <p className="text-[10px] text-muted-foreground italic">
              Nenhum ciclo ativo encontrado.
            </p>
          ) : (
            activeCycles.map((cycle) => (
              <div key={cycle.date} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-black/10"
                  style={{ backgroundColor: cycle.color }}
                />
                <span className="text-[10px] font-black">
                  Ciclo{" "}
                  {formatDate(cycle.date)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Explicação de Etapas */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b pb-2">
          Significado das Siglas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {groupedStages.map((group) => (
            <div key={group.label} className="space-y-2">
              <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                {group.label}
              </h4>
              <div className="space-y-1.5">
                {group.items.map((stageKey) => {
                  const stage = STAGE_METADATA[stageKey as EventStage];
                  return (
                    <div key={stageKey} className="flex items-start gap-1.5">
                      <span className="text-[9px] font-black bg-muted px-1 rounded min-w-[24px] text-center">
                        {stage.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-bold leading-tight flex-1">
                        {stage.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
