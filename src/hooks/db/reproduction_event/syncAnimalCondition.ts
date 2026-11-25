import type { MyDatabase } from "@/db/collections";
import type { ReproductionEvent } from "@/types/reproduction_event.type";

function normalizeCondition(
  status?: string | null,
): "Parida" | "Solteira" | null {
  if (!status) return null;
  const lower = status.trim().toLowerCase();
  if (lower === "parida") return "Parida";
  if (lower === "solteira") return "Solteira";
  return null;
}

/**
 * Sincroniza `animal.condition` a partir do `productive_status` do evento de reprodução,
 * garantindo que eventos antigos editados não sobrescrevam o status de eventos mais recentes.
 */
export async function syncAnimalConditionFromEvent(
  db: MyDatabase | null | undefined,
  params: {
    eventId?: string;
    animalKey?: string;
    rgn?: string;
    productiveStatus?: string | null;
  },
): Promise<void> {
  if (!db) return;
  const nextCondition = normalizeCondition(params.productiveStatus);
  if (!nextCondition) return;

  let animalKey = params.animalKey;
  let rgn = params.rgn;

  if (params.eventId && (!animalKey || !rgn)) {
    const existingEvent = await db.reproduction_events
      .findOne(params.eventId)
      .exec();
    if (existingEvent) {
      const eventData = existingEvent.toJSON() as ReproductionEvent;
      animalKey = animalKey || eventData.animal_key;
      rgn = rgn || eventData.rgn;
    }
  }

  if (params.eventId && (animalKey || rgn)) {
    const selector = animalKey
      ? { animal_key: animalKey, _deleted: false }
      : { rgn: rgn!, _deleted: false };
    const eventDocs = await db.reproduction_events.find({ selector }).exec();
    if (eventDocs.length > 1) {
      const sorted = eventDocs
        .map((doc) => doc.toJSON() as ReproductionEvent)
        .sort((a, b) => {
          const dateDiff = (b.d0_date || "").localeCompare(a.d0_date || "");
          if (dateDiff !== 0) return dateDiff;
          return (b.created_at || 0) - (a.created_at || 0);
        });
      if (sorted[0]?.event_id !== params.eventId) {
        return;
      }
    }
  }

  let animalDoc = animalKey ? await db.animals.findOne(animalKey).exec() : null;
  if (!animalDoc && rgn) {
    const matches = await db.animals
      .find({ selector: { rgn, _deleted: false } })
      .exec();
    if (matches.length === 1) {
      animalDoc = matches[0];
    }
  }

  if (!animalDoc) return;

  if (animalDoc.toJSON().condition !== nextCondition) {
    await animalDoc.patch({
      condition: nextCondition,
      updated_at: Date.now(),
    });
  }
}
