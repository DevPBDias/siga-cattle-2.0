import { describe, expect, it } from "vitest";
import { calculateDashboardStats } from "./useDashboardStats";
import type { Animal } from "@/types/animal.type";
import type { AnimalMetric } from "@/types/animal_metrics.type";

const makeAnimal = (
  overrides: Partial<Animal> & Pick<Animal, "animal_key" | "farm_id">,
): Animal => ({
  animal_key: overrides.animal_key,
  farm_id: overrides.farm_id,
  rgn: "100",
  serie_rgd: "INDI",
  animal_state: "ATIVO",
  born_date: "2026-04-10",
  created_at: new Date(2026, 3, 10, 12).getTime(),
  updated_at: 0,
  _deleted: false,
  ...overrides,
});

const makeWeight = (
  id: string,
  animalKey: string,
  value: number,
  date: string,
): AnimalMetric => ({
  id,
  animal_key: animalKey,
  rgn: "100",
  value,
  date,
  created_at: 0,
  updated_at: 0,
  _deleted: false,
});

describe("calculateDashboardStats", () => {
  const animals = [
    makeAnimal({ animal_key: "a1", farm_id: "farm-a" }),
    makeAnimal({ animal_key: "b1", farm_id: "farm-b", born_date: "2026-04-12" }),
    makeAnimal({
      animal_key: "a2",
      farm_id: "farm-a",
      animal_state: "ALERTA",
      born_date: "2020-01-01",
    }),
  ];
  const weights = [
    makeWeight("a1-early", "a1", 100, "2026-04-01"),
    makeWeight("a1-late", "a1", 110, "2026-04-11"),
    makeWeight("b1-early", "b1", 50, "2026-04-01"),
    makeWeight("b1-late", "b1", 80, "2026-04-11"),
  ];

  it("limits the KPIs and weight averages to the selected farm", () => {
    const stats = calculateDashboardStats(animals, weights, "farm-a", "2026-04-15");

    expect(stats.activeTotal).toBe(1);
    expect(stats.entradaEsteMes).toBe(2);
    expect(stats.nascimentos30d).toBe(1);
    expect(stats.animalEmAlerta).toBe(1);
    expect(stats.totalPesagens).toBe(2);
    expect(stats.gmdMedio).toBe(1);
  });

  it("aggregates accessible farms when no farm is selected", () => {
    const stats = calculateDashboardStats(animals, weights, undefined, "2026-04-15");

    expect(stats.activeTotal).toBe(2);
    expect(stats.totalPesagens).toBe(4);
    expect(stats.gmdMedio).toBe(2);
  });
});
