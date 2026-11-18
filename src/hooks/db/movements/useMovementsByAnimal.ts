"use client";

import { useMemo } from "react";
import { useLocalQuery } from "@/hooks/core";
import { Movement } from "@/types/movement.type";
import { MangoQuery } from "rxdb";

export function useMovementsByAnimal(animalKeyOrRgn: string | null) {
  const query = useMemo<MangoQuery<Movement>>(() => {
    return {
      selector: {
        ...(animalKeyOrRgn?.includes("::")
          ? { animal_key: { $eq: animalKeyOrRgn } }
          : { animal_id: { $eq: animalKeyOrRgn || "" } }),
        _deleted: { $eq: false },
      },
      sort: [{ date: "desc" as const }],
    };
  }, [animalKeyOrRgn]);

  const {
    data: movements,
    loading: isLoading,
    error,
    actions: { refetch },
  } = useLocalQuery<Movement>("movements", query);

  return {
    data: movements || [],
    loading: isLoading,
    error,
    actions: { refetch },
  };
}
