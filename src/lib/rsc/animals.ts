import { getDatabase } from "@/db/client";
import { Animal } from "@/types/animal.type";

export async function getAnimalsRSC(): Promise<Animal[]> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");
  const docs = await db.animals
    .find({
      selector: {
        _deleted: { $eq: false },
      },
      sort: [{ updated_at: "desc" as const }],
    })
    .exec();

  return docs.map((doc) => doc.toJSON() as Animal);
}

export async function getAnimalRSC(rgn: string): Promise<Animal | null> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");
  const docs = await db.animals
    .find({
      selector: {
        _deleted: { $eq: false },
        ...(rgn.includes("::")
          ? { animal_key: { $eq: rgn } }
          : { rgn: { $eq: rgn } }),
      },
    })
    .exec();
  return docs.length === 1 ? (docs[0].toJSON() as Animal) : null;
}

export async function getAnimalsByFarmRSC(farmId: number): Promise<Animal[]> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");
  const docs = await db.animals
    .find({
      selector: {
        _deleted: { $eq: false },
        farm_id: { $eq: farmId },
      },
      sort: [{ updated_at: "desc" as const }],
    })
    .exec();

  return docs.map((doc) => doc.toJSON() as Animal);
}

export async function getAnimalsBySexRSC(sex: "M" | "F"): Promise<Animal[]> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");
  const docs = await db.animals
    .find({
      selector: {
        _deleted: { $eq: false },
        sex: { $eq: sex },
      },
      sort: [{ updated_at: "desc" as const }],
    })
    .exec();

  return docs.map((doc) => doc.toJSON() as Animal);
}

export async function countAnimalsRSC(): Promise<number> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");
  return await db.animals
    .count({
      selector: {
        _deleted: { $eq: false },
      },
    })
    .exec();
}
