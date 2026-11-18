"use client";

import { useLocalMutation } from "@/hooks/core";
import { Animal } from "@/types/animal.type";
import { Exchange } from "@/types/exchange.type";
import { useRxDatabase } from "@/providers";
import { getAnimalKey } from "@/utils/animalIdentity";
import { v4 as uuidv4 } from "uuid";

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
    const updatedAnimal = { ...oldData, ...data };
    const nextAnimalKey = getAnimalKey(updatedAnimal);
    if (nextAnimalKey === oldAnimalKey) {
      await actions.update(oldAnimalKey, data);
      return;
    }

    const existing = await animalsColl.findOne(nextAnimalKey).exec();
    if (existing && !existing._deleted) {
      throw new Error("Já existe um animal com esta combinação de Série/RGD e RGN.");
    }

    await animalsColl.upsert({
      ...updatedAnimal,
      id: uuidv4(),
      animal_key: nextAnimalKey,
      created_at: oldData.created_at,
      updated_at: Date.now(),
      _deleted: false,
    });

    const relatedCollections = [
      [db.animal_metrics_weight, "rgn"],
      [db.animal_metrics_ce, "rgn"],
      [db.animal_vaccines, "rgn"],
      [db.reproduction_events, "rgn"],
      [db.deaths, "animal_rgn"],
      [db.sales, "animal_rgn"],
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
            updated_at: Date.now(),
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
          updated_at: Date.now(),
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

    await oldDoc.patch({ _deleted: true, updated_at: Date.now() });
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
