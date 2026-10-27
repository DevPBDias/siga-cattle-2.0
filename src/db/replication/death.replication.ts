import { createReplication } from "./base";
import { Death } from "@/types/death.type";
import { cleanSupabaseDocument } from "@/lib/supabase/auth-helper";
import { getSupabase } from "@/lib/supabase/client";

const DEATH_PHOTOS_BUCKET = "animal_deaths";

async function uploadDeathPhoto(
  dataUrl: string,
  deathId: string,
  index: number,
): Promise<string> {
  const supabase = getSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("É necessário estar autenticado para enviar fotos de mortes.");
  }

  const response = await fetch(dataUrl);
  const image = await response.blob();
  const path = `${user.id}/${deathId}/photo-${index + 1}.jpg`;
  const { data, error } = await supabase.storage
    .from(DEATH_PHOTOS_BUCKET)
    .upload(path, image, {
      cacheControl: "3600",
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) throw new Error(`Falha ao enviar foto da morte: ${error.message}`);

  return data.path;
}

/**
 * Replicação de Mortes usando o template padronizado.
 */
export const deathReplication = createReplication<Death>({
  collectionName: "deaths",
  tableName: "deaths",
  replicationIdentifier: "deaths-replication-v13",

  // Mapeia documento RxDB → Supabase
  mapToSupabase: (doc) => ({
    id: doc.id,
    animal_rgn: doc.animal_rgn,
    date: doc.date,
    reason: doc.reason,
    mother_name: doc.mother_name ?? '-',
    photos: doc.photo_paths ?? [],
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
    const cleaned = cleanSupabaseDocument(doc) as Record<string, unknown>;
    const photos = Array.isArray(cleaned.photos)
      ? cleaned.photos.filter((photo): photo is string => typeof photo === "string")
      : [];

    return {
      ...cleaned,
      photos,
      photo_paths: photos,
    } as unknown as Death;
  },

  preparePushDocument: async (death, mappedDocument) => {
    const syncedPhotos = death._deleted
      ? death.photo_paths ?? []
      : await Promise.all(
          (death.photos ?? []).map(async (photo, index) => {
            if (!photo.startsWith("data:")) return photo;
            const existingPath = death.photo_paths?.[index];
            return existingPath ?? uploadDeathPhoto(photo, death.id, index);
          }),
        );

    return {
      document: { ...mappedDocument, photos: syncedPhotos },
    };
  },

  mergePushResponse: (remoteDeath, localDeath) => ({
    ...remoteDeath,
    photos: localDeath.photos,
    photo_paths: remoteDeath.photo_paths ?? remoteDeath.photos,
  }),
});

/**
 * Função wrapper para compatibilidade.
 */
export async function replicateDeathsNew(
  db: Parameters<typeof deathReplication>[0],
  supabaseUrl: string,
  supabaseKey: string,
) {
  return deathReplication(db, supabaseUrl, supabaseKey);
}
