"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useClientById } from "@/hooks/db/clients/useClientById";
import { useClients } from "@/hooks/db/clients/useClients";
import { Client } from "@/types/client.type";

export function useClientWorkspace() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { data: client, loading: isClientLoading } = useClientById(selectedClientId || "");
  const {
    actions: { updateClient, deleteClient },
    loading: isMutationLoading,
  } = useClients();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);

  const handleUpdate = async (data: Partial<Client>) => {
    if (!selectedClientId) return;
    try {
      await updateClient(selectedClientId, data);
      setIsEditing(false);
      setShowEditSuccess(true);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente.");
    }
  };

  const handleDelete = async () => {
    if (!selectedClientId) return;
    try {
      await deleteClient(selectedClientId);
      setSelectedClientId(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente.");
    }
  };

  const headerTitle = isEditing
    ? "Editar Cliente"
    : selectedClientId
      ? "Detalhes do Cliente"
      : "Clientes";

  return {
    data: { client, headerTitle },
    loading: { isClientLoading, isMutationLoading },
    error: null,
    actions: {
      selectedClientId,
      setSelectedClientId,
      isEditing,
      setIsEditing,
      showDeleteConfirm,
      setShowDeleteConfirm,
      showEditSuccess,
      setShowEditSuccess,
      handleUpdate,
      handleDelete,
      handleBack: () => {
        if (isEditing) setIsEditing(false);
        else setSelectedClientId(null);
      },
    },
  };
}
