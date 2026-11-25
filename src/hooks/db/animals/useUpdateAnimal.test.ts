import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRxDatabase, addRxPlugin } from "rxdb";
import { getRxStorageMemory } from "rxdb/plugins/storage-memory";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { animalSchema } from "@/db/schemas/animal.schema";
import { movementSchema } from "@/db/schemas/movement.schema";
import { animalMetricWeightSchema } from "@/db/schemas/animal_metric_weight.schema";
import { useUpdateAnimal } from "./useUpdateAnimal";

addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBUpdatePlugin);

let currentTestDb: any = null;

vi.mock("@/providers", () => ({
  useRxDatabase: () => currentTestDb,
}));

describe("useUpdateAnimal", () => {
  beforeEach(async () => {
    const dbName = `test_update_animal_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    currentTestDb = await createRxDatabase({
      name: dbName,
      storage: getRxStorageMemory(),
      multiInstance: false,
    });

    await currentTestDb.addCollections({
      animals: { schema: animalSchema },
      movements: { schema: movementSchema },
      animal_metrics_weight: { schema: animalMetricWeightSchema },
    });

    const now = Date.now();
    await currentTestDb.animals.bulkInsert([
      {
        animal_key: "INDI::MAE1",
        id: "id-mae1",
        rgn: "MAE1",
        serie_rgd: "INDI",
        sex: "F",
        condition: "Parida",
        parturition_from: { baby_sex: "M", baby_rgn: "BEZ1" },
        created_at: now,
        updated_at: now,
        _deleted: false,
      },
      {
        animal_key: "INDI::MAE2",
        id: "id-mae2",
        rgn: "MAE2",
        serie_rgd: "INDI",
        sex: "F",
        condition: "Solteira",
        created_at: now,
        updated_at: now,
        _deleted: false,
      },
      {
        animal_key: "INDI::BEZ1",
        id: "id-bez1",
        rgn: "BEZ1",
        serie_rgd: "INDI",
        sex: "M",
        born_date: "2026-05-10",
        mother_rgn: "MAE1",
        mother_serie_rgd: "INDI",
        created_at: now,
        updated_at: now,
        _deleted: false,
      },
    ]);

    await currentTestDb.movements.insert({
      id: "mov-birth-1",
      type: "nascimento",
      animal_id: "BEZ1",
      animal_key: "INDI::BEZ1",
      date: "2026-05-10",
      event_date: "2026-05-10",
      details_id: "",
      created_at: now,
      updated_at: now,
      _deleted: false,
    });

    await currentTestDb.animal_metrics_weight.insert({
      id: "w-birth-1",
      animal_key: "INDI::BEZ1",
      rgn: "BEZ1",
      born_metric: true,
      date: "2026-05-10",
      value: 34,
      created_at: now,
      updated_at: now,
      _deleted: false,
    });
  });

  afterEach(async () => {
    if (currentTestDb) {
      await currentTestDb.close();
      currentTestDb = null;
    }
  });

  it("sincroniza born_date com a movimentação de nascimento e o peso ao nascer", async () => {
    const { result } = renderHook(() => useUpdateAnimal());

    await act(async () => {
      await result.current.actions.updateAnimal("INDI::BEZ1", {
        born_date: "2026-05-18",
      });
    });

    const animal = await currentTestDb.animals.findOne("INDI::BEZ1").exec();
    const movement = await currentTestDb.movements.findOne("mov-birth-1").exec();
    const weight = await currentTestDb.animal_metrics_weight
      .findOne("w-birth-1")
      .exec();

    expect(animal.toJSON().born_date).toBe("2026-05-18");
    expect(movement.toJSON().date).toBe("2026-05-18");
    expect(movement.toJSON().event_date).toBe("2026-05-18");
    expect(weight.toJSON().date).toBe("2026-05-18");
  });

  it("atualiza o status da mãe antiga para Solteira e da nova mãe para Parida ao corrigir mother_rgn", async () => {
    const { result } = renderHook(() => useUpdateAnimal());

    await act(async () => {
      await result.current.actions.updateAnimal("INDI::BEZ1", {
        mother_rgn: "MAE2",
        mother_serie_rgd: "INDI",
      });
    });

    const oldMother = (
      await currentTestDb.animals.findOne("INDI::MAE1").exec()
    ).toJSON();
    const newMother = (
      await currentTestDb.animals.findOne("INDI::MAE2").exec()
    ).toJSON();

    expect(oldMother.condition).toBe("Solteira");
    expect(oldMother.parturition_from).toBeUndefined();

    expect(newMother.condition).toBe("Parida");
    expect(newMother.parturition_from).toEqual({
      baby_sex: "M",
      baby_rgn: "BEZ1",
    });
  });
});

