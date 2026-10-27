import { AnimalMetric } from "@/types/animal_metrics.type";
import { formatDate, diffInDays } from "@/utils/dates";
import { TrendingUp, TrendingDown } from "lucide-react";

interface GainDaily {
  dailyGain: number;
  days: number;
  endDate: string;
  initialDate: string;
  totalGain: number;
}

interface WeightListProps {
  weightData: Partial<AnimalMetric>[];
  gainDaily: GainDaily[];
}

export function DetailsWeightList({ weightData, gainDaily }: WeightListProps) {
  const valueInteval = (i: number): string => {
    if (i === 0) return "0";

    const currentDate = weightData[i].date;
    const previousDate = weightData[i - 1].date;

    if (!currentDate || !previousDate) return "0";

    const days = diffInDays(currentDate, previousDate);
    return String(days);
  };

  const valueGmd = (i: number): string => {
    if (i === 0) return "0";

    const entry = gainDaily.find((g) => g.endDate === weightData[i].date);
    if (entry) return entry.dailyGain.toFixed(2);

    // Fallback calculation if gainDaily is not provided
    const current = weightData[i];
    const previous = weightData[i - 1];

    if (!current.date || !previous.date || !current.value || !previous.value)
      return "0";

    const days = diffInDays(current.date, previous.date);
    if (days <= 0) return "0";

    const diffWeight = current.value - previous.value;
    const gmd = diffWeight / days;

    return gmd.toFixed(2);
  };

  return (
    <div className="space-y-3 mt-6">
      {weightData?.map((p, i) => (
        <div
          key={p.id || i}
          className="border border-border rounded-lg bg-card overflow-hidden"
        >
          {/* Header Minimalista */}
          <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {p.born_metric
                ? "Peso Nascimento"
                : `${weightData.slice(0, i + 1).filter((w) => !w.born_metric).length}ª Pesagem`}
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
                <span className="text-sm text-muted-foreground ml-1">kg</span>
              </div>

              {/* Métricas Secundárias (só para i > 0) */}
              {i > 0 && (
                <div className="flex gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase block">
                      Intervalo
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {valueInteval(i)}{" "}
                      <span className="text-muted-foreground font-normal">
                        dias
                      </span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase block">
                      GMD
                    </span>
                    <span
                      className={`text-sm font-medium flex items-center gap-1 ${
                        Number(valueGmd(i)) > 0
                          ? "text-green-600"
                          : Number(valueGmd(i)) < 0
                            ? "text-red-600"
                            : "text-foreground"
                      }`}
                    >
                      {Number(valueGmd(i)) > 0 && (
                        <TrendingUp className="w-3 h-3" />
                      )}
                      {Number(valueGmd(i)) < 0 && (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {valueGmd(i)}{" "}
                      <span className="text-muted-foreground font-normal">
                        kg/dia
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
