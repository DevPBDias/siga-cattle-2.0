"use client";

import { useMemo } from "react";
import { useAnimals } from "./useAnimals";
import { Animal } from "@/types/animal.type";

export const getBullDisplayName = (animal: Animal) => {
  const code = `${animal.serie_rgd ? animal.serie_rgd + " " : ""}${animal.rgn}`.trim();
  return animal.name ? `${code} - ${animal.name}` : code;
};

export const isMale = (animal: Animal) =>
  ["m", "macho"].includes(animal.sex?.toLocaleLowerCase() ?? "");

export const isBullActive = (animal: Animal) => {
  if (animal._deleted) return false;
  const state = animal.animal_state?.trim().toUpperCase();
  return !state || state === "ATIVO";
};

export interface UseNaturalBullsOptions {
  /** Se verdadeiro, retorna apenas touros com animal_state === 'ATIVO' e não deletados */
  onlyActive?: boolean;
}

export function useNaturalBulls(options?: UseNaturalBullsOptions) {
  const { data: animals = [], loading, error, actions } = useAnimals();

  const bulls = useMemo(() => {
    return animals.filter((animal) => {
      if (!animal.is_natural_bull || !isMale(animal)) return false;
      if (animal._deleted) return false;
      if (options?.onlyActive && !isBullActive(animal)) return false;
      return true;
    });
  }, [animals, options?.onlyActive]);

  const bullOptions = useMemo(() => {
    return bulls.map((bull) => {
      const display = getBullDisplayName(bull);
      return {
        value: display,
        label: display,
        animal: bull,
      };
    });
  }, [bulls]);

  return {
    bulls,
    bullOptions,
    loading,
    error,
    actions,
  };
}
