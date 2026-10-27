"use client";

import { useSales } from "@/hooks/db/sales/useSales";
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
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { parseDateParts, MONTHS_SHORT } from "@/utils/dates";


const COLORS = ["#3B82F6", "#FFCC04", "#93C5FD", "#BFDBFE"];

export function SalesDetails() {
  const { allSales, loading: isLoading, availableYears } = useSales();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed, agora comparado com parts.month
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Doughnut chart data: sales by month for selected year
  const doughnutData = useMemo(() => {
    const monthlyData = Array(12).fill(0);

    allSales.forEach((sale) => {
      const parts = parseDateParts(sale.date);
      if (!parts) return;
      if (parts.year === selectedYear) {
        const month = parts.month - 1; // 0-indexed
        monthlyData[month] += 1;
      }
    });

    return monthlyData.map((count, idx) => ({
      name: MONTHS_SHORT[idx].label,
      value: count,
      isCurrent: idx + 1 === currentMonth && selectedYear === currentYear,
    }));
  }, [allSales, selectedYear, currentMonth, currentYear]);

  const totalSalesYear = doughnutData.reduce((sum, d) => sum + d.value, 0);

  // Bar chart data: last 3 years comparison
  const barData = useMemo(() => {
    const years = [currentYear - 2, currentYear - 1, currentYear];

    return years.map((year) => {
      const yearSales = allSales.filter(
        (s) => parseDateParts(s.date)?.year === year,
      );

      const abateCount = yearSales.filter(
        (s) => s.sale_type === "abate",
      ).length;
      const reproducaoCount = yearSales.filter(
        (s) => s.sale_type === "comprado",
      ).length;

      return {
        year: String(year),
        abate: abateCount,
        reproducao: reproducaoCount,
      };
    });
  }, [allSales, currentYear]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const chartConfig = {
    abate: { label: "Abate", color: "#3B82F6" },
    reproducao: { label: "Reprodução", color: "#FFCC04" },
  };

  return (
    <div className="space-y-6">
      {/* Doughnut Chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase text-primary">
            Vendas no ano
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

        <div className="flex items-center justify-center">
          <div className="relative">
            <ChartContainer config={chartConfig} className="h-48 w-48">
              <PieChart>
                <Pie
                  data={doughnutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  strokeWidth={2}
                >
                  {doughnutData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isCurrent ? "#1D4ED8" : COLORS[index % 4]}
                      stroke={entry.isCurrent ? "#1E40AF" : "transparent"}
                      strokeWidth={entry.isCurrent ? 3 : 0}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-black text-primary">
                  {totalSalesYear}
                </p>
                <p className="text-xs text-muted-foreground">Vendas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart - 3 Year Comparison */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold uppercase text-primary mb-4">
          Comparativo dos últimos 3 anos (Abate vs Reprodução)
        </h3>

        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart
            data={barData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend verticalAlign="top" height={36} />
            <Bar
              dataKey="abate"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              name="Abate"
            />
            <Bar
              dataKey="reproducao"
              fill="#FFCC04"
              radius={[4, 4, 0, 0]}
              name="Reprodução"
            />
          </BarChart>
        </ChartContainer>

        <div className="grid grid-cols-3 gap-2 mt-4 text-center text-sm">
          {barData.map((item) => (
            <div key={item.year} className="flex flex-col gap-1">
              <p className="font-bold text-[10px] text-muted-foreground">
                {item.year}
              </p>
              <div className="flex justify-center gap-2">
                <div className="flex flex-col">
                  <span className="font-bold text-primary">{item.abate}</span>
                  <span className="text-[8px] uppercase text-muted-foreground">
                    Abate
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[#FFCC04]">
                    {item.reproducao}
                  </span>
                  <span className="text-[8px] uppercase text-muted-foreground">
                    Repr.
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
