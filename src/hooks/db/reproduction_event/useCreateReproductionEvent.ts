"use client";

import { useLocalMutation } from "@/hooks/core";
import { useRxDatabase } from "@/providers";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { v4 as uuidv4 } from "uuid";
import { syncAnimalConditionFromEvent } from "./syncAnimalCondition";

export function useCreateReproductionEvent() {
  const db = useRxDatabase();
  const { loading, error, actions } = useLocalMutation<ReproductionEvent>(
    "reproduction_events",
  );

  const createReproductionEvent = async (
    data: Omit<
      ReproductionEvent,
      "event_id" | "updated_at" | "_deleted" | "created_at"
    >,
  ): Promise<ReproductionEvent> => {
    const newEvent: Partial<ReproductionEvent> = {
      event_id: uuidv4(),
      ...data,
    };
    if (!newEvent.animal_key) {
      throw new Error("É necessário selecionar um animal pela combinação Série/RGD e RGN.");
    }

    const created = await actions.create(newEvent);
    await syncAnimalConditionFromEvent(db, {
      eventId: created.event_id,
      animalKey: created.animal_key,
      rgn: created.rgn,
      productiveStatus: created.productive_status,
    });
    return created;
  };

  return {
    data: null,
    loading,
    error,
    actions: {
      ...actions,
      createReproductionEvent,
    },
  };
}
