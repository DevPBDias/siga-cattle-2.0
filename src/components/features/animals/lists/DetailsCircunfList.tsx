"use client";

import { AnimalMetric } from "@/types/animal_metrics.type";
import { formatDate, diffInDays } from "@/utils/dates";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DetailsCircunfListProps {
  CEMedidos: AnimalMetric[];
}

export function DetailsCircunfList({ CEMedidos }: DetailsCircunfListProps) {
  const valueInterval = (i: number): string => {
    if (i === 0) return "0";
    const days = diffInDays(CEMedidos[i].date, CEMedidos[i - 1].date);
    return String(days);
  };

  const valueDailyChange = (i: number): string => {
    if (i === 0) return "0";
    const current = CEMedidos[i];
    const previous = CEMedidos[i - 1];
    const days = diffInDays(current.date, previous.date);
    if (days <= 0) return "0";
    const totalGain = current.value - previous.value;
    const daily = totalGain / days;
    return daily.toFixed(2);
  };

  return (
    <div className="space-y-3 mt-6">
      {CEMedidos?.map((p, i) => (
        <div
          key={p.id || i}
          className="border border-border rounded-lg bg-card overflow-hidden"
        >
          {/* Header Minimalista */}
          <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {p.born_metric
                ? "Medição Inicial"
                : `${CEMedidos.slice(0, i + 1).filter((w) => !w.born_metric).length}ª Medição`}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(p.date)}
            </span>
          </div>

          {/* Conteúdo Principal */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              {/* Valor Principal em Destaque */}
              <div>
                <span className="text-2xl font-bold text-primary">
                  {p.value}
                </span>
                <span className="text-sm text-muted-foreground ml-1">cm</span>
              </div>

              {/* Métricas Secundárias (só para i > 0) */}
              {i > 0 && (
                <div className="flex gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase block">
                      Intervalo
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {valueInterval(i)}{" "}
                      <span className="text-muted-foreground font-normal">
                        dias
                      </span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase block">
                      Crescimento
                    </span>
                    <span
                      className={`text-sm font-medium flex items-center gap-1 ${
                        Number(valueDailyChange(i)) > 0
                          ? "text-green-600"
                          : Number(valueDailyChange(i)) < 0
                            ? "text-red-600"
                            : "text-foreground"
                      }`}
                    >
                      {Number(valueDailyChange(i)) > 0 && (
                        <TrendingUp className="w-3 h-3" />
                      )}
                      {Number(valueDailyChange(i)) < 0 && (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {valueDailyChange(i)}{" "}
                      <span className="text-muted-foreground font-normal">
                        cm/dia
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
