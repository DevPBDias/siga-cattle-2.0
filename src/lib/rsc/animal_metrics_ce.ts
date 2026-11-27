import { getDatabase } from "@/db/client";
import { AnimalMetric } from "@/types/animal_metrics.type";

export async function getAnimalMetricsCERSC(): Promise<AnimalMetric[]> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");
  const docs = await db.animal_metrics_weight
    .find({
      selector: {
        _deleted: { $eq: false },
        metric_type: { $eq: "ce" },
      },
      sort: [{ date: "desc" as const }],
    })
    .exec();

  return docs.map((doc) => doc.toJSON() as AnimalMetric);
}

export async function getAnimalMetricCERSC(
  id: number
): Promise<AnimalMetric | null> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");
  const doc = await db.animal_metrics_weight
    .findOne({
      selector: {
        id: { $eq: id.toString() },
        metric_type: { $eq: "ce" },
      },
    })
    .exec();
  return doc ? (doc.toJSON() as AnimalMetric) : null;
}

export async function getAnimalMetricsCEByRgnRSC(
  animalKeyOrRgn: string
): Promise<AnimalMetric[]> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");
  const docs = await db.animal_metrics_weight
    .find({
      selector: {
        _deleted: { $eq: false },
        metric_type: { $eq: "ce" },
        ...(animalKeyOrRgn.includes("::")
          ? { animal_key: { $eq: animalKeyOrRgn } }
          : { rgn: { $eq: animalKeyOrRgn } }),
      },
      sort: [{ date: "desc" as const }],
    })
    .exec();

  return docs.map((doc) => doc.toJSON() as AnimalMetric);
}

export async function countAnimalMetricsCERSC(): Promise<number> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");
  return await db.animal_metrics_weight
    .count({
      selector: {
        _deleted: { $eq: false },
        metric_type: { $eq: "ce" },
      },
    })
    .exec();
}
