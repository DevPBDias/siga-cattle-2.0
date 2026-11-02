"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type {
  HerdEvolutionCategory,
  HerdEvolutionPeriod,
} from "@/hooks/reports/useHerdEvolution";
import { HERD_AGE_RANGES, useHerdEvolution } from "@/hooks/reports/useHerdEvolution";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const categoryLabels: Record<HerdEvolutionCategory, string> = {
  all: "Todos",
  "0 - 12 m": "0 a 12 meses",
  "13 - 24 m": "13 a 24 meses",
  "25 - 36 m": "25 a 36 meses",
  "+36 m": "Mais de 36 meses",
};

const chartConfig = {
  total: { label: "Quantidade do rebanho", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

interface HerdEvolutionChartProps {
  period: HerdEvolutionPeriod;
  category: HerdEvolutionCategory;
  onPeriodChange: (period: HerdEvolutionPeriod) => void;
  onCategoryChange: (category: HerdEvolutionCategory) => void;
}

/** Tooltip customizado: rótulo da série acima, valor numérico abaixo */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2 shadow-md text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.name} className="mt-0.5 text-lg font-extrabold" style={{ color: entry.color }}>
          {entry.value}
        </p>
      ))}
    </div>
  );
}

export function HerdEvolutionChart({
  period,
  category,
  onPeriodChange,
  onCategoryChange,
}: HerdEvolutionChartProps) {
  const { data, loading, error } = useHerdEvolution(period, category);

  // Calcular domínio do YAxis com folga para não cortar os pontos/labels
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.total)) : 0;
  const yPadding = Math.ceil(maxValue * 0.15) || 10;
  const yMax = maxValue + yPadding;

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="gap-3 px-4 pb-3 pt-4">
        <div>
          <CardTitle className="text-base font-bold uppercase text-primary">
            Evolução do rebanho
          </CardTitle>
          <CardDescription className="mt-1 text-xs">
            Quantidade estimada por faixa etária ao longo do tempo.
          </CardDescription>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="herd-category" className="text-[10px] font-bold uppercase text-primary">
              Categoria
            </Label>
            <Select value={category} onValueChange={(value) => onCategoryChange(value as HerdEvolutionCategory)}>
              <SelectTrigger id="herd-category" className="h-6 min-h-0 w-full bg-background text-[11px] px-2 py-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {HERD_AGE_RANGES.map((range) => (
                  <SelectItem key={range} value={range}>
                    {categoryLabels[range]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="herd-period" className="text-[10px] font-bold uppercase text-primary">
              Período
            </Label>
            <Select value={period} onValueChange={(value) => onPeriodChange(value as HerdEvolutionPeriod)}>
              <SelectTrigger id="herd-period" className="h-6 min-h-0 w-full bg-background text-[11px] px-2 py-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês — últimos 12</SelectItem>
                <SelectItem value="year">Ano — últimos 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-4">
        {loading ? (
          <Skeleton className="h-72 w-full rounded-xl" />
        ) : error ? (
          <p className="px-2 py-12 text-center text-sm text-destructive">
            Não foi possível carregar a evolução do rebanho.
          </p>
        ) : data.length === 0 ? (
          <p className="px-2 py-12 text-center text-sm text-muted-foreground">
            Nenhum dado disponível para o gráfico.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <LineChart data={data} margin={{ top: 36, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={48}
                domain={[0, yMax]}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <Line
                dataKey="total"
                type="monotone"
                stroke="var(--color-total)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-total)", strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              >
                {/* Valor exibido em cada ponto — offset negativo afasta do dot */}
                <LabelList
                  dataKey="total"
                  position="top"
                  offset={10}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fill: "var(--color-total)",
                  }}
                />
              </Line>
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
