"use client";

import { useMemo } from "react";
import { useLocalQuery } from "@/hooks/core";
import { ReproductionEvent } from "@/types/reproduction_event.type";

export function useReproductionEvents(rgn?: string, animalKey?: string) {
  const cleanRgn = rgn ? rgn.trim() : undefined;

  const query = useMemo(() => {
    if (!cleanRgn && !animalKey) {
      return {
        selector: {
          _deleted: { $eq: false },
        },
        sort: [{ d0_date: "desc" as const }],
      };
    }

    if (animalKey) {
      return {
        selector: {
          _deleted: { $eq: false },
          animal_key: { $eq: animalKey },
        },
        sort: [{ d0_date: "desc" as const }],
      };
    }

    const normalizedRgn = cleanRgn || "";
    const rgnVariants = Array.from(
      new Set([
        normalizedRgn,
        normalizedRgn.toUpperCase(),
        normalizedRgn.toLowerCase(),
      ]),
    );

    return {
      selector: {
        _deleted: { $eq: false },
        rgn: rgnVariants.length > 1 ? { $in: rgnVariants } : { $eq: normalizedRgn },
      },
      sort: [{ d0_date: "desc" as const }],
    };
  }, [animalKey, cleanRgn]);

  const { data, loading, error, actions } = useLocalQuery<ReproductionEvent>(
    "reproduction_events",
    query,
  );

  return {
    data,
    loading,
    error,
    actions,
  };
}
