import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  animalsFind: vi.fn(),
  farmsFind: vi.fn(),
  generatePdf: vi.fn(),
  getDatabase: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  getDatabase: mocks.getDatabase,
}));

vi.mock("../generators/animals-by-farm", () => ({
  generateAnimalsByFarmPDF: mocks.generatePdf,
}));

import { animalByFarmDefinition } from "./animalByFarm.definition";

describe("animalByFarmDefinition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.animalsFind.mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    });
    mocks.farmsFind.mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    });
    mocks.getDatabase.mockResolvedValue({
      animals: { find: mocks.animalsFind },
      farms: { find: mocks.farmsFind },
    });
  });

  it("filters the all-animals report by the selected breed", async () => {
    await animalByFarmDefinition.generate({
      filters: { breed: "Angus" },
    });

    expect(mocks.animalsFind).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: expect.objectContaining({
          breed: { $eq: "Angus" },
        }),
      }),
    );
  });
});
