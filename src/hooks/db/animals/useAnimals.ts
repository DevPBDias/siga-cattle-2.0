"use client";

import { useLocalQuery } from "@/hooks/core/useLocalQuery";
import { Animal } from "@/types/animal.type";
import { useMemo } from "react";
import type { MangoQuery } from "rxdb";

/**
 * Hook reativo para obter a lista de todos os animais não deletados.
 * Utiliza a abstração useLocalQuery para garantir consistência e performance.
 */
export function useAnimals() {
  const query = useMemo<MangoQuery<Animal>>(
    () => ({
      selector: {
        _deleted: { $eq: false },
      },
      sort: [{ serie_rgd: "asc", rgn: "asc" }],
    }),
    []
  );

  const { data, loading, error, actions } = useLocalQuery<Animal>(
    "animals",
    query,
  );

  return {
    data,
    loading,
    error,
    actions,
  };
}
