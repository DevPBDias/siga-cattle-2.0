"use client";

import { useLocalMutation } from "@/hooks/core";
import { AnimalMetric } from "@/types/animal_metrics.type";

export function useUpdateAnimalWeight() {
  const { loading, error, actions } = useLocalMutation<AnimalMetric>(
    "animal_metrics_weight",
  );

  const updateAnimalWeight = async (
    id: string,
    data: Partial<AnimalMetric>,
  ): Promise<void> => {
    await actions.update(id, { ...data, metric_type: "weight" });
  };

  return {
    data: null,
    loading,
    error,
    actions: {
      ...actions,
      updateAnimalWeight,
    },
  };
}
