"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useClients } from "@/hooks/db/clients/useClients";
import { Client } from "@/types/client.type";

export function useNovoCliente() {
  const { actions: { createClient }, loading } = useClients();
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (data: Partial<Client>) => {
    try {
      await createClient({
        id: uuidv4(),
        ...data,
      });
      setShowSuccess(true);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      toast.error("Erro ao cadastrar cliente.");
    }
  };

  return {
    data: { showSuccess },
    loading,
    error: null,
    actions: {
      handleSubmit,
      handleCloseSuccess: () => router.push("/gerenciar/clientes"),
    },
  };
}
