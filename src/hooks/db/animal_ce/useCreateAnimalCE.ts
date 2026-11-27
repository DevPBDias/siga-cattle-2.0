"use client";

import { useLocalMutation } from "@/hooks/core";
import { AnimalMetric } from "@/types/animal_metrics.type";
import { v4 as uuidv4 } from "uuid";

export function useCreateAnimalCE() {
  const { loading, error, actions } =
    useLocalMutation<AnimalMetric>("animal_metrics_weight");

  const createAnimalCE = async (
    data: Omit<AnimalMetric, "id" | "updated_at" | "_deleted" | "created_at">,
  ): Promise<AnimalMetric> => {
    const newCE: Partial<AnimalMetric> = {
      id: uuidv4(),
      metric_type: "ce",
      ...data,
    };

    return await actions.create(newCE);
  };

  return {
    loading,
    error,
    actions: {
      ...actions,
      createAnimalCE,
    },
  };
}
