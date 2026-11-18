"use client";

import { useMemo, useState } from "react";
import { useMatrizes } from "@/hooks/matrizes/useMatrizes";
import { useReproductionEvents } from "@/hooks/db/reproduction_event/useReproductionEvents";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { getAnimalKeyFromReference } from "@/utils/animalIdentity";

export function useReproductionList() {
  const { matrizes, isLoading: matrizesLoading } = useMatrizes();
  const [selectedRgn, setSelectedRgn] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<ReproductionEvent | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<ReproductionEvent | null>(null);

  const selectedMatriz = useMemo(() => {
    if (!selectedRgn) return null;
    return matrizes.find(
      (matriz) => getAnimalKeyFromReference(matriz) === selectedRgn,
    ) || null;
  }, [selectedRgn, matrizes]);

  const rgnOptions = useMemo(
    () =>
      matrizes
        .map((matriz) => ({
          label: `${matriz.serie_rgd} ${matriz.rgn}${matriz.name ? ` - ${matriz.name}` : ""}`,
          value: getAnimalKeyFromReference(matriz),
        }))
        .filter((option) => option.value),
    [matrizes],
  );

  const { data: reproductionEvents = [], loading: eventsLoading } =
    useReproductionEvents(
      undefined,
      selectedMatriz ? getAnimalKeyFromReference(selectedMatriz) : undefined,
    );

  const handleEditEvent = (event: ReproductionEvent) => {
    setEventToEdit(event);
    setIsEditModalOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    const event = reproductionEvents.find((e) => e.event_id === eventId);
    if (event) {
      setEventToDelete(event);
      setIsDeleteModalOpen(true);
    }
  };

  return {
    data: {
      selectedMatriz,
      rgnOptions,
      reproductionEvents,
    },
    loading: { matrizesLoading, eventsLoading },
    error: null,
    actions: {
      selectedRgn,
      setSelectedRgn,
      clearSelection: () => setSelectedRgn(""),
      isCreateModalOpen,
      setIsCreateModalOpen,
      isEditModalOpen,
      eventToEdit,
      closeEdit: () => {
        setIsEditModalOpen(false);
        setEventToEdit(null);
      },
      isDeleteModalOpen,
      eventToDelete,
      closeDelete: () => {
        setIsDeleteModalOpen(false);
        setEventToDelete(null);
      },
      handleEditEvent,
      handleDeleteEvent,
    },
  };
}
