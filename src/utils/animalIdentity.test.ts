import { describe, expect, it } from "vitest";
import { addRxPlugin, createRxDatabase } from "rxdb";
import { RxDBMigrationPlugin } from "rxdb/plugins/migration-schema";
import { getRxStorageMemory } from "rxdb/plugins/storage-memory";
import { v4 as uuidv4 } from "uuid";
import { animalSchema } from "@/db/schemas/animal.schema";
import { getAnimalKey } from "./animalIdentity";

addRxPlugin(RxDBMigrationPlugin);

describe("animal identity", () => {
  it("allows animals with the same RGN under different registration series", () => {
    expect(getAnimalKey({ serie_rgd: "GIR", rgn: "206" })).not.toBe(
      getAnimalKey({ serie_rgd: "GIRG", rgn: "206" }),
    );
  });

  it("normalizes the exact registration pair", () => {
    expect(getAnimalKey({ serie_rgd: " gir ", rgn: " 206 " })).toBe(
      getAnimalKey({ serie_rgd: "GIR", rgn: "206" }),
    );
  });

  it("requires both registration fields", () => {
    expect(() => getAnimalKey({ serie_rgd: "", rgn: "206" })).toThrow(
      "Informe a série/RGD e o RGN para identificar o animal.",
    );
  });

  it("uses the registered pair as the local primary key", async () => {
    const db = await createRxDatabase({
      name: `animal-identity-${uuidv4().replace(/-/g, "")}`,
      storage: getRxStorageMemory(),
    });

    try {
      await db.addCollections({
        animals: { schema: animalSchema },
      });

      const base = {
        rgn: "206",
        animal_state: "ATIVO",
        created_at: Date.now(),
        updated_at: Date.now(),
        _deleted: false,
      };
      await db.animals.insert({
        ...base,
        serie_rgd: "GIR",
        animal_key: getAnimalKey({ serie_rgd: "GIR", rgn: "206" }),
      });
      await db.animals.insert({
        ...base,
        serie_rgd: "GIRG",
        animal_key: getAnimalKey({ serie_rgd: "GIRG", rgn: "206" }),
      });

      await expect(
        db.animals.insert({
          ...base,
          serie_rgd: "GIR",
          animal_key: getAnimalKey({ serie_rgd: "GIR", rgn: "206" }),
        }),
      ).rejects.toThrow();
      expect(await db.animals.count().exec()).toBe(2);
    } finally {
      await db.remove();
    }
  });
});
