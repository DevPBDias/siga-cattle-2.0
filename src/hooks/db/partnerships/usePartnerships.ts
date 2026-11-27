"use client";

import { useLocalQuery } from "@/hooks/core";
import { AnimalPartnership } from "@/types/partnership.type";

export function usePartnerships() {
  const { data, loading, error, actions } = useLocalQuery<AnimalPartnership>(
    "animal_partnerships",
    {
      selector: {
        _deleted: { $eq: false },
      },
      sort: [{ partner_name: "asc" }],
    },
  );

  return {
    data,
    loading,
    error,
    actions,
  };
}
