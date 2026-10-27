"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateAnimal } from "@/hooks/db/animals/useCreateAnimal";
import { Animal } from "@/types/animal.type";

export function useAnimalCadastro() {
  const router = useRouter();
  const { actions: { createAnimal } } = useCreateAnimal();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdRgn, setCreatedRgn] = useState("");

  const handleFormSubmit = async (data: Partial<Animal>) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createAnimal(data);
      setCreatedRgn(data.rgn || "");
      setShowModal(true);
    } catch (error) {
      console.error("Erro ao cadastrar animal:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao salvar os dados. Verifique o RGN se já existe.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    router.replace("/consulta");
  };

  return {
    data: { createdRgn },
    loading: isSubmitting,
    error: errorMessage,
    actions: {
      showModal,
      handleFormSubmit,
      handleCloseModal,
    },
  };
}
