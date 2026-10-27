"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { MyDatabase } from "@/db/collections";
import {
  getDatabase,
  isDatabaseReady as checkDbReady,
  clearAllDatabases,
} from "@/db/client";

interface RxDBContextType {
  db: MyDatabase | null;
  isLoading: boolean;
  error: Error | null;
  isReady: boolean;
  retryConnection: () => void;
  resetDatabase: () => Promise<void>;
}

const RxDBContext = createContext<RxDBContextType>({
  db: null,
  isLoading: true,
  error: null,
  isReady: false,
  retryConnection: () => {},
  resetDatabase: async () => {},
});

export const useRxDB = () => {
  const context = useContext(RxDBContext);
  if (!context) {
    throw new Error("useRxDB must be used within RxDBProvider");
  }
  return context;
};

export const useRxDatabase = () => {
  const { db } = useRxDB();
  return db;
};

export const useRxDBContext = useRxDB;

export function RxDBProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<MyDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);

  const initDatabase = useCallback(
    async (force = false) => {
      if (typeof window === "undefined" || (db && !force)) return;

      setIsLoading(true);
      setError(null);

      try {
        const database = await getDatabase();
        if (!database) {
          setIsLoading(false);
          return;
        }

        setDb(database);
        setIsReady(true);
        setIsLoading(false);

        window.dispatchEvent(
          new CustomEvent("rxdb-ready", { detail: { database } }),
        );

        console.log("[RxDB] Database ready for offline operations");
      } catch (err) {
        console.error("[RxDB] Failed to initialize database:", err);
        setError(err as Error);
        setIsLoading(false);
        setIsReady(false);
      }
    },
    [db],
  );

  const retryConnection = useCallback(() => {
    console.log("[RxDB] Retrying database connection...");
    initDatabase(true);
  }, [initDatabase]);

  const resetDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      await clearAllDatabases();
      console.log("[RxDB] Database cleared, reloading page...");
      window.location.reload();
    } catch (err) {
      console.error("[RxDB] Failed to reset database:", err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) return;
      await initDatabase();
    };

    init();

    return () => {
      mounted = false;
    };
  }, [initDatabase]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCleared = () => {
      setDb(null);
      setIsReady(false);
      setIsLoading(false);
    };

    const handleOnline = () => {
      if (db && !error) {
        console.log("[RxDB] Back online, database ready for sync");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("rxdb-cleared", handleCleared);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("rxdb-cleared", handleCleared);
    };
  }, [db, error]);

  return (
    <RxDBContext.Provider
      value={{ db, isLoading, error, isReady, retryConnection, resetDatabase }}
    >
      {children}
    </RxDBContext.Provider>
  );
}

export function useWaitForDatabase() {
  const { db, isLoading, error, isReady } = useRxDB();

  return {
    db,
    isLoading,
    error,
    isReady,
    query: async <T,>(
      queryFn: (db: MyDatabase) => Promise<T>,
    ): Promise<T | null> => {
      if (!db || !isReady) {
        console.warn("[RxDB] Database not ready for query");
        return null;
      }
      try {
        return await queryFn(db);
      } catch (err) {
        console.error("[RxDB] Query failed:", err);
        return null;
      }
    },
  };
}
