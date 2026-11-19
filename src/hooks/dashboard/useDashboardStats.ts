"use client";

import { useMemo } from "react";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useAnimalWeights } from "@/hooks/db/animal_weights/useAnimalWeights";
import type { Animal } from "@/types/animal.type";
import type { AnimalMetric } from "@/types/animal_metrics.type";
import { diffInDays, todayISO, toISODate } from "@/utils/dates";

export interface DashboardStats {
  activeTotal: number;
  entradaEsteMes: number;
  nascimentos30d: number;
  femeasPrenhas: number;
  gmdMedio: number | null;
  totalPesagens: number;
  animalEmTratamento: number;
  animalEmAlerta: number;
}

const EMPTY: DashboardStats = {
  activeTotal: 0,
  entradaEsteMes: 0,
  nascimentos30d: 0,
  femeasPrenhas: 0,
  gmdMedio: null,
  totalPesagens: 0,
  animalEmTratamento: 0,
  animalEmAlerta: 0,
};

export function calculateDashboardStats(
  animals: Animal[],
  weights: AnimalMetric[],
  farmId?: string,
  today = todayISO(),
): DashboardStats {
  const scopedAnimals =
    farmId === undefined
      ? animals
      : animals.filter((animal) => animal.farm_id === farmId);
  const animalRgNs = new Set(scopedAnimals.map((animal) => animal.rgn));
  const animalKeys = new Set(
    scopedAnimals.flatMap((animal) => (animal.animal_key ? [animal.animal_key] : [])),
  );
  const rgnCounts = new Map<string, number>();
  for (const animal of scopedAnimals) {
    rgnCounts.set(animal.rgn, (rgnCounts.get(animal.rgn) ?? 0) + 1);
  }

  const scopedWeights = weights.filter((weight) => {
    if (weight.animal_key) return animalKeys.has(weight.animal_key);
    return animalRgNs.has(weight.rgn) && rgnCounts.get(weight.rgn) === 1;
  });
  const thisMonth = today.slice(0, 7);
  const activeTotal = scopedAnimals.filter(
    (animal) => animal.animal_state?.toUpperCase() === "ATIVO",
  ).length;
  const entradaEsteMes = scopedAnimals.filter(
    (animal) => toISODate(animal.created_at).slice(0, 7) === thisMonth,
  ).length;
  const nascimentos30d = scopedAnimals.filter((animal) => {
    if (!animal.born_date || animal.born_date > today) return false;
    const days = diffInDays(animal.born_date, today);
    return days <= 30;
  }).length;
  const femeasPrenhas = scopedAnimals.filter(
    (animal) => animal.animal_state?.toUpperCase() === "PRENHA",
  ).length;
  const animalEmTratamento = scopedAnimals.filter(
    (animal) => animal.animal_state?.toUpperCase() === "EM_TRATAMENTO",
  ).length;
  const animalEmAlerta = scopedAnimals.filter(
    (animal) => animal.animal_state?.toUpperCase() === "ALERTA",
  ).length;

  const weightsByAnimal = new Map<string, AnimalMetric[]>();
  for (const weight of scopedWeights) {
    const key = weight.animal_key ? `key:${weight.animal_key}` : `rgn:${weight.rgn}`;
    const animalWeights = weightsByAnimal.get(key) ?? [];
    animalWeights.push(weight);
    weightsByAnimal.set(key, animalWeights);
  }

  const gmds: number[] = [];
  for (const animalWeights of weightsByAnimal.values()) {
    if (animalWeights.length < 2) continue;
    const sorted = [...animalWeights].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const days = diffInDays(first.date, last.date);
    if (days > 0) gmds.push((last.value - first.value) / days);
  }

  return {
    activeTotal,
    entradaEsteMes,
    nascimentos30d,
    femeasPrenhas,
    gmdMedio: gmds.length
      ? gmds.reduce((sum, value) => sum + value, 0) / gmds.length
      : null,
    totalPesagens: scopedWeights.length,
    animalEmTratamento,
    animalEmAlerta,
  };
}

export function useDashboardStats(farmId?: string) {
  const {
    data: animals = [],
    loading: animalsLoading,
    error: animalsError,
  } = useAnimals();
  const {
    data: weights = [],
    loading: weightsLoading,
    error: weightsError,
  } = useAnimalWeights();

  const stats = useMemo(
    () => calculateDashboardStats(animals, weights, farmId),
    [animals, farmId, weights],
  );

  return {
    stats: animalsLoading || weightsLoading || animalsError || weightsError ? EMPTY : stats,
    loading: animalsLoading || weightsLoading,
    error: animalsError || weightsError,
  };
}
