"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRxDB } from "./RxDBProvider";
import { combineLatest } from "rxjs";
import { setupReplication, stopReplication, forceSyncAll } from "../db/replication";
import { useAuthContext } from "./AuthProvider";
import { SyncLogger } from "@/lib/sync/syncLogger";
import { PendingQueue } from "@/lib/sync/pendingQueue";
import type { SyncLogEntry } from "@/lib/sync/syncLogger";
import { setupRealtimeSync } from "@/lib/sync/realtimeSync";

interface SyncStats {
  pending: number;
  syncing: number;
  error: number;
  total: number;
}

interface ReplicationContextType {
  isSyncing: boolean;
  initialSyncReady: boolean;
  lastSyncedAt: Date | null;
  online: boolean;
  replicationErrors: Error[];
  triggerSync: () => void;
  entityStatus: Record<string, { isSyncing: boolean; error: Error | null }>;
  /** Estatísticas da fila de documentos pendentes */
  syncStats: SyncStats;
  /** Exporta os logs de sincronização como JSON (para debug/suporte) */
  exportSyncLogs: () => string;
  /** Retorna os últimos erros de sincronização do SyncLogger */
  getRecentSyncErrors: () => SyncLogEntry[];
}

const defaultSyncStats: SyncStats = {
  pending: 0,
  syncing: 0,
  error: 0,
  total: 0,
};

const ReplicationContext = createContext<ReplicationContextType>({
  isSyncing: false,
  initialSyncReady: false,
  lastSyncedAt: null,
  online: true,
  replicationErrors: [],
  triggerSync: () => {},
  entityStatus: {},
  syncStats: defaultSyncStats,
  exportSyncLogs: () => "[]",
  getRecentSyncErrors: () => [],
});

export const useReplication = () => useContext(ReplicationContext);

export function ReplicationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { db, isLoading } = useRxDB();
  const { data: user, loading: authLoading } = useAuthContext();
  const [replicationsReady, setReplicationsReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialSyncReady, setInitialSyncReady] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [online, setOnline] = useState(true);
  const [replicationErrors, setReplicationErrors] = useState<Error[]>([]);
  const [entityStatus, setEntityStatus] = useState<
    Record<string, { isSyncing: boolean; error: Error | null }>
  >({});
  const [syncStats, setSyncStats] = useState<SyncStats>(defaultSyncStats);

  useEffect(() => {
    SyncLogger.info("provider", "ReplicationProvider initialized", {
      hasDb: !!db,
      isLoading,
      hasReplications: !!(db as any)?.replications,
    });
  }, [db, isLoading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Controla o ciclo de vida da replicação baseado na autenticação
  useEffect(() => {
    if (isLoading || authLoading || !db) return;

    let isMounted = true;

    setInitialSyncReady(!user);

    const handleSession = async (hasUser: boolean) => {
      if (!isMounted) return;

      if (hasUser) {
        setInitialSyncReady(false);
        if (!(db as any).replications) {
          try {
            SyncLogger.info(
              "provider",
              "Authenticated user detected, setting up replication...",
            );
            await setupReplication(db);
            if (isMounted) {
              setReplicationsReady(true);
              setInitialSyncReady(true);
            }
          } catch (err) {
            SyncLogger.error(
              "provider",
              "Failed to setup replication for authenticated user",
              err,
            );
          }
        } else {
          if (isMounted) setReplicationsReady(true);
        }
      } else {
        if ((db as any).replications) {
          SyncLogger.info(
            "provider",
            "No authenticated session, stopping replication...",
          );
          await stopReplication(db);
          if (isMounted) {
            setReplicationsReady(false);
            setInitialSyncReady(true);
            setEntityStatus({});
            setIsSyncing(false);
            setReplicationErrors([]);
          }
        } else {
          if (isMounted) setReplicationsReady(false);
          if (isMounted) setInitialSyncReady(true);
        }
      }
    };

    void handleSession(!!user);

    return () => {
      isMounted = false;
    };
  }, [authLoading, db, isLoading, user]);

  // Atualização periódica das stats do PendingQueue
  useEffect(() => {
    const interval = setInterval(() => {
      const stats = PendingQueue.getStats();
      setSyncStats(stats);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // BUG-04 FIX: Poll until db.replications is populated (it's set async after setupReplication)
  useEffect(() => {
    if (!isLoading && db && replicationsReady && (db as any).replications) {
      const replicationsMap = (db as any).replications;
      const replicationEntries = Object.entries(replicationsMap);

      SyncLogger.info(
        "provider",
        `Tracking ${replicationEntries.length} entities`,
        Object.keys(replicationsMap),
      );

      if (replicationEntries.length === 0) return;

      // Inicializa o estado com as entidades conhecidas
      setEntityStatus((prev) => {
        const next = { ...prev };
        replicationEntries.forEach(([name]) => {
          if (!next[name]) next[name] = { isSyncing: false, error: null };
        });
        return next;
      });

      const subscriptions: any[] = [];

      replicationEntries.forEach(([name, rep]: [string, any]) => {
        if (!rep) return;

        // Track activity (active$)
        subscriptions.push(
          rep.active$.subscribe((isActive: boolean) => {
            setEntityStatus((prev) => ({
              ...prev,
              [name]: { ...prev[name], isSyncing: isActive },
            }));
          }),
        );

        // Track errors (error$)
        subscriptions.push(
          rep.error$.subscribe((error: Error | null) => {
            if (error) {
              SyncLogger.error("provider", `Sync error for ${name}`, error);
            }
            setEntityStatus((prev) => ({
              ...prev,
              [name]: { ...prev[name], error },
            }));
          }),
        );

        // Pulls representam dados realmente recebidos do Supabase. O evento
        // permite que a Home atualize somente quando houve alteração remota.
        subscriptions.push(
          rep.received$.subscribe(() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("rico-ouro-remote-sync", {
                  detail: { tableName: name },
                }),
              );
            }
          }),
        );
      });

      // Global sync status logic
      const activeObservables = replicationEntries.map(
        ([_, rep]: [string, any]) => rep.active$,
      );
      const globalActiveSub = combineLatest(activeObservables).subscribe(
        (actives) => {
          const currentlySyncing = actives.some((a) => a === true);
          setIsSyncing(currentlySyncing);
          if (!currentlySyncing) setLastSyncedAt(new Date());
        },
      );

      const errorObservables = replicationEntries.map(
        ([_, rep]: [string, any]) => rep.error$,
      );
      const globalErrorSub = combineLatest(errorObservables).subscribe(
        (errors) => {
          const activeErrors = errors.filter((err) => err !== null) as Error[];
          setReplicationErrors(activeErrors);
        },
      );

      subscriptions.push(globalActiveSub, globalErrorSub);

      return () => {
        subscriptions.forEach((sub) => sub.unsubscribe());
      };
    }
  }, [isLoading, db, replicationsReady]);

  const triggerSync = useCallback(() => {
    if (!db || !(db as any).replications) {
      SyncLogger.warn(
        "provider",
        "Cannot trigger sync: replication not active or user not logged in",
      );
      return;
    }
    SyncLogger.info("provider", "Manual sync triggered by user");
    forceSyncAll(db as any);
  }, [db]);

  const exportSyncLogs = useCallback(() => {
    return SyncLogger.export();
  }, []);

  const getRecentSyncErrors = useCallback(() => {
    return SyncLogger.getErrors();
  }, []);

  return (
    <ReplicationContext.Provider
      value={{
        isSyncing,
        initialSyncReady,
        lastSyncedAt,
        online,
        replicationErrors,
        triggerSync,
        entityStatus,
        syncStats,
        exportSyncLogs,
        getRecentSyncErrors,
      }}
    >
      {children}
    </ReplicationContext.Provider>
  );
}
