"use client";

import { useMemo } from "react";
import { useLocalQuery } from "@/hooks/core";
import { ReproductionEvent } from "@/types/reproduction_event.type";

export function useReproductionEvents(rgn?: string) {
  const cleanRgn = rgn ? rgn.trim() : undefined;

  const query = useMemo(() => {
    if (!cleanRgn) {
      return {
        selector: {
          _deleted: { $eq: false },
        },
        sort: [{ d0_date: "desc" } as any],
      };
    }

    const rgnVariants = Array.from(
      new Set([cleanRgn, cleanRgn.toUpperCase(), cleanRgn.toLowerCase()]),
    );

    return {
      selector: {
        _deleted: { $eq: false },
        rgn: rgnVariants.length > 1 ? { $in: rgnVariants } : { $eq: cleanRgn },
      },
      sort: [{ d0_date: "desc" } as any],
    };
  }, [cleanRgn]);

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
