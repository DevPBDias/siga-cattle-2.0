"use client";

import { Button } from "@/components/ui/button";
import { AGENDA_TYPE_META } from "@/lib/agenda/agenda.config";
import { AgendaStatusFilter, AgendaTypeFilter } from "@/types/agenda.type";

const STATUS_OPTIONS: { value: AgendaStatusFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "proximos", label: "Próximos" },
  { value: "realizados", label: "Realizados" },
];

const TYPE_OPTIONS: { value: AgendaTypeFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "vacina", label: AGENDA_TYPE_META.vacina.label },
  { value: "reproducao", label: "Reprod." },
  { value: "nascimento", label: "Nascim." },
  { value: "lembrete", label: "Lembrete" },
];

interface AgendaFiltersProps {
  status: AgendaStatusFilter;
  type: AgendaTypeFilter;
  onStatusChange: (value: AgendaStatusFilter) => void;
  onTypeChange: (value: AgendaTypeFilter) => void;
}

export function AgendaFilters({
  status,
  type,
  onStatusChange,
  onTypeChange,
}: AgendaFiltersProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/50 p-1">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={status === option.value ? "default" : "ghost"}
            onClick={() => onStatusChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {TYPE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={type === option.value ? "default" : "outline"}
            onClick={() => onTypeChange(option.value)}
            className="flex-1 min-w-0"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
