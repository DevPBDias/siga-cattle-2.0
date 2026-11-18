import { getDatabase } from "@/db/client";
import { ReproductionEvent, EventType } from "@/types/reproduction_event.type";

export async function getReproductionEventsRSC(): Promise<ReproductionEvent[]> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");
  const docs = await db.reproduction_events
    .find({
      selector: {
        _deleted: { $eq: false },
      },
      sort: [{ d0_date: "desc" as const }],
    })
    .exec();

  return docs.map((doc) => doc.toJSON() as ReproductionEvent);
}

export async function getReproductionEventRSC(
  eventId: string
): Promise<ReproductionEvent | null> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");
  const doc = await db.reproduction_events.findOne(eventId).exec();
  return doc ? (doc.toJSON() as ReproductionEvent) : null;
}

export async function getReproductionEventsByRgnRSC(
  animalKeyOrRgn: string
): Promise<ReproductionEvent[]> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");
  const docs = await db.reproduction_events
    .find({
      selector: {
        _deleted: { $eq: false },
        ...(animalKeyOrRgn.includes("::")
          ? { animal_key: { $eq: animalKeyOrRgn } }
          : { rgn: { $eq: animalKeyOrRgn } }),
      },
      sort: [{ d0_date: "desc" as const }],
    })
    .exec();

  return docs.map((doc) => doc.toJSON() as ReproductionEvent);
}

export async function getReproductionEventsByTypeRSC(
  eventType: EventType
): Promise<ReproductionEvent[]> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");
  const docs = await db.reproduction_events
    .find({
      selector: {
        _deleted: { $eq: false },
        event_type: { $eq: eventType },
      },
      sort: [{ d0_date: "desc" as const }],
    })
    .exec();

  return docs.map((doc) => doc.toJSON() as ReproductionEvent);
}

export async function countReproductionEventsRSC(): Promise<number> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");
  return await db.reproduction_events
    .count({
      selector: {
        _deleted: { $eq: false },
      },
    })
    .exec();
}
