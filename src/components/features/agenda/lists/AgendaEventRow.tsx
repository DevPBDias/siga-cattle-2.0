"use client";

import { AgendaItem } from "@/types/agenda.type";
import { AGENDA_TYPE_META } from "@/lib/agenda/agenda.config";

interface AgendaEventRowProps {
  item: AgendaItem;
}

export function AgendaEventRow({ item }: AgendaEventRowProps) {
  const meta = AGENDA_TYPE_META[item.type];
  const Icon = meta.icon;

  return (
    <div className="flex items-start gap-2 rounded-xl bg-muted/35 px-2.5 py-2">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md bg-card ${meta.textClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-primary">{item.title}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{item.subtitle}</p>
      </div>
      <span className={`shrink-0 text-[9px] font-bold uppercase ${meta.textClass}`}>{meta.label}</span>
    </div>
  );
}
