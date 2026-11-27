"use client";

import { useLocalMutation } from "@/hooks/core";
import { AnimalMetric } from "@/types/animal_metrics.type";
import { v4 as uuidv4 } from "uuid";

export function useCreateAnimalWeight() {
  const { loading, error, actions } = useLocalMutation<AnimalMetric>(
    "animal_metrics_weight",
  );

  const createAnimalWeight = async (
    data: Omit<AnimalMetric, "id" | "updated_at" | "_deleted" | "created_at">,
  ): Promise<AnimalMetric> => {
    const newWeight: Partial<AnimalMetric> = {
      id: uuidv4(),
      metric_type: "weight",
      ...data,
    };

    return await actions.create(newWeight);
  };

  return {
    data: null,
    loading,
    error,
    actions: {
      ...actions,
      createAnimalWeight,
    },
  };
}
