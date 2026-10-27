"use client";

import { useMemo, useState } from "react";
import { useAnimals } from "@/hooks/db/animals/useAnimals";

export function useAnimalManage() {
  const { data: animals = [], loading, error } = useAnimals();
  const [selectedRgn, setSelectedRgn] = useState("");
  const [activeTab, setActiveTab] = useState("fazenda");

  const selectedAnimal = useMemo(() => {
    if (!selectedRgn) return null;
    return animals.find((a) => a.rgn?.toLowerCase() === selectedRgn.toLowerCase()) ?? null;
  }, [selectedRgn, animals]);

  const rgnOptions = useMemo(
    () =>
      animals
        .map((animal) => ({ label: animal.rgn || "", value: animal.rgn || "" }))
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
