"use client";

import { useMemo, useState } from "react";
import { useMatrizes } from "@/hooks/matrizes/useMatrizes";
import { useReproductionEvents } from "@/hooks/db/reproduction_event/useReproductionEvents";
import { ReproductionEvent } from "@/types/reproduction_event.type";

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
    return matrizes.find((m) => m.rgn?.toLowerCase() === selectedRgn.toLowerCase()) || null;
  }, [selectedRgn, matrizes]);

  const rgnOptions = useMemo(
    () =>
      matrizes
        .map((matriz) => ({
          label: matriz.name ? `${matriz.rgn} - ${matriz.name}` : matriz.rgn || "",
          value: matriz.rgn || "",
        }))
        .filter((option) => option.value),
    [matrizes],
  );

  const { data: reproductionEvents = [], loading: eventsLoading } =
    useReproductionEvents(selectedMatriz?.rgn);

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
