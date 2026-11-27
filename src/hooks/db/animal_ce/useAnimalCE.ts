"use client";

import { useMemo } from "react";
import { useLocalQuery } from "@/hooks/core";
import { AnimalMetric } from "@/types/animal_metrics.type";

export function useAnimalCE(rgn?: string, animalKey?: string) {
  const query = useMemo(
    () => ({
      selector: {
        _deleted: { $eq: false },
        metric_type: { $eq: "ce" },
        ...(animalKey
          ? { animal_key: { $eq: animalKey } }
          : rgn
            ? { rgn: { $eq: rgn } }
            : {}),
      },
      sort: [{ date: "asc" as const }],
    }),
    [animalKey, rgn],
  );

  const { data, loading, error, actions } = useLocalQuery<AnimalMetric>(
    "animal_metrics_weight",
    query,
  );

  return {
    data,
    loading,
    error,
    actions,
  };
}
