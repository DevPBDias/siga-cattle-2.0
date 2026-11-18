"use client";

import { useLocalMutation } from "@/hooks/core";
import { Animal } from "@/types/animal.type";
import { useRxDatabase } from "@/providers";

export function useDeleteAnimal() {
  const { loading, error, actions } = useLocalMutation<Animal>("animals");
  const db = useRxDatabase();

  const deleteAnimal = async (animalKeyOrRgn: string): Promise<void> => {
    let animalKey = animalKeyOrRgn;
    if (db && !animalKeyOrRgn.includes("::")) {
      const matches = await db.animals
        .find({ selector: { rgn: { $eq: animalKeyOrRgn }, _deleted: { $eq: false } } })
        .exec();
      if (matches.length > 1) {
        throw new Error(
          `O RGN ${animalKeyOrRgn} pertence a mais de um animal. Selecione pela combinação Série/RGD e RGN.`,
        );
      }
      if (matches.length === 1) {
        animalKey = matches[0].animal_key ?? animalKeyOrRgn;
      }
    }
    await actions.remove(animalKey);
  };

  return {
    data: null,
    loading,
    error,
    actions: {
      ...actions,
      deleteAnimal,
    },
  };
}
