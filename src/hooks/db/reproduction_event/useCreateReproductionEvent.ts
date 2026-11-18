"use client";

import { useLocalMutation } from "@/hooks/core";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { v4 as uuidv4 } from "uuid";

export function useCreateReproductionEvent() {
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

    return await actions.create(newEvent);
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
