import {
  replicateRxCollection,
  RxReplicationState,
} from "rxdb/plugins/replication";
import { MyDatabase } from "../../collections";
import {
  ReplicationConfig,
  ReplicableEntity,
  ReplicationCheckpoint,
} from "./types";
import {
  getAuthHeaders,
  cleanSupabaseDocuments,
  cleanSupabaseDocument,
} from "@/lib/supabase/auth-helper";
import { SyncLogger } from "@/lib/sync/syncLogger";
import { PendingQueue } from "@/lib/sync/pendingQueue";
import { toast } from "sonner";

export function createReplication<T extends ReplicableEntity>(
  config: ReplicationConfig<T>,
) {
  const {
    collectionName,
    tableName,
    replicationIdentifier = `${String(collectionName)}-replication-v13`,
    pullBatchSize = 1000,
    pushBatchSize = 1000,
    mapToSupabase,
    mapFromSupabase,
    retryTime = 5000,
    live = true,
    autoStart = false,
  } = config;

  const colName = String(collectionName);

  return async (
    db: MyDatabase,
    supabaseUrl: string,
    _supabaseKey: string,
  ): Promise<RxReplicationState<T, ReplicationCheckpoint>> => {
    const collection = db[collectionName];

    SyncLogger.info(colName, "Creating replication", {
      tableName,
      replicationIdentifier,
      pullBatchSize,
      pushBatchSize,
      live,
      autoStart,
    });

    const replication = replicateRxCollection<T, ReplicationCheckpoint>({
      collection: collection as any,
      replicationIdentifier,

      // ==================== PULL (Supabase → RxDB) ====================
      pull: {
        async handler(checkpoint, batchSize) {
          const lastModified = checkpoint?.updated_at || 0;
          const lastId = checkpoint?.last_id || null;
          const effectiveBatchSize = batchSize || pullBatchSize;

          SyncLogger.info(colName, "Pulling from Supabase...", {
            lastModified,
            lastId,
            batchSize: effectiveBatchSize,
          });

          const headers = await getAuthHeaders();

          if (!headers.Authorization) {
            SyncLogger.error(
              colName,
              "No auth token available. Skipping pull.",
            );
            throw new Error("Authentication required for sync");
          }

          const primaryKey =
            (collection as any).schema.jsonSchema.primaryKey || "id";

          // CORREÇÃO: Conversão segura de timestamp do checkpoint.
          let lastModifiedNum: number;
          if (typeof lastModified === "number") {
            lastModifiedNum = lastModified;
          } else {
            const parsed = Date.parse(String(lastModified));
            lastModifiedNum = isNaN(parsed) ? 0 : parsed;
          }

          // Usar a Nova API Sync do Next.js
          const params = new URLSearchParams({
            table: tableName,
            lastModified: String(lastModifiedNum),
            primaryKey,
            limit: String(effectiveBatchSize),
          });

          if (lastId) params.append("lastId", String(lastId));

          const url = `/api/sync?${params.toString()}`;

          SyncLogger.info(colName, "Pulling from Sync API...", { url });

          const response = await fetch(url, { headers });

          if (!response.ok) {
            const errorText = await response.text();
            SyncLogger.error(
              colName,
              `Pull failed: ${response.status}`,
              errorText,
            );

            // Notification so user knows why sync is failing instead of silent death
            if (response.status !== 401 && response.status !== 403) {
              toast.error(
                `Falha ao sincronizar: ${colName}. Tentaremos novamente em breve.`,
              );
            }

            throw new Error(`Pull failed: ${response.status}`);
          }

          const rawDocuments: Record<string, any>[] = await response.json();
          const data = Array.isArray(rawDocuments) ? rawDocuments : [];

          // Processar documentos para o RxDB
          const processedDocuments = data.map((doc) => {
            let processed: T;
            if (mapFromSupabase) {
              processed = mapFromSupabase(doc);
            } else {
              processed = cleanSupabaseDocuments([doc])[0] as T;
            }

            // SEGURANÇA: RxDB exige _deleted, created_at e updated_at.
            // Se vierem nulos do Supabase, garantimos valores válidos para evitar erro de schema.
            return {
              ...processed,
              _deleted: !!processed._deleted, // Força boolean
              created_at: processed.created_at || Date.now(),
              updated_at: processed.updated_at || Date.now(),
            } as T;
          });

          SyncLogger.info(
            colName,
            `Received ${processedDocuments.length} documents`,
          );

          // Checkpoint usa o updated_at numérico (bigint) do último documento RAW.
          // Supabase retorna bigint como number no JSON, então não há perda de precisão.
          const lastRawDoc = data.length > 0 ? data[data.length - 1] : null;
          const newCheckpoint: ReplicationCheckpoint = {
            updated_at: lastRawDoc
              ? Number(lastRawDoc.updated_at)
              : lastModifiedNum,
            last_id: lastRawDoc ? String(lastRawDoc[primaryKey]) : lastId,
          };

          if (data.length > 0) {
            SyncLogger.info(colName, "Checkpoint advanced", {
              updated_at: newCheckpoint.updated_at,
              last_id: newCheckpoint.last_id,
              docsInBatch: data.length,
              hasMore: data.length >= effectiveBatchSize,
            });
          }

          return {
            documents: processedDocuments,
            checkpoint: newCheckpoint,
          };
        },
        batchSize: pullBatchSize,
      },

      // ==================== PUSH (RxDB → Supabase) ====================
      push: {
        async handler(rows) {
          SyncLogger.info(colName, `PUSH triggered with ${rows.length} rows`);

          const primaryKey =
            (collection as any).schema.jsonSchema.primaryKey || "id";

          // Marcar docs como syncing no PendingQueue
          rows.forEach((row) => {
            const docId = String((row.newDocumentState as any)[primaryKey]);
            PendingQueue.add(colName, docId);
            PendingQueue.markSyncing(colName, docId);
          });

          const preparedRows = await Promise.all(rows.map(async (row) => {
            const doc = row.newDocumentState as T;

            // Garantir que updated_at existe
            if (!doc.updated_at) {
              SyncLogger.warn(
                colName,
                "Document missing updated_at, adding now",
              );
              (doc as any).updated_at = Date.now();
            }

            let mapped = mapToSupabase
              ? mapToSupabase(doc)
              : { ...(doc as Record<string, any>) };

            if (config.preparePushDocument) {
              const prepared = await config.preparePushDocument(doc, mapped);
              mapped = prepared.document;
            }

            // CORREÇÃO: Supabase usa bigint para timestamps.
            // NÃO converter para ISO string — manter como número.
            // Garantir que são números válidos.
            if (mapped.updated_at !== undefined && mapped.updated_at !== null) {
              mapped.updated_at = Number(mapped.updated_at);
            }
            if (mapped.created_at !== undefined && mapped.created_at !== null) {
              mapped.created_at = Number(mapped.created_at);
            }

            return { document: mapped, localDocument: doc };
          }));
          const documents = preparedRows.map(({ document }) => document);

          const headers = await getAuthHeaders();

          if (!headers.Authorization) {
            SyncLogger.error(
              colName,
              "No auth token for push. Session may have expired.",
            );

            rows.forEach((row) => {
              const docId = String((row.newDocumentState as any)[primaryKey]);
              PendingQueue.markError(colName, docId, "No auth token");
            });

            throw new Error("Authentication required for sync");
          }

          SyncLogger.info(
            colName,
            `Pushing ${documents.length} docs to Sync API...`,
          );

          const response = await fetch("/api/sync", {
            method: "POST",
            headers: {
              ...headers,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              table: tableName,
              documents,
              primaryKey,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();

            rows.forEach((row) => {
              const docId = String((row.newDocumentState as any)[primaryKey]);
              PendingQueue.markError(
                colName,
                docId,
                `Push failed: ${response.status}`,
              );
            });

            SyncLogger.error(
              colName,
              `Push failed: ${response.status}`,
              errorText,
            );
            throw new Error(`Push failed: ${response.status} - ${errorText}`);
          }

          const responseData = await response.json();
          const updatedDocs = Array.isArray(responseData) ? responseData : [];

          // Marcar todos como synced
          rows.forEach((row) => {
            const docId = String((row.newDocumentState as any)[primaryKey]);
            PendingQueue.markSynced(colName, docId);
          });

          SyncLogger.info(
            colName,
            `Push successful: ${updatedDocs.length} docs synced ✅`,
          );

          if (updatedDocs.length > 0) {
            const localDocuments = new Map(
              preparedRows.map(({ localDocument }) => [
                String((localDocument as any)[primaryKey]),
                localDocument,
              ]),
            );
            const mappedResults = updatedDocs.map((doc) => {
              if (mapFromSupabase) return mapFromSupabase(doc);
              const cleaned = cleanSupabaseDocument(doc);
              return {
                ...cleaned,
                _deleted: cleaned._deleted ?? false,
              } as T;
            });
            return mappedResults.map((remoteDocument) => {
              const localDocument = localDocuments.get(
                String((remoteDocument as any)[primaryKey]),
              );
              return localDocument && config.mergePushResponse
                ? config.mergePushResponse(remoteDocument, localDocument)
                : remoteDocument;
            });
          }

          return [];
        },
        batchSize: pushBatchSize,
      },

      live,
      retryTime,
      autoStart,
    });

    return replication;
  };
}
