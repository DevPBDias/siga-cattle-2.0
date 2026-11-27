import { createReplication } from "./base";
import { AnimalPartnership } from "@/types/partnership.type";
import { cleanSupabaseDocument } from "@/lib/supabase/auth-helper";

export const animalPartnershipReplication = createReplication<AnimalPartnership>({
  collectionName: "animal_partnerships",
  tableName: "animal_partnerships",
  replicationIdentifier: "animal-partnerships-replication-v1",

  mapToSupabase: (doc) => ({
    id: doc.id,
    partner_name: doc.partner_name,
    updated_at: doc.updated_at,
    _deleted: doc._deleted,
  }),

  mapFromSupabase: (doc) => {
    return cleanSupabaseDocument(doc) as unknown as AnimalPartnership;
  },
});

/**
 * Função wrapper para compatibilidade.
 */
export async function replicateAnimalPartnershipsNew(
  db: Parameters<typeof animalPartnershipReplication>[0],
  supabaseUrl: string,
  supabaseKey: string,
) {
  return animalPartnershipReplication(db, supabaseUrl, supabaseKey);
}
