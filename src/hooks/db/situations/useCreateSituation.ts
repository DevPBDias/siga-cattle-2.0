"use client";

import { useLocalMutation } from "@/hooks/core";
import { AnimalSituation } from "@/types/situation.type";
import { v4 as uuidv4 } from "uuid";

export function useCreateSituation() {
  const { loading, error, actions } = useLocalMutation<AnimalSituation>(
    "animal_situations",
  );

  const createSituation = async (
    data: Omit<
      AnimalSituation,
      "id" | "updated_at" | "_deleted" | "created_at"
    >,
  ): Promise<AnimalSituation> => {
    const newSituation: Partial<AnimalSituation> = {
      id: uuidv4(),
      ...data,
    };

    return await actions.create(newSituation);
  };

  return {
    data: null,
    loading,
    error,
    actions: {
      ...actions,
      createSituation,
    },
  };
}
