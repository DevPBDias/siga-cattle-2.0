"use client";

import { CalendarDays } from "lucide-react";
import { AgendaItem } from "@/types/agenda.type";
import { AgendaEventRow } from "./AgendaEventRow";
import { formatDate } from "@/utils/dates";

interface AgendaMonthListProps {
  items: AgendaItem[];
}

export function AgendaMonthList({ items }: AgendaMonthListProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <CalendarDays className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-semibold text-primary">Nenhum evento neste mês</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Vacinas, reprodução, nascimentos e lembretes aparecem aqui.
        </p>
      </section>
    );
  }

  const grouped = items.reduce<Record<string, AgendaItem[]>>((acc, item) => {
    (acc[item.date] ||= []).push(item);
    return acc;
  }, {});

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase text-muted-foreground">Este mês</h3>
        <span className="text-xs font-semibold text-muted-foreground">
          {items.length} {items.length === 1 ? "evento" : "eventos"}
        </span>
      </div>
      {Object.entries(grouped).map(([date, dayItems]) => (
        <div key={date} className="space-y-1.5">
          <p className="px-1 text-[10px] font-bold uppercase text-muted-foreground">
            {formatDate(date)}
          </p>
          {dayItems.map((item) => (
            <AgendaEventRow key={item.id} item={item} />
          ))}
        </div>
      ))}
    </section>
  );
}
