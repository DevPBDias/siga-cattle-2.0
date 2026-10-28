"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { useHerdEvolution, type HerdEvolutionPeriod } from "@/hooks/reports/useHerdEvolution";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  total: {
    label: "Total do Rebanho",
    color: "var(--color-primary)",
  },
  "0 - 12 m": {
    label: "0–12 meses",
    color: "#2d7d46", // field-green
  },
  "13 - 24 m": {
    label: "13–24 meses",
    color: "#ffcb04", // indi-ouro
  },
  "25 - 36 m": {
    label: "25–36 meses",
    color: "#d97706", // amber
  },
  "+36 m": {
    label: "+36 meses",
    color: "#1e3b2b", // primary
  },
} satisfies ChartConfig;

type PeriodOption = "month" | "year";
type CategoryOption = "all" | "0 - 12 m" | "13 - 24 m" | "25 - 36 m" | "+36 m";

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [period, setPeriod] = React.useState<PeriodOption>("month");
  const [category, setCategory] = React.useState<CategoryOption>("all");

  React.useEffect(() => {
    if (isMobile) setPeriod("month");
  }, [isMobile]);

  const { data, loading } = useHerdEvolution(
    period as HerdEvolutionPeriod,
    category,
  );

  const activeKeys: string[] = category === "all"
    ? ["total"]
    : [category];

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="text-base font-bold text-primary tracking-tight">
          Evolução do Rebanho
        </CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total de cabeças ao longo do tempo
          </span>
          <span className="@[540px]/card:hidden">Evolução do rebanho</span>
        </CardDescription>
        <CardAction className="flex flex-col gap-2 @[540px]/card:flex-row">
          {/* Seletor de categoria */}
          <Select value={category} onValueChange={(v) => setCategory(v as CategoryOption)}>
            <SelectTrigger
              className="w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              aria-label="Categoria"
            >
              <SelectValue placeholder="Todas as idades" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">Todas as idades</SelectItem>
              <SelectItem value="0 - 12 m" className="rounded-lg">0–12 meses</SelectItem>
              <SelectItem value="13 - 24 m" className="rounded-lg">13–24 meses</SelectItem>
              <SelectItem value="25 - 36 m" className="rounded-lg">25–36 meses</SelectItem>
              <SelectItem value="+36 m" className="rounded-lg">+36 meses</SelectItem>
            </SelectContent>
          </Select>

          {/* Seletor de período */}
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={(v) => { if (v) setPeriod(v as PeriodOption); }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-3! @[540px]/card:flex"
          >
            <ToggleGroupItem value="month">12 meses</ToggleGroupItem>
            <ToggleGroupItem value="year">4 anos</ToggleGroupItem>
          </ToggleGroup>
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
            <SelectTrigger
              className="flex w-32 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[540px]/card:hidden"
              size="sm"
              aria-label="Período"
            >
              <SelectValue placeholder="12 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="month" className="rounded-lg">12 meses</SelectItem>
              <SelectItem value="year" className="rounded-lg">4 anos</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <Skeleton className="h-[250px] w-full rounded-2xl" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={data} margin={{ left: 0, right: 0 }}>
              <defs>
                {activeKeys.map((key) => (
                  <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={chartConfig[key as keyof typeof chartConfig]?.color ?? "var(--color-primary)"}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={chartConfig[key as keyof typeof chartConfig]?.color ?? "var(--color-primary)"}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={20}
                className="text-xs text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={36}
                className="text-xs text-muted-foreground"
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelKey="label"
                    indicator="dot"
                  />
                }
              />
              {activeKeys.map((key) => (
                <Area
                  key={key}
                  dataKey={key}
                  type="monotone"
                  fill={`url(#fill-${key})`}
                  stroke={chartConfig[key as keyof typeof chartConfig]?.color ?? "var(--color-primary)"}
                  strokeWidth={2}
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
