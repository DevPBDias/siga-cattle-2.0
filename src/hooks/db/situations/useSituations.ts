"use client";

import { useLocalQuery } from "@/hooks/core";
import { AnimalSituation } from "@/types/situation.type";

export function useSituations() {
  const { data, loading, error, actions } = useLocalQuery<AnimalSituation>(
    "animal_situations",
    {
      selector: {
        _deleted: { $eq: false },
      },
      sort: [{ situation_name: "asc" }],
    },
  );

  return {
    data,
    loading,
    error,
    actions,
  };
}
