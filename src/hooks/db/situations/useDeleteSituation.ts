"use client";

import { useLocalMutation } from "@/hooks/core";
import { AnimalSituation } from "@/types/situation.type";

export function useDeleteSituation() {
  const { loading, error, actions } = useLocalMutation<AnimalSituation>(
    "animal_situations",
  );

  const deleteSituation = async (id: string): Promise<void> => {
    await actions.remove(id);
  };

  return {
    data: null,
    loading,
    error,
    actions: {
      ...actions,
      deleteSituation,
    },
  };
}
