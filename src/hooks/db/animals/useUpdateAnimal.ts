"use client";

import { useLocalMutation } from "@/hooks/core";
import { Animal } from "@/types/animal.type";
import { Exchange } from "@/types/exchange.type";
import { useRxDatabase } from "@/providers";
import { getAnimalKey } from "@/utils/animalIdentity";
import { v4 as uuidv4 } from "uuid";
import type { RxCollection, RxDocument } from "rxdb";

const normalizeReg = (value?: string | null): string =>
  (value ?? "").trim().toUpperCase();

async function findUniqueAnimalDoc(
  animalsColl: RxCollection<Animal>,
  rgn: string,
  serieRgd?: string | null,
): Promise<RxDocument<Animal> | null> {
  const cleanRgn = normalizeReg(rgn);
  if (!cleanRgn) return null;

  const matches = await animalsColl
    .find({ selector: { rgn: { $eq: cleanRgn }, _deleted: { $eq: false } } })
    .exec();

  if (matches.length === 1) return matches[0];
  if (matches.length > 1 && serieRgd) {
    const cleanSerie = normalizeReg(serieRgd);
    const bySerie = matches.filter(
      (doc) => normalizeReg(doc.toJSON().serie_rgd) === cleanSerie,
    );
    if (bySerie.length === 1) return bySerie[0];
  }
  return null;
}

async function syncBirthDateRelations(
  db: NonNullable<ReturnType<typeof useRxDatabase>>,
  oldData: Animal,
  updatedAnimal: Animal,
  oldAnimalKey: string,
  nextAnimalKey: string,
  timestamp: number,
): Promise<void> {
  const newBornDate = updatedAnimal.born_date;
  if (!newBornDate || newBornDate === oldData.born_date) return;

  const matchesAnimal = (
    recordAnimalKey?: string | null,
    recordRgn?: string | null,
  ) => {
    if (recordAnimalKey) {
      return recordAnimalKey === oldAnimalKey || recordAnimalKey === nextAnimalKey;
    }
    return (
      normalizeReg(recordRgn) === normalizeReg(oldData.rgn) ||
      normalizeReg(recordRgn) === normalizeReg(updatedAnimal.rgn)
    );
  };

  if (db.movements) {
    const birthMovements = await db.movements
      .find({
        selector: {
          type: { $eq: "nascimento" },
          _deleted: { $eq: false },
        },
      })
      .exec();

    await Promise.all(
      birthMovements
        .filter((doc) => {
          const mov = doc.toJSON();
          return matchesAnimal(mov.animal_key, mov.animal_id);
        })
        .map((doc) =>
          doc.patch({
            date: newBornDate,
            event_date: newBornDate,
            updated_at: timestamp,
          }),
        ),
    );
  }

  if (db.animal_metrics_weight) {
    const birthWeights = await db.animal_metrics_weight
      .find({
        selector: {
          born_metric: { $eq: true },
          _deleted: { $eq: false },
          metric_type: { $eq: "weight" },
        },
      })
      .exec();

    await Promise.all(
      birthWeights
        .filter((doc) => {
          const weight = doc.toJSON();
          return matchesAnimal(weight.animal_key, weight.rgn);
        })
        .map((doc) =>
          doc.patch({
            date: newBornDate,
            updated_at: timestamp,
          }),
        ),
    );
  }
}

async function syncMotherStatusOnParentChange(
  db: NonNullable<ReturnType<typeof useRxDatabase>>,
  oldData: Animal,
  updatedAnimal: Animal,
  oldAnimalKey: string,
  nextAnimalKey: string,
  timestamp: number,
): Promise<void> {
  const oldMotherRgn = normalizeReg(oldData.mother_rgn);
  const newMotherRgn = normalizeReg(updatedAnimal.mother_rgn);
  const oldMotherSerie = normalizeReg(oldData.mother_serie_rgd) || "INDI";
  const newMotherSerie = normalizeReg(updatedAnimal.mother_serie_rgd) || "INDI";

  const motherChanged =
    oldMotherRgn !== newMotherRgn ||
    (Boolean(newMotherRgn) && oldMotherSerie !== newMotherSerie);

  if (!motherChanged) return;

  if (oldMotherRgn) {
    const oldMotherDoc = await findUniqueAnimalDoc(
      db.animals,
      oldMotherRgn,
      oldMotherSerie,
    );
    const oldMotherKey = oldMotherDoc?.toJSON().animal_key;

    if (
      oldMotherDoc &&
      oldMotherKey !== oldAnimalKey &&
      oldMotherKey !== nextAnimalKey
    ) {
      const siblingDocs = await db.animals
        .find({
          selector: {
            mother_rgn: { $eq: oldMotherRgn },
            _deleted: { $eq: false },
          },
        })
        .exec();

      const remainingCalves = siblingDocs
        .map((doc) => doc.toJSON() as Animal)
        .filter(
          (calf) =>
            calf.animal_key !== oldAnimalKey &&
            calf.animal_key !== nextAnimalKey &&
            (!calf.mother_serie_rgd ||
              normalizeReg(calf.mother_serie_rgd) === oldMotherSerie),
        );

      if (remainingCalves.length > 0) {
        const oldMotherData = oldMotherDoc.toJSON() as Animal;
        if (oldMotherData.condition !== "Parida") {
          await oldMotherDoc.patch({
            condition: "Parida",
            updated_at: timestamp,
          });
        }
      } else {
        await oldMotherDoc.patch({
          condition: "Solteira",
          updated_at: timestamp,
        });
      }
    }
  }

  if (newMotherRgn) {
    const newMotherDoc = await findUniqueAnimalDoc(
      db.animals,
      newMotherRgn,
      newMotherSerie,
    );
    const newMotherKey = newMotherDoc?.toJSON().animal_key;

    if (
      newMotherDoc &&
      newMotherKey !== oldAnimalKey &&
      newMotherKey !== nextAnimalKey
    ) {
      await newMotherDoc.patch({
        condition: "Parida",
        updated_at: timestamp,
      });
    }
  }
}

export function useUpdateAnimal() {
  const { loading, error, actions } = useLocalMutation<Animal>("animals");
  const db = useRxDatabase();

  const updateAnimal = async (
    animalKeyOrRgn: string,
    data: Partial<Animal>,
  ): Promise<void> => {
    if (!db) throw new Error("Database not initialized");
    const animalsColl = db.animals;
    let oldDoc = await animalsColl.findOne(animalKeyOrRgn).exec();
    if (!oldDoc && !animalKeyOrRgn.includes("::")) {
      const matches = await animalsColl
        .find({ selector: { rgn: { $eq: animalKeyOrRgn }, _deleted: { $eq: false } } })
        .exec();
      if (matches.length > 1) {
        throw new Error(
          `O RGN ${animalKeyOrRgn} pertence a mais de um animal. Selecione pela combinação Série/RGD e RGN.`,
        );
      }
      oldDoc = matches[0] ?? null;
    }
    if (!oldDoc) throw new Error(`Animal ${animalKeyOrRgn} não encontrado.`);

    const oldData = oldDoc.toJSON() as Animal;
    const oldAnimalKey = oldData.animal_key;
    if (!oldAnimalKey) {
      throw new Error("Animal sem chave de identidade. Sincronize novamente os dados locais.");
    }
    const timestamp = Date.now();
    const updatedAnimal: Animal = { ...oldData, ...data };
    const nextAnimalKey = getAnimalKey(updatedAnimal);

    if (nextAnimalKey === oldAnimalKey) {
      await actions.update(oldAnimalKey, data);
    } else {
      const existing = await animalsColl.findOne(nextAnimalKey).exec();
      if (existing && !existing._deleted) {
        throw new Error("Já existe um animal com esta combinação de Série/RGD e RGN.");
      }

      await animalsColl.upsert({
        ...updatedAnimal,
        id: uuidv4(),
        animal_key: nextAnimalKey,
        created_at: oldData.created_at,
        updated_at: timestamp,
        _deleted: false,
      });

      const relatedCollections = [
        [db.animal_metrics_weight, "rgn"],
        [db.animal_vaccines, "rgn"],
        [db.reproduction_events, "rgn"],
        [db.deaths, "animal_rgn"],
        [db.transactions, "animal_rgn"],
        [db.movements, "animal_id"],
      ] as const;
      for (const [collection, rgnField] of relatedCollections) {
        const records = await collection
          .find({ selector: { animal_key: { $eq: oldAnimalKey } } })
          .exec();
        await Promise.all(
          records.map((record) =>
            record.patch({
              animal_key: nextAnimalKey,
              [rgnField]: updatedAnimal.rgn,
              updated_at: timestamp,
            }),
          ),
        );
      }

      const exchanges = await db.exchanges
        .find({
          selector: {
            $or: [
              { animal_key: { $eq: oldAnimalKey } },
              { traded_animal_key: { $eq: oldAnimalKey } },
              { substitute_animal_key: { $eq: oldAnimalKey } },
            ],
          },
        })
        .exec();
      await Promise.all(
        exchanges.map((exchange) => {
          const patch: Partial<Exchange> = {
            updated_at: timestamp,
          };
          const exchangeData = exchange.toJSON();
          if (exchangeData.animal_key === oldAnimalKey) {
            Object.assign(patch, {
              animal_key: nextAnimalKey,
              animal_rgn: updatedAnimal.rgn,
            });
          }
          if (exchangeData.traded_animal_key === oldAnimalKey) {
            Object.assign(patch, {
              traded_animal_key: nextAnimalKey,
              traded_animal_rgn: updatedAnimal.rgn,
            });
          }
          if (exchangeData.substitute_animal_key === oldAnimalKey) {
            Object.assign(patch, {
              substitute_animal_key: nextAnimalKey,
              substitute_animal_rgn: updatedAnimal.rgn,
            });
          }
          return exchange.patch(patch);
        }),
      );

      await oldDoc.patch({ _deleted: true, updated_at: timestamp });
    }

    if (data.born_date !== undefined) {
      await syncBirthDateRelations(
        db,
        oldData,
        updatedAnimal,
        oldAnimalKey,
        nextAnimalKey,
        timestamp,
      );
    }

    if (
      data.mother_rgn !== undefined ||
      data.mother_serie_rgd !== undefined
    ) {
      await syncMotherStatusOnParentChange(
        db,
        oldData,
        updatedAnimal,
        oldAnimalKey,
        nextAnimalKey,
        timestamp,
      );
    }
  };

  return {
    data: null,
    loading,
    error,
    actions: {
      ...actions,
      updateAnimal,
    },
  };
}
