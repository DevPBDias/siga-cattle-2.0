import { WeaningRecord } from "@/types/weaning_record.type";
import { cleanSupabaseDocument } from "@/lib/supabase/auth-helper";
import { createReplication } from "./base";

export const weaningRecordReplication = createReplication<WeaningRecord>({
  collectionName: "weaning_records",
  tableName: "weaning_records",
  replicationIdentifier: "weaning-records-replication-v1",
  mapToSupabase: (record) => ({
    id: record.id,
    animal_key: record.animal_key,
    animal_rgn: record.animal_rgn,
    mother_animal_key: record.mother_animal_key ?? null,
    mother_rgn: record.mother_rgn,
    farm_id: record.farm_id ?? null,
    born_date: record.born_date,
    weaning_date: record.weaning_date,
    age_days: record.age_days,
    birth_weight_kg: record.birth_weight_kg,
    calf_weight_kg: record.calf_weight_kg,
    mother_weight_kg: record.mother_weight_kg,
    adjusted_weight_210_kg: record.adjusted_weight_210_kg,
    efficiency_percent: record.efficiency_percent,
    visual_class: record.visual_class,
    created_at: record.created_at,
    updated_at: record.updated_at,
    _deleted: record._deleted,
  }),
  mapFromSupabase: (document) =>
    cleanSupabaseDocument(document) as unknown as WeaningRecord,
});

export async function replicateWeaningRecordsNew(
  db: Parameters<typeof weaningRecordReplication>[0],
  supabaseUrl: string,
  supabaseKey: string,
) {
  return weaningRecordReplication(db, supabaseUrl, supabaseKey);
}
