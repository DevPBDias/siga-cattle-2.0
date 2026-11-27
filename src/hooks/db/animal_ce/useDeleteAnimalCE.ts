"use client";

import { useLocalMutation } from "@/hooks/core";
import { AnimalMetric } from "@/types/animal_metrics.type";

export function useDeleteAnimalCE() {
  const { loading, error, actions } =
    useLocalMutation<AnimalMetric>("animal_metrics_weight");

  const deleteAnimalCE = async (id: string): Promise<void> => {
    await actions.remove(id);
  };

  return {
    loading,
    error,
    actions: {
      ...actions,
      deleteAnimalCE,
    },
  };
}
