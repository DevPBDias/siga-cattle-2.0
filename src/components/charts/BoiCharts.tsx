"use client";

import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { formatDate } from "@/utils/dates";

type SerieItem = { date: string; value: number };

type Props = {
  title: string;
  description?: string;
  data: SerieItem[];
  colorVar?: string;
};

export function ChartLineLabel({
  title,
  description,
  data,
  colorVar = "--chart-1",
}: Props) {
  const sortedData = [...data].sort((a, b) => {
    if (a.date.includes("-") && b.date.includes("-")) {
      return a.date.localeCompare(b.date);
    }
    return 0;
  });

  const formatToMonthYear = (dataString: string) => {
    if (dataString.includes("/")) {
      const [mes, ano] = dataString.split("/");
      return `${mes}/${ano.slice(-2)}`;
    } else if (dataString.includes("-")) {
      const [ano, mes] = dataString.split("-");
      return `${mes}/${ano.slice(-2)}`;
    }
    return dataString;
  };

  const chartData = sortedData.map((d) => ({
    month: formatToMonthYear(d.date),
    label: formatDate(d.date),
    value: d.value,
  }));

  const chartConfig = {
    value: {
      label: title,
      color: `var(${colorVar})`,
    },
  } satisfies ChartConfig;

  const unit = title.toLowerCase().includes("peso") ? "kg" : "cm";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-primary">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 30, left: 25, right: 25, bottom: 20 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />

              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#555" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />

              <Tooltip
                formatter={(value: number) => `${value}${unit}`}
                labelFormatter={(label) => `Data: ${label}`}
              />

              <Line
                dataKey="value"
                type="monotone"
                stroke={chartConfig.value.color}
                strokeWidth={2}
                dot={{
                  fill: chartConfig.value.color,
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{ r: 6 }}
              >
                <LabelList
                  position="top"
                  offset={10}
                  className="fill-foreground"
                  fontSize={12}
                  dataKey="value"
                  formatter={(value: number) => `${value}${unit}`}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
