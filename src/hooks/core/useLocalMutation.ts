"use client";

import { useRxDatabase } from "@/providers";
import { useState, useCallback } from "react";
import type { RxCollection } from "rxdb";

export function useLocalMutation<
  T extends { updated_at: number; _deleted: boolean; created_at: number }
>(collectionName: string) {
  const db = useRxDatabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (data: Partial<T>): Promise<T> => {
      if (!db) throw new Error("Database not initialized");

      setLoading(true);
      setError(null);

      try {
        const collection = (db as any)[collectionName] as RxCollection<T>;
        if (!collection) {
          throw new Error(`Collection ${collectionName} not found`);
        }

        const documentData = {
          ...data,
          _deleted: false,
          updated_at: Date.now(),
          created_at: (data as any).created_at || Date.now(),
        };

        const doc = await collection.insert(documentData as unknown as T);

        setLoading(false);
        return doc.toJSON() as T;
      } catch (err) {
        console.error(
          `❌ [useLocalMutation] CREATE ERROR in ${collectionName}:`,
          err,
        );
        const errorObj =
          err instanceof Error ? err : new Error("Failed to create document");
        setError(errorObj);
        setLoading(false);
        throw errorObj;
      }
    },
    [db, collectionName],
  );

  const upsert = useCallback(
    async (data: Partial<T>): Promise<T> => {
      if (!db) throw new Error("Database not initialized");

      setLoading(true);
      setError(null);

      try {
        const collection = (db as any)[collectionName] as RxCollection<T>;
        if (!collection) {
          throw new Error(`Collection ${collectionName} not found`);
        }

        const documentData = {
          ...data,
          _deleted: false,
          updated_at: Date.now(),
          created_at: (data as any).created_at || Date.now(),
        };

        const doc = await collection.upsert(documentData as unknown as T);

        setLoading(false);
        return doc.toJSON() as T;
      } catch (err) {
        const errorObj =
          err instanceof Error ? err : new Error("Failed to upsert document");
        setError(errorObj);
        setLoading(false);
        throw errorObj;
      }
    },
    [db, collectionName],
  );

  const update = useCallback(
    async (id: string, data: Partial<T>): Promise<void> => {
      if (!db) throw new Error("Database not initialized");

      setLoading(true);
      setError(null);

      try {
        const collection = (db as any)[collectionName] as RxCollection<T>;
        if (!collection) {
          throw new Error(`Collection ${collectionName} not found`);
        }

        const doc = await collection.findOne(id).exec();
        if (!doc) {
          throw new Error(`Document ${id} not found in ${collectionName}`);
        }

        const updateData = {
          ...data,
          updated_at: Date.now(),
        };

        await doc.patch(updateData);

        setLoading(false);
      } catch (err) {
        const errorObj =
          err instanceof Error ? err : new Error("Failed to update document");
        setError(errorObj);
        setLoading(false);
        throw errorObj;
      }
    },
    [db, collectionName],
  );

  /**
   * Deletar um documento (soft delete)
   * A replicação automática irá sincronizar com Supabase
   */
  const remove = useCallback(
    async (
      id: string,
      options: { ignoreMissing?: boolean } = {},
    ): Promise<void> => {
      if (!db) throw new Error("Database not initialized");

      setLoading(true);
      setError(null);

      try {
        const collection = (db as any)[collectionName] as RxCollection<T>;
        if (!collection) {
          throw new Error(`Collection ${collectionName} not found`);
        }

        const doc = await collection.findOne(id).exec();
        if (!doc) {
          if (options.ignoreMissing) {
            setLoading(false);
            return;
          }
          throw new Error(`Document ${id} not found in ${collectionName}`);
        }

        await doc.patch({
          _deleted: true,
          updated_at: Date.now(),
        } as any);

        setLoading(false);
      } catch (err) {
        const errorObj =
          err instanceof Error ? err : new Error("Failed to remove document");
        setError(errorObj);
        setLoading(false);
        throw errorObj;
      }
    },
    [db, collectionName],
  );

  /**
   * Inserir múltiplos documentos de uma vez
   * A replicação automática irá sincronizar com Supabase
   */
  const bulkInsert = useCallback(
    async (documents: Partial<T>[]): Promise<void> => {
      if (!db) throw new Error("Database not initialized");

      setLoading(true);
      setError(null);

      try {
        const collection = (db as any)[collectionName] as RxCollection<T>;
        if (!collection) {
          throw new Error(`Collection ${collectionName} not found`);
        }

        const documentsWithMeta = documents.map((doc) => ({
          ...doc,
          _deleted: false,
          updated_at: Date.now(),
          created_at: (doc as any).created_at || Date.now(),
        }));

        await collection.bulkInsert(documentsWithMeta as unknown as T[]);

        setLoading(false);
      } catch (err) {
        const errorObj =
          err instanceof Error
            ? err
            : new Error("Failed to bulk insert documents");
        setError(errorObj);
        setLoading(false);
        throw errorObj;
      }
    },
    [db, collectionName],
  );

  /**
   * Deletar múltiplos documentos de uma vez
   * A replicação automática irá sincronizar com Supabase
   */
  const bulkRemove = useCallback(
    async (ids: string[]): Promise<void> => {
      if (!db) throw new Error("Database not initialized");

      setLoading(true);
      setError(null);

      try {
        const collection = (db as any)[collectionName] as RxCollection<T>;
        if (!collection) {
          throw new Error(`Collection ${collectionName} not found`);
        }

        const primaryKey =
          (collection as any).schema.jsonSchema.primaryKey || "id";
        const query = collection.find({
          selector: {
            [primaryKey]: { $in: ids },
          } as any,
        });
        const docs = await query.exec();
        await Promise.all(
          docs.map((doc: any) =>
            doc.patch({
              _deleted: true,
              updated_at: Date.now(),
            } as any),
          ),
        );

        setLoading(false);
      } catch (err) {
        const errorObj =
          err instanceof Error
            ? err
            : new Error("Failed to bulk remove documents");
        setError(errorObj);
        setLoading(false);
        throw errorObj;
      }
    },
    [db, collectionName],
  );

  /**
   * Reset error state
   */
  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    actions: {
      create,
      upsert,
      update,
      remove,
      bulkInsert,
      bulkRemove,
      reset,
    },
  };
}
