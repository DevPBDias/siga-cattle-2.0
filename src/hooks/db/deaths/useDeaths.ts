"use client";

import { useLocalQuery } from "@/hooks/core/useLocalQuery";
import { Death } from "@/types/death.type";
import { useMemo } from "react";
import type { MangoQuery } from "rxdb";

export function useDeaths() {
  const query = useMemo<MangoQuery<Death>>(
    () => ({
      selector: { _deleted: { $eq: false } },
      sort: [{ date: "desc" } as any],
    }),
    [],
  );

  const { data, loading, error, actions } = useLocalQuery<Death>(
    "deaths",
    query,
  );

  return { data, loading, error, actions };
}
