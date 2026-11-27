"use client";

import { useLocalMutation } from "@/hooks/core";
import { Animal } from "@/types/animal.type";
import { getAnimalKey } from "@/utils/animalIdentity";
import { useRxDatabase } from "@/providers";

export function useCreateAnimal() {
  const { loading, error, actions } = useLocalMutation<Animal>("animals");
  const db = useRxDatabase();

  const createAnimal = async (data: Partial<Animal>): Promise<Animal> => {
    if (!data.serie_rgd || !data.rgn) {
      throw new Error("Informe a série/RGD e o RGN para cadastrar o animal.");
    }
    const animalKey = getAnimalKey({
      serie_rgd: data.serie_rgd,
      rgn: data.rgn,
    });
    const existing = await db?.animals.findOne(animalKey).exec();
    if (existing) {
      throw new Error("Já existe um animal com esta combinação de Série/RGD e RGN.");
    }
    const animalData: Animal = {
      breed: data.breed || "Nelore",
      ...data,
      animal_key: animalKey,
      animal_state: data.animal_state ?? "ATIVO",
    } as Animal;

    try {
      return await actions.create(animalData);
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("primary")) {
        throw new Error("Já existe um animal com esta combinação de Série/RGD e RGN.");
      }
      throw error;
    }
  };

  const saveAnimal = async (data: Partial<Animal>): Promise<Animal> => {
    if (!data.serie_rgd || !data.rgn) {
      throw new Error("Informe a série/RGD e o RGN para importar o animal.");
    }
    const animalData: Animal = {
      ...data,
      animal_key: getAnimalKey({
        serie_rgd: data.serie_rgd,
        rgn: data.rgn,
      }),
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
