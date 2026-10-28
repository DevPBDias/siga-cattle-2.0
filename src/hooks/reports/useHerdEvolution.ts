"use client";

import { useMemo } from "react";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useMovements } from "@/hooks/db/movements/useMovements";
import { calculateAgeInMonths, getAgeRange, type AgeRange } from "@/utils/dates";

export type HerdEvolutionPeriod = "month" | "year";
export type HerdEvolutionCategory = "all" | AgeRange;

export const HERD_AGE_RANGES: AgeRange[] = [
  "0 - 12 m",
  "13 - 24 m",
  "25 - 36 m",
  "+36 m",
];

export interface HerdEvolutionPoint {
  label: string;
  date: string;
  total: number;
  [key: string]: number | string;
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPeriodEnd(period: HerdEvolutionPeriod, offset: number) {
  const today = new Date();
  if (offset === 0) return today;
  if (period === "year") {
    return new Date(today.getFullYear() - offset, 11, 31);
  }

  return new Date(today.getFullYear(), today.getMonth() - offset + 1, 0);
}

function getPeriodLabel(period: HerdEvolutionPeriod, date: Date) {
  if (period === "year") return String(date.getFullYear());
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${months[date.getMonth()]}/${String(date.getFullYear()).slice(-2)}`;
}

export function useHerdEvolution(
  period: HerdEvolutionPeriod,
  category: HerdEvolutionCategory,
) {
  const { data: animals, loading: animalsLoading, error: animalsError } = useAnimals();
  const { data: movements, loading: movementsLoading, error: movementsError } = useMovements();

  const data = useMemo<HerdEvolutionPoint[]>(() => {
    const points = Array.from({ length: period === "month" ? 12 : 4 }, (_, index) => {
      const date = getPeriodEnd(period, period === "month" ? 11 - index : 3 - index);
      return {
        date,
        isoDate: toISODate(date),
        label: getPeriodLabel(period, date),
      };
    });

    return points.map(({ date, isoDate, label }) => {
      const point: HerdEvolutionPoint = { label, date: isoDate, total: 0 };

      for (const animal of animals) {
        if (animal._deleted) continue;

        const bornDate = animal.born_date || toISODate(new Date(animal.created_at));
        if (bornDate > isoDate) continue;

        const createdDate = toISODate(new Date(animal.created_at));
        if (createdDate > isoDate) continue;

        const terminalMovement = movements
          .filter(
            (movement) =>
              movement.animal_id === animal.rgn &&
              ["morte", "venda", "troca"].includes(movement.type),
          )
          .sort((a, b) => (a.event_date || a.date).localeCompare(b.event_date || b.date))[0];

        const terminalDate = terminalMovement?.event_date || terminalMovement?.date;
        if (terminalDate && terminalDate <= isoDate) continue;

        const range = getAgeRange(calculateAgeInMonths(bornDate, isoDate));
        if (category !== "all" && category !== range) continue;

        point.total += 1;
        point[range] = Number(point[range] || 0) + 1;
      }

      return point;
    });
  }, [animals, category, movements, period]);

  return {
    data,
    loading: animalsLoading || movementsLoading,
    error: animalsError || movementsError,
  };
}
