"use client";

import { useLocalMutation } from "@/hooks/core";
import { AnimalMetric } from "@/types/animal_metrics.type";

export function useUpdateAnimalCE() {
  const { loading, error, actions } =
    useLocalMutation<AnimalMetric>("animal_metrics_weight");

  const updateAnimalCE = async (
    id: string,
    data: Partial<AnimalMetric>,
  ): Promise<void> => {
    await actions.update(id, data);
  };

  return {
    loading,
    error,
    actions: {
      ...actions,
      updateAnimalCE,
    },
  };
}
