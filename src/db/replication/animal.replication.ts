import { createReplication } from "./base";
import { Animal } from "@/types/animal.type";
import { cleanSupabaseDocument } from "@/lib/supabase/auth-helper";

/**
 * Interface estendida de Animal que garante campos de replicação.
 *
 * Animal já tem _deleted e updated_at definidos no tipo original,
 * mas precisamos garantir que são obrigatórios para a replicação.
 */
interface ReplicableAnimal extends Omit<Animal, "_deleted" | "updated_at"> {
  updated_at: number;
  _deleted: boolean;
}

/**
 * Replicação de Animais usando o template padronizado.
 *
 * Esta entidade usa:
 * - Primary Key: rgn (não UUID - exceção histórica)
 * - Todos os campos são mapeados explicitamente para o Supabase
 */
export const animalReplication = createReplication<ReplicableAnimal>({
  collectionName: "animals",
  tableName: "animals",
  replicationIdentifier: "animals-replication-v14",

  // Mapeia documento RxDB → Supabase
  mapToSupabase: (doc) => ({
    rgn: doc.rgn,
    name: doc.name ?? null,
    sex: doc.sex ?? null,
    is_natural_bull: doc.is_natural_bull ?? false,
    born_date: doc.born_date ?? null,
    serie_rgd: doc.serie_rgd,
    breed: doc.breed ?? "Nelore",
    born_color: doc.born_color ?? null,
    iabcgz: doc.iabcgz ?? null,
    deca: doc.deca ?? null,
    p: doc.p ?? null,
    f: doc.f ?? null,
    status: doc.status ?? null,
    document_situation: doc.document_situation ?? null,
    animal_state: doc.animal_state ?? "ATIVO",
    defects: doc.defects ?? [],
    farm_id: doc.farm_id ?? null,
    type: doc.type ?? null,
    genotyping: doc.genotyping ?? null,
    condition: doc.condition ?? null,
    classification: doc.classification ?? null,
    parturition_from: doc.parturition_from ?? null,
    father_name: doc.father_name ?? null,
    mother_serie_rgd: doc.mother_serie_rgd ?? null,
    mother_rgn: doc.mother_rgn ?? null,
    maternal_grandfather_name: doc.maternal_grandfather_name ?? null,
    paternal_grandfather_name: doc.paternal_grandfather_name ?? null,
    partnership: doc.partnership ?? null,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    _deleted: !!doc._deleted,
  }),

  // Configurações
  pullBatchSize: 1000,
  pushBatchSize: 1000,
  retryTime: 5000,
  live: true,
  autoStart: false,

  mapFromSupabase: (doc) => {
    const cleaned = cleanSupabaseDocument(doc);
    delete cleaned.id; // Remove Supabase-specific ID
    return {
      ...cleaned,
      _deleted: !!cleaned._deleted,
      updated_at: Number(cleaned.updated_at) || Date.now(),
      created_at: Number(cleaned.created_at) || Date.now(),
    } as unknown as ReplicableAnimal;
  },
});

/**
 * Função wrapper para compatibilidade com o sistema atual.
 */
export async function replicateAnimalsNew(
  db: Parameters<typeof animalReplication>[0],
  supabaseUrl: string,
  supabaseKey: string
) {
  return animalReplication(db, supabaseUrl, supabaseKey);
}
