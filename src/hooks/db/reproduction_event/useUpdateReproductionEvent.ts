"use client";

import { useLocalMutation } from "@/hooks/core";
import { useRxDatabase } from "@/providers";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { syncAnimalConditionFromEvent } from "./syncAnimalCondition";

export function useUpdateReproductionEvent() {
  const db = useRxDatabase();
  const { loading, error, actions } = useLocalMutation<ReproductionEvent>(
    "reproduction_events",
  );

  const updateReproductionEvent = async (
    id: string,
    data: Partial<ReproductionEvent>,
  ): Promise<void> => {
    await actions.update(id, data);
    if (data.productive_status) {
      await syncAnimalConditionFromEvent(db, {
        eventId: id,
        animalKey: data.animal_key,
        rgn: data.rgn,
        productiveStatus: data.productive_status,
      });
    }
  };

  return {
    data: null,
    loading,
    error,
    actions: {
      ...actions,
      updateReproductionEvent,
    },
  };
}
