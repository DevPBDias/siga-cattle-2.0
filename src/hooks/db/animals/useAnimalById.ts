"use client";

import { useMemo } from "react";
import { useLocalQuery } from "@/hooks/core/useLocalQuery";
import { Animal } from "@/types/animal.type";
import type { MangoQuery } from "rxdb";

export function useAnimalById(animalKeyOrRgn: string | null) {
  const query = useMemo<MangoQuery<Animal> | null>(
    () =>
      animalKeyOrRgn
        ? {
            selector: {
              _deleted: { $eq: false },
              ...(animalKeyOrRgn.includes("::")
                ? { animal_key: { $eq: animalKeyOrRgn } }
                : { rgn: { $eq: animalKeyOrRgn } }),
            },
          }
        : null,
    [animalKeyOrRgn],
  );
  const { data: animals, loading, error, actions } = useLocalQuery<Animal>(
    "animals",
    query,
  );

  return {
    data: animals.length === 1 ? animals[0] : null,
    loading,
    error,
    actions,
  };
}
