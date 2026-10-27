"use client";

import { AGENDA_TYPE_META } from "@/lib/agenda/agenda.config";
import { AgendaItemType } from "@/types/agenda.type";

const TYPES: AgendaItemType[] = ["vacina", "reproducao", "nascimento", "lembrete"];

export function AgendaLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {TYPES.map((type) => (
        <span key={type} className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${AGENDA_TYPE_META[type].dotClass}`} />
          {AGENDA_TYPE_META[type].label}
        </span>
      ))}
    </div>
  );
}
