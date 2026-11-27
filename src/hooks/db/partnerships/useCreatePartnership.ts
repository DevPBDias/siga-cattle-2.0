"use client";

import { useLocalMutation } from "@/hooks/core";
import { AnimalPartnership } from "@/types/partnership.type";
import { v4 as uuidv4 } from "uuid";

export function useCreatePartnership() {
  const { loading, error, actions } = useLocalMutation<AnimalPartnership>(
    "animal_partnerships",
  );

  const createPartnership = async (
    data: Omit<
      AnimalPartnership,
      "id" | "updated_at" | "_deleted" | "created_at"
    >,
  ): Promise<AnimalPartnership> => {
    const newPartnership: Partial<AnimalPartnership> = {
      id: uuidv4(),
      ...data,
    };

    return await actions.create(newPartnership);
  };

  return {
    data: null,
    loading,
    error,
    actions: {
      ...actions,
      createPartnership,
    },
  };
}
