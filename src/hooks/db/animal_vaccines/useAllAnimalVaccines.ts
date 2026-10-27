"use client";

import { useMemo } from "react";
import { useLocalQuery } from "@/hooks/core";
import { AnimalVaccine } from "@/types/vaccine.type";

export function useAllAnimalVaccines() {
  const query = useMemo(
    () => ({
      selector: { _deleted: { $eq: false } },
    }),
    [],
  );

  return useLocalQuery<AnimalVaccine>("animal_vaccines", query);
}
