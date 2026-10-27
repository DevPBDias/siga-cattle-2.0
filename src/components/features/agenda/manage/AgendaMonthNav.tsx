"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MONTHS } from "@/utils/dates";
import { DateOnly } from "@/utils/dates";

interface AgendaMonthNavProps {
  month: DateOnly;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function AgendaMonthNav({ month, onPrev, onNext, onToday }: AgendaMonthNavProps) {
  const monthName = MONTHS.find((item) => Number(item.value) === month.month)?.label ?? "";

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Button type="button" variant="outline" size="icon" onClick={onPrev} aria-label="Mês anterior">
          <ChevronLeft />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={onNext} aria-label="Próximo mês">
          <ChevronRight />
        </Button>
      </div>
      <h2 className="text-base font-bold text-primary tracking-tight capitalize">
        {monthName} {month.year}
      </h2>
      <Button type="button" variant="secondary" onClick={onToday}>
        Hoje
      </Button>
    </div>
  );
}
