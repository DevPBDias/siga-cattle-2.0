"use client";

import { useLocalMutation } from "@/hooks/core";
import { Death } from "@/types/death.type";
import { v4 as uuidv4 } from "uuid";

export function useCreateDeath() {
  const { loading, error, actions } = useLocalMutation<Death>("deaths");

  const createDeath = (data: Partial<Death>): Promise<Death> =>
    actions.create({
      ...data,
      id: data.id ?? uuidv4(),
      photos: data.photos ?? [],
      photo_paths: data.photo_paths ?? [],
    });

  return {
    loading,
    error,
    actions: { ...actions, createDeath },
  };
}
