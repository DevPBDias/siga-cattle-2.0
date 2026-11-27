import { AnimalMetric } from "@/types/animal_metrics.type";
import { cleanSupabaseDocument } from "@/lib/supabase/auth-helper";
import { createReplication } from "./base";

/** One local collection replicates weight and CE rows to their existing tables. */
export const animalMetricReplication = createReplication<AnimalMetric>({
  collectionName: "animal_metrics_weight",
  tableName: "animal_metrics",
  replicationIdentifier: "animal-metrics-unified-replication-v1",
  mapToSupabase: (doc) => ({
    id: doc.id,
    metric_type: doc.metric_type ?? "weight",
    animal_key: doc.animal_key ?? null,
    rgn: doc.rgn,
    born_metric: doc.born_metric ?? false,
    date: doc.date,
    value: doc.value,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    _deleted: doc._deleted,
  }),
  mapFromSupabase: (doc) => ({
    ...cleanSupabaseDocument(doc),
    metric_type: doc.metric_type === "ce" ? "ce" : "weight",
  }) as unknown as AnimalMetric,
});

export async function replicateAnimalMetricsNew(
  db: Parameters<typeof animalMetricReplication>[0],
  supabaseUrl: string,
  supabaseKey: string,
) {
  return animalMetricReplication(db, supabaseUrl, supabaseKey);
}
