"use client";

import { useState, useEffect } from "react";
import { useSyncStatus } from "@/hooks/sync/useSyncStatus";
import { toast } from "sonner";
import {
  RefreshCw,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Cloud,
} from "lucide-react";

export function SyncStatusIndicator() {
  const [isMounted, setIsMounted] = useState(false);
  const {
    status,
    online,
    isSyncing,
    triggerSync,
    lastSyncedAt,
  } = useSyncStatus();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleClick = () => {
    if (!online) {
      toast.info("Modo Offline: o aplicativo está salvando tudo no aparelho e sincronizará quando tiver internet.", {
        duration: 4000,
      });
      return;
    }

    if (isSyncing) {
      toast.info("Sincronização em andamento com a nuvem...", {
        duration: 2500,
      });
      return;
    }

    if (status === "error") {
      toast.loading("Tentando reconectar e sincronizar dados...", {
        duration: 2500,
      });
      triggerSync();
      return;
    }

    const timeStr = lastSyncedAt
      ? lastSyncedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : null;

    toast.success(
      timeStr
        ? `Sincronizado com a nuvem (última às ${timeStr}). Forçando atualização...`
        : "Atualizando dados com a nuvem...",
      { duration: 2500 },
    );
    triggerSync();
  };

  const getStatusIcon = () => {
    switch (status) {
      case "synced":
        return <CheckCircle size={14} className="text-emerald-400" />;
      case "syncing":
        return <RefreshCw size={14} className="text-blue-400 animate-spin" />;
      case "offline":
        return <WifiOff size={14} className="text-amber-400" />;
      case "error":
        return <AlertCircle size={14} className="text-rose-500" />;
      default:
        return <Cloud size={14} className="text-slate-400" />;
    }
  };

  const getStatusText = () => {
    if (!online) return "Offline";
    if (isSyncing) return "Sincronizando";
    if (status === "error") return "Erro (Tentar)";
    return "Sincronizado";
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleClick}
        title="Toque para verificar/forçar sincronização"
        className="flex items-center gap-1.5 text-white border border-white/80 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-md px-2.5 py-1.5 text-xs font-bold max-w-full cursor-pointer shadow-xs"
      >
        <span className="w-4 h-4 flex items-center justify-center">
          {getStatusIcon()}
        </span>

        <span className="whitespace-nowrap text-[11px] tracking-tight">
          {getStatusText()}
        </span>
      </button>
    </div>
  );
}
