import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/data-table";

const mocks = vi.hoisted(() => ({
  animals: [
    {
      animal_key: "calf-a",
      rgn: "1",
      serie_rgd: "A",
      farm_id: "farm-a",
      animal_state: "ATIVO",
      born_date: "2026-04-01",
      created_at: 1775044800000,
      updated_at: 0,
      _deleted: false,
    },
    {
      animal_key: "calf-b",
      rgn: "1",
      serie_rgd: "B",
      farm_id: "farm-b",
      animal_state: "ATIVO",
      born_date: "2026-04-01",
      created_at: 1775044800000,
      updated_at: 0,
      _deleted: false,
    },
    {
      animal_key: "pregnant-a",
      rgn: "2",
      serie_rgd: "P",
      farm_id: "farm-a",
      animal_state: "PRENHA",
      born_date: "2020-01-01",
      created_at: 1577880000000,
      updated_at: 0,
      _deleted: false,
    },
    {
      animal_key: "alert-a",
      rgn: "3",
      serie_rgd: "C",
      farm_id: "farm-a",
      animal_state: "EM_TRATAMENTO",
      born_date: "2020-01-01",
      created_at: 1577880000000,
      updated_at: 0,
      _deleted: false,
    },
  ],
  weights: [
    {
      id: "weight-a",
      animal_key: "calf-a",
      rgn: "1",
      date: "2026-04-10",
      value: 100,
      created_at: 0,
      updated_at: 0,
      _deleted: false,
    },
  ],
  vaccines: [
    {
      id: "vaccine-a",
      animal_key: "calf-a",
      rgn: "1",
      vaccine_id: "vaccine",
      date: "2026-04-14",
      created_at: 0,
      updated_at: 0,
      _deleted: false,
    },
  ],
}));

vi.mock("@/hooks/db/animals/useAnimals", () => ({
  useAnimals: () => ({ data: mocks.animals, loading: false, error: null }),
}));

vi.mock("@/hooks/db/animal_weights/useAnimalWeights", () => ({
  useAnimalWeights: () => ({ data: mocks.weights, loading: false, error: null }),
}));

vi.mock("@/hooks/db/movements/useMovements", () => ({
  useMovements: () => ({ data: [], loading: false, error: null }),
}));

vi.mock("@/hooks/db/animal_vaccines/useAllAnimalVaccines", () => ({
  useAllAnimalVaccines: () => ({ data: mocks.vaccines, loading: false, error: null }),
}));

describe("Dashboard DataTable filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("limits rows by farm and shows the latest real event", () => {
    render(<DataTable farmId="farm-a" />);

    expect(screen.getByText("A 1")).toBeInTheDocument();
    expect(screen.queryByText("B 1")).not.toBeInTheDocument();
    expect(screen.getByText("Vacinação")).toBeInTheDocument();
    expect(screen.getByText("14/04/2026")).toBeInTheDocument();
  });

  it("shows treatment/alert statuses without treating pregnancy as an alert", async () => {
    const user = userEvent.setup();
    render(<DataTable farmId="farm-a" />);
    await user.click(screen.getByRole("tab", { name: /alertas/i }));

    expect(screen.getByText("C 3")).toBeInTheDocument();
    expect(screen.queryByText("P 2")).not.toBeInTheDocument();
    expect(screen.queryByText("A 1")).not.toBeInTheDocument();
  });
});
