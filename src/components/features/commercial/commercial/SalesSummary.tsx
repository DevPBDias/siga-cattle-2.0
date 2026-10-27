"use client";

import { useSales } from "@/hooks/db/sales/useSales";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { parseDateParts } from "@/utils/dates";

export function SalesSummary() {
  const { allSales, loading: isSalesLoading, availableYears } = useSales();
  const { data: animals = [], loading: isAnimalsLoading } = useAnimals();
  const isLoading = isSalesLoading || isAnimalsLoading;

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Map animals for quick lookup
  const animalMap = useMemo(() => {
    const map = new Map();
    if (animals) {
      animals.forEach((a) => map.set(a.rgn, a));
    }
    return map;
  }, [animals]);

  // Summary stats
  const summaryData = useMemo(() => {
    const yearSales = allSales.filter(
      (s) => parseDateParts(s.date)?.year === selectedYear,
    );

    const totalValue = yearSales.reduce(
      (sum, s) => sum + (s.total_value || 0),
      0,
    );

    // Count by sale_type and sex
    const abateSales = yearSales.filter((s) => s.sale_type === "abate");
    const reproducaoSales = yearSales.filter((s) => s.sale_type === "comprado");

    const getSexCounts = (salesList: any[]) => {
      let m = 0;
      let f = 0;
      salesList.forEach((s) => {
        const animal = animalMap.get(s.animal_rgn);
        if (animal?.sex === "M") m++;
        if (animal?.sex === "F") f++;
      });
      return { m, f };
    };

    const abateSex = getSexCounts(abateSales);
    const reproducaoSex = getSexCounts(reproducaoSales);

    return {
      totalValue,
      totalAnimals: yearSales.length,
      abate: {
        total: abateSales.length,
        ...abateSex,
      },
      reproducao: {
        total: reproducaoSales.length,
        ...reproducaoSex,
      },
    };
  }, [allSales, selectedYear, animalMap]);

  // Radial chart data for 3 year comparison (ONLY MALES as requested)
  const radialData = useMemo(() => {
    const years = [currentYear - 2, currentYear - 1, currentYear];

    return years.map((year, idx) => {
      const yearMaleSales = allSales.filter((s) => {
        const isYear = parseDateParts(s.date)?.year === year;
        if (!isYear) return false;
        const animal = animalMap.get(s.animal_rgn);
        return animal?.sex === "M";
      });

      return {
        name: String(year),
        value: yearMaleSales.length,
        fill: idx === 2 ? "#3B82F6" : idx === 1 ? "#60A5FA" : "#93C5FD",
      };
    });
  }, [allSales, currentYear, animalMap]);

  // Accumulated totals per year
  const accumulatedData = useMemo(() => {
    const prevYear = currentYear - 1;

    const prevYearSales = allSales.filter(
      (s) => parseDateParts(s.date)?.year === prevYear,
    );
    const currYearSales = allSales.filter(
      (s) => parseDateParts(s.date)?.year === currentYear,
    );

    return {
      prevYear: {
        year: prevYear,
        count: prevYearSales.length,
      },
      currYear: {
        year: currentYear,
        count: currYearSales.length,
      },
    };
  }, [allSales, currentYear]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  const chartConfig = {
    value: { label: "Vendas" },
  };

  return (
    <div className="space-y-4">
      {/* Radial Chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold uppercase text-primary mb-2">
          Resumo de vendas de machos
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Comparativo dos últimos 3 anos
        </p>

        <div className="flex items-center justify-center">
          <ChartContainer config={chartConfig} className="h-48 w-48">
            <RadialBarChart
              data={radialData}
              innerRadius="30%"
              outerRadius="100%"
              startAngle={180}
              endAngle={0}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, Math.max(...radialData.map((d) => d.value), 10)]}
                tick={false}
              />
              <RadialBar dataKey="value" background cornerRadius={10} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </RadialBarChart>
          </ChartContainer>
        </div>

        {/* Alert for bulls > 3 years */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-4 flex items-start gap-3">
          <AlertTriangle
            className="text-yellow-600 shrink-0 mt-0.5"
            size={18}
          />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Touros com mais de 3 anos
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Animais que completaram 3 anos e ainda não foram vendidos.
              Consulte a lista de animais para mais detalhes.
            </p>
          </div>
        </div>
      </div>

      {/* Accumulated Totals */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase text-primary">
            Acumulado de {accumulatedData.prevYear.year}:{" "}
            {accumulatedData.prevYear.count}
          </h3>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase text-primary">
            Acumulado de {accumulatedData.currYear.year}:{" "}
            {accumulatedData.currYear.count}
          </h3>
        </div>
      </div>

      {/* Total Sales + Abate vs Reprodução */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase text-primary">
            Total de vendas do ano
          </h3>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-24 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.length > 0
                ? availableYears.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))
                : [currentYear - 2, currentYear - 1, currentYear].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-center mb-4">
          <p className="text-3xl font-black text-primary">
            {formatCurrency(summaryData.totalValue)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {summaryData.totalAnimals} animais vendidos
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Abate */}
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
              Abate
            </p>
            <p className="text-lg font-bold text-primary">
              {summaryData.abate.total}
            </p>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <span>M: {summaryData.abate.m}</span>
              <span>F: {summaryData.abate.f}</span>
            </div>
          </div>

          {/* Reprodução */}
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
              Reprodução
            </p>
            <p className="text-lg font-bold text-primary">
              {summaryData.reproducao.total}
            </p>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <span>M: {summaryData.reproducao.m}</span>
              <span>F: {summaryData.reproducao.f}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
