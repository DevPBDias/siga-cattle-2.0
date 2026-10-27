"use client";

import { useLocalMutation } from "@/hooks/core";
import { Animal } from "@/types/animal.type";

export function useCreateAnimal() {
  const { loading, error, actions } = useLocalMutation<Animal>("animals");

  const createAnimal = async (data: Partial<Animal>): Promise<Animal> => {
    const animalData: Animal = {
      breed: data.breed || "Nelore",
      ...data,
      animal_state: "ATIVO",
    } as Animal;

    // Returns the created animal document
    return await actions.create(animalData);
  };

  const saveAnimal = async (data: Partial<Animal>): Promise<Animal> => {
    const animalData: Animal = {
      ...data,
    } as Animal;

    // Returns the upserted animal document
    return await actions.upsert(animalData);
  };

  return {
    data: null,
    loading,
    error,
    actions: {
      ...actions,
      createAnimal,
      saveAnimal,
    },
  };
}
