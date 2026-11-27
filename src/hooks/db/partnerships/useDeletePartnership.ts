"use client";

import { useLocalMutation } from "@/hooks/core";
import { AnimalPartnership } from "@/types/partnership.type";

export function useDeletePartnership() {
  const { loading, error, actions } = useLocalMutation<AnimalPartnership>(
    "animal_partnerships",
  );

  const deletePartnership = async (id: string): Promise<void> => {
    await actions.remove(id);
  };

  return {
    data: null,
    loading,
    error,
    actions: {
      ...actions,
      deletePartnership,
    },
  };
}
