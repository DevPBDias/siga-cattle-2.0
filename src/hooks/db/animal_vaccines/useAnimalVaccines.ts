"use client";

import { useMemo } from "react";
import { useLocalQuery } from "@/hooks/core";
import { AnimalVaccine } from "@/types/vaccine.type";

export function useAnimalVaccines(rgn?: string, animalKey?: string) {
  const query = useMemo(() => {
    if (!rgn && !animalKey) return null;
    return {
      selector: {
        _deleted: { $eq: false },
        ...(animalKey
          ? { animal_key: { $eq: animalKey } }
          : { rgn: { $eq: rgn } }),
      },
      sort: [{ date: "desc" as const }],
    };
  }, [animalKey, rgn]);

  const { data, loading, error, actions } = useLocalQuery<AnimalVaccine>(
    "animal_vaccines",
    query,
  );

  return {
    data,
    loading,
    error,
    actions,
  };
}
