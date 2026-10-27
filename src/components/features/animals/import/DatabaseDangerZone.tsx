"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResetLocalDatabase } from "@/hooks/db/useResetLocalDatabase";

export function DatabaseDangerZone() {
  const { data, loading, actions } = useResetLocalDatabase();

  return (
    <div className="p-4 mt-8 border-t border-border mx-4">
      <h3 className="text-destructive font-bold mb-4 text-center uppercase text-sm">
        Zona de Perigo
      </h3>
      <Button
        variant="destructive"
        className="w-full flex items-center gap-2"
        onClick={actions.resetLocalDatabase}
        disabled={loading || !data.ready}
      >
        {loading ? <RefreshCw className="animate-spin" /> : <Trash2 />}
        {loading ? "Limpando..." : "Apagar Banco de Dados Local"}
      </Button>
    </div>
  );
}
