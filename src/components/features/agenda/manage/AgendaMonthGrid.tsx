"use client";

import { AgendaDayCell } from "@/types/agenda.type";
import { AGENDA_TYPE_META } from "@/lib/agenda/agenda.config";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

interface AgendaMonthGridProps {
  cells: AgendaDayCell[];
  selectedDate: string | null;
  onSelectDay: (iso: string) => void;
}

export function AgendaMonthGrid({ cells, selectedDate, onSelectDay }: AgendaMonthGridProps) {
  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="text-center text-[10px] font-bold uppercase text-muted-foreground py-1"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 rounded-xl border border-border/60 overflow-hidden bg-card">
        {cells.map((cell) => {
          const selected = cell.iso === selectedDate;
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelectDay(cell.iso)}
              className={`h-10 border-border/50 border-r border-b last:border-r-0 flex flex-col items-center justify-center gap-0.5 ${
                cell.inMonth ? "bg-card" : "bg-muted/30 text-muted-foreground"
              } ${cell.isToday ? "ring-2 ring-inset ring-primary" : ""} ${
                selected ? "bg-primary/10" : ""
              }`}
            >
              <span className={`text-xs font-bold leading-none ${cell.isToday ? "text-primary" : "text-foreground"}`}>
                {cell.day}
              </span>
              <span className="flex h-1.5 gap-0.5">
                {cell.types.slice(0, 4).map((type) => (
                  <span key={type} className={`h-1.5 w-1.5 rounded-full ${AGENDA_TYPE_META[type].dotClass}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
