"use client";

import { useMemo, useState } from "react";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { getAnimalKeyFromReference } from "@/utils/animalIdentity";

export function useAnimalManage() {
  const { data: animals = [], loading, error } = useAnimals();
  const [selectedRgn, setSelectedRgn] = useState("");
  const [activeTab, setActiveTab] = useState("fazenda");

  const selectedAnimal = useMemo(() => {
    if (!selectedRgn) return null;
    return animals.find(
      (animal) => getAnimalKeyFromReference(animal) === selectedRgn,
    ) ?? null;
  }, [selectedRgn, animals]);

  const rgnOptions = useMemo(
    () =>
      animals
        .map((animal) => ({
          label: `${animal.serie_rgd} ${animal.rgn}`,
          value: getAnimalKeyFromReference(animal),
        }))
        .filter((option) => option.value),
    [animals],
  );

  return {
    data: { selectedAnimal, rgnOptions },
    loading,
    error,
    actions: {
      selectedRgn,
      setSelectedRgn,
      clearSelection: () => setSelectedRgn(""),
      activeTab,
      setActiveTab,
    },
  };
}
