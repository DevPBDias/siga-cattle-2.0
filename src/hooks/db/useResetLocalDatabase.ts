"use client";

import { useState } from "react";
import { toast } from "sonner";
import { clearAllDatabases } from "@/db/client";
import { useRxDatabase } from "@/providers/RxDBProvider";

export function useResetLocalDatabase() {
  const db = useRxDatabase();
  const [isCleaning, setIsCleaning] = useState(false);

  const resetLocalDatabase = async () => {
    setIsCleaning(true);
    try {
      await clearAllDatabases();
      window.location.reload();
    } catch (error) {
      console.error("Erro ao resetar banco:", error);
      toast.error("Erro ao resetar banco. Tente limpar os dados do navegador manualmente.");
      setIsCleaning(false);
    }
  };

  return {
    data: { ready: Boolean(db) },
    loading: isCleaning,
    error: null,
    actions: { resetLocalDatabase },
  };
}
