"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useVaccines } from "@/hooks/db/vaccines/useVaccines";
import { useCreateVaccine } from "@/hooks/db/vaccines/useCreateVaccine";
import { useDeleteVaccine } from "@/hooks/db/vaccines/useDeleteVaccine";
import { useCreateAnimalVaccine } from "@/hooks/db/animal_vaccines/useCreateAnimalVaccine";
import { useAnimalVaccines } from "@/hooks/db/animal_vaccines/useAnimalVaccines";
import { compareDates, todayISO } from "@/utils/dates";
import { toast } from "sonner";
import { VaccineHistoryEntry } from "@/types/vaccine.type";

export function useVaccineForm() {
  const router = useRouter();
  const { data: animals = [] } = useAnimals();
  const { actions: { createVaccine } } = useCreateVaccine();
  const { actions: { deleteVaccine } } = useDeleteVaccine();
  const { actions: { createAnimalVaccine } } = useCreateAnimalVaccine();
  const { data: vaccines = [], loading: isLoading } = useVaccines();

  const [multipleAnimals, setMultipleAnimals] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    rgn: "",
    vacinas: [] as string[],
    data: todayISO(),
  });

  const { data: animalVaccines = [], loading: loadingAnimalVaccines } =
    useAnimalVaccines(!multipleAnimals ? formData.rgn || undefined : undefined);

  const existingVaccinesWithNames = useMemo<VaccineHistoryEntry[]>(() => {
    if (!animalVaccines || animalVaccines.length === 0) return [];
    return animalVaccines
      .map((av) => {
        const vaccine = vaccines.find((v) => v.id === av.vaccine_id);
        return { id: av.id, name: vaccine?.vaccine_name || "Vacina desconhecida", date: av.date };
      })
      .sort((a, b) => compareDates(b.date, a.date));
  }, [animalVaccines, vaccines]);

  const duplicateWarnings = useMemo(() => {
    if (!formData.vacinas.length || !existingVaccinesWithNames.length) return [];
    return formData.vacinas.filter((selectedVaccine) =>
      existingVaccinesWithNames.some(
        (existing) => existing.name.toLowerCase() === selectedVaccine.toLowerCase(),
      ),
    );
  }, [formData.vacinas, existingVaccinesWithNames]);

  const rgnOptions = useMemo(
    () =>
      animals
        .map((animal) => ({ label: animal.rgn || "", value: animal.rgn || "" }))
        .filter((option) => option.value),
    [animals],
  );

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.rgn.trim() || formData.vacinas.length === 0 || !formData.data) {
      setError("Preencha todos os campos obrigatórios (*) e selecione pelo menos uma vacina.");
      return;
    }
    setReviewModalOpen(true);
  };

  const handleConfirmRegister = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const targetRgns = multipleAnimals
        ? formData.rgn.split(/[\n,;]+/).map((r) => r.trim()).filter(Boolean)
        : [formData.rgn.trim()];

      for (const rgnItem of targetRgns) {
        const animal = animals.find((a) => a.rgn?.toLowerCase() === rgnItem.toLowerCase());
        if (animal) {
          for (const vacinaNome of formData.vacinas) {
            const vaccine = vaccines.find(
              (v) => v.vaccine_name.toLowerCase() === vacinaNome.toLowerCase(),
            );
            if (vaccine) {
              await createAnimalVaccine({ rgn: animal.rgn, vaccine_id: vaccine.id, date: formData.data });
            }
          }
        }
      }
      setReviewModalOpen(false);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error("Erro ao registrar vacinas:", err);
      const message = "Ocorreu um erro ao registrar as vacinas no banco local.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessModalOpen(false);
    setFormData({ rgn: "", vacinas: [], data: todayISO() });
  };

  const handleCreateVaccine = async (name: string) => {
    try {
      const normalizedName = name.trim();
      const existing = vaccines.find(
        (v) => v.vaccine_name.toLowerCase() === normalizedName.toLowerCase(),
      );
      if (existing) {
        setFormData((prev) => ({
          ...prev,
          vacinas: prev.vacinas.some((v) => v.toLowerCase() === normalizedName.toLowerCase())
            ? prev.vacinas
            : [...prev.vacinas, existing.vaccine_name],
        }));
        setAddModalOpen(false);
        return;
      }
      await createVaccine({ vaccine_name: normalizedName });
      setFormData((prev) => ({
        ...prev,
        vacinas: prev.vacinas.includes(normalizedName)
          ? prev.vacinas
          : [...prev.vacinas, normalizedName],
      }));
    } catch (err) {
      console.error("Erro ao criar vacina:", err);
      setError("Erro ao cadastrar nova vacina.");
      toast.error("Erro ao cadastrar nova vacina.");
    }
  };

  const handleDeleteVaccine = async (id: string) => {
    try {
      const vaccineToDelete = vaccines.find((vaccine) => vaccine.id === id);
      await deleteVaccine(id);
      if (vaccineToDelete) {
        setFormData((prev) => ({
          ...prev,
          vacinas: prev.vacinas.filter(
            (v) => v.toLowerCase() !== vaccineToDelete.vaccine_name.toLowerCase(),
          ),
        }));
      }
    } catch (err) {
      console.error("Erro ao deletar vacina:", err);
      setError("Erro ao excluir vacina.");
      toast.error("Erro ao excluir vacina.");
    }
  };

  const toggleVaccine = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      vacinas: checked ? [...prev.vacinas, name] : prev.vacinas.filter((v) => v !== name),
    }));
  };

  return {
    // Data
    vaccines,
    isLoading,
    rgnOptions,
    existingVaccinesWithNames,
    duplicateWarnings,
    loadingAnimalVaccines,
    // Form state
    formData,
    setFormData,
    multipleAnimals,
    setMultipleAnimals,
    error,
    isSubmitting,
    // Modal state
    successModalOpen,
    addModalOpen,
    deleteModalOpen,
    reviewModalOpen,
    setSuccessModalOpen,
    setAddModalOpen,
    setDeleteModalOpen,
    setReviewModalOpen,
    // Handlers
    handleOpenReview,
    handleConfirmRegister,
    handleCloseSuccess,
    handleCreateVaccine,
    handleDeleteVaccine,
    toggleVaccine,
    router,
  };
}
