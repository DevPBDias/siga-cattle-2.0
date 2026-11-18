import { createReplication } from "./base";
import { AnimalMetric } from "@/types/animal_metrics.type";
import { cleanSupabaseDocument } from "@/lib/supabase/auth-helper";

/**
 * Replicação de Pesagens de Animais usando o template padronizado.
 */
export const animalMetricWeightReplication = createReplication<AnimalMetric>({
  collectionName: "animal_metrics_weight",
  tableName: "animal_metrics_weight",
  replicationIdentifier: "animal-metrics-weight-replication-v13",
  mapToSupabase: (doc) => ({
    id: doc.id,
    animal_key: doc.animal_key ?? null,
    rgn: doc.rgn,
    born_metric: doc.born_metric ?? false,
    date: doc.date,
    value: doc.value,
    updated_at: doc.updated_at,
    _deleted: doc._deleted,
  }),

  mapFromSupabase: (doc) => {
    return cleanSupabaseDocument(doc) as unknown as AnimalMetric;
  },
});

/**
 * Função wrapper para compatibilidade.
 */
export async function replicateAnimalMetricWeightNew(
  db: Parameters<typeof animalMetricWeightReplication>[0],
  supabaseUrl: string,
  supabaseKey: string,
) {
  return animalMetricWeightReplication(db, supabaseUrl, supabaseKey);
}

/**
 * Replicação de Circunferência Escrotal (CE) usando o template padronizado.
 */
export const animalMetricCEReplication = createReplication<AnimalMetric>({
  collectionName: "animal_metrics_ce",
  tableName: "animal_metrics_ce",
  replicationIdentifier: "animal-metrics-ce-replication-v13",
  mapToSupabase: (doc) => ({
    id: doc.id,
    animal_key: doc.animal_key ?? null,
    rgn: doc.rgn,
    born_metric: doc.born_metric ?? false,
    date: doc.date,
    value: doc.value,
    updated_at: doc.updated_at,
    _deleted: doc._deleted,
  }),

  mapFromSupabase: (doc) => {
    return cleanSupabaseDocument(doc) as unknown as AnimalMetric;
  },
});

/**
 * Função wrapper para compatibilidade.
 */
export async function replicateAnimalMetricCENew(
  db: Parameters<typeof animalMetricCEReplication>[0],
  supabaseUrl: string,
  supabaseKey: string
) {
  return animalMetricCEReplication(db, supabaseUrl, supabaseKey);
}
