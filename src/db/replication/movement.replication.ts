import { createReplication } from "./base";
import { Movement } from "@/types/movement.type";
import { cleanSupabaseDocument } from "@/lib/supabase/auth-helper";

/**
 * Replicação de Movimentações usando o template padronizado.
 */
export const movementReplication = createReplication<Movement>({
  collectionName: "movements",
  tableName: "movements",
  replicationIdentifier: "movements-replication-v13",

  // Mapeia documento RxDB → Supabase
  mapToSupabase: (doc) => ({
    id: doc.id,
    type: doc.type,
    date: doc.date,
    event_date: doc.event_date ?? doc.date,
    animal_id: doc.animal_id,
    details_id: doc.details_id,
    created_by: doc.created_by ?? null,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    _deleted: doc._deleted,
  }),

  // Configurações
  pullBatchSize: 1000,
  pushBatchSize: 1000,
  retryTime: 5000,
  live: true,
  autoStart: false,

  mapFromSupabase: (doc) => {
    return cleanSupabaseDocument(doc) as unknown as Movement;
  },
});

/**
 * Função wrapper para compatibilidade.
 */
export async function replicateMovementsNew(
  db: Parameters<typeof movementReplication>[0],
  supabaseUrl: string,
  supabaseKey: string,
) {
  return movementReplication(db, supabaseUrl, supabaseKey);
}
