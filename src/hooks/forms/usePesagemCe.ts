"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useAnimalWeights } from "@/hooks/db/animal_weights/useAnimalWeights";
import { useCreateAnimalWeight } from "@/hooks/db/animal_weights/useCreateAnimalWeight";
import { useUpdateAnimalWeight } from "@/hooks/db/animal_weights/useUpdateAnimalWeight";
import { useDeleteAnimalWeight } from "@/hooks/db/animal_weights/useDeleteAnimalWeight";
import { useAnimalCE } from "@/hooks/db/animal_ce/useAnimalCE";
import { useCreateAnimalCE } from "@/hooks/db/animal_ce/useCreateAnimalCE";
import { useUpdateAnimalCE } from "@/hooks/db/animal_ce/useUpdateAnimalCE";
import { useDeleteAnimalCE } from "@/hooks/db/animal_ce/useDeleteAnimalCE";

export function usePesagemCe() {
  const { data: animals = [] } = useAnimals();
  const [error, setError] = useState<string | null>(null);
  const [rgn, setRgn] = useState("");
  const [type, setType] = useState("pesagem");
  const [isBorn, setIsBorn] = useState(false);
  const [successModal, setSuccessModal] = useState({ open: false, title: "" });

  const selectedAnimal = useMemo(() => {
    if (!rgn) return null;
    return animals.find((d) => d.rgn?.toLowerCase() === rgn.toLowerCase()) ?? null;
  }, [rgn, animals]);

  const { data: pesosMedidos = [], loading: loadingWeights } = useAnimalWeights(selectedAnimal?.rgn);
  const { actions: { createAnimalWeight: createWeight } } = useCreateAnimalWeight();
  const { actions: { updateAnimalWeight: updateWeight } } = useUpdateAnimalWeight();
  const { actions: { deleteAnimalWeight: deleteWeight } } = useDeleteAnimalWeight();

  const { data: circunferenciaEscrotal = [], loading: loadingCE } = useAnimalCE(selectedAnimal?.rgn);
  const { actions: { createAnimalCE: createCE } } = useCreateAnimalCE();
  const { actions: { updateAnimalCE: updateCE } } = useUpdateAnimalCE();
  const { actions: { deleteAnimalCE: deleteCE } } = useDeleteAnimalCE();

  const rgnOptions = useMemo(
    () =>
      animals
        .map((animal) => ({ label: animal.rgn || "", value: animal.rgn || "" }))
        .filter((option) => option.value),
    [animals],
  );

  const fail = (message: string, err?: unknown) => {
    if (err) console.error(message, err);
    setError(message);
    toast.error(message);
  };

  const handleAddPeso = async (date: string, valor: number) => {
    setError(null);
    if (!selectedAnimal?.rgn) return fail("Selecione um animal");
    try {
      await createWeight({ rgn: selectedAnimal.rgn, date, value: valor, born_metric: isBorn });
      setIsBorn(false);
      setSuccessModal({ open: true, title: "Peso registrado!" });
    } catch (err) {
      fail("Erro ao adicionar peso", err);
    }
  };

  const handleAddCE = async (date: string, valor: number) => {
    setError(null);
    if (!selectedAnimal?.rgn) return fail("Selecione um animal");
    try {
      await createCE({ rgn: selectedAnimal.rgn, date, value: valor, born_metric: isBorn });
      setIsBorn(false);
      setSuccessModal({ open: true, title: "CE registrada!" });
    } catch (err) {
      fail("Erro ao adicionar CE", err);
    }
  };

  const handleEditPeso = async (id: string, valor: number) => {
    try {
      await updateWeight(id, { value: valor });
    } catch (err) {
      fail("Erro ao editar peso", err);
    }
  };

  const handleDeletePeso = async (id: string) => {
    try {
      await deleteWeight(id);
    } catch (err) {
      fail("Erro ao deletar peso", err);
    }
  };

  const handleEditCE = async (id: string, valor: number) => {
    try {
      await updateCE(id, { value: valor });
    } catch (err) {
      fail("Erro ao editar CE", err);
    }
  };

  const handleDeleteCE = async (id: string) => {
    try {
      await deleteCE(id);
    } catch (err) {
      fail("Erro ao deletar CE", err);
    }
  };

  return {
    data: {
      selectedAnimal,
      rgnOptions,
      pesosMedidos,
      circunferenciaEscrotal,
      successModal,
    },
    loading: loadingWeights || loadingCE,
    error,
    actions: {
      rgn,
      setRgn,
      clearSelection: () => setRgn(""),
      type,
      setType,
      isBorn,
      setIsBorn,
      handleAddPeso,
      handleAddCE,
      handleEditPeso,
      handleDeletePeso,
      handleEditCE,
      handleDeleteCE,
      closeSuccess: () => setSuccessModal({ ...successModal, open: false }),
    },
  };
}
