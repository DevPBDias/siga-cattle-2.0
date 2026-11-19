import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import {
  extractActiveProductsFromExcel,
  sheetToRowsIncludingPopulatedCells,
} from "@/utils/extractData";

function createAbczRows(): unknown[][] {
  const animals = Array.from({ length: 18 }, (_, index) => [
    `GIRR ${55 + index}`,
    `Animal ${index + 1}`,
    index === 0 ? "F" : "M",
    "02/09/2010",
    "",
    "",
    "",
    "RG D",
  ]);

  return [
    ["ASSOCIAÇÃO BRASILEIRA DOS CRIADORES DE ZEBU"],
    ["Criador: 57282", "", "", "", "Raça: 2 - GIR"],
    ["Fazenda: HARAS FAZENDA LUMA"],
    ["Órgão: ABCZ-SEDE"],
    [],
    [],
    [],
    ["RG", "Nome", "Sexo", "Dt.Nasc.", "Pai", "Mãe", "Receptora", "Status"],
    ...animals,
  ];
}

function createAbczWorkbookFile(rows: unknown[][]): File {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "Planilha");
  const content = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  return new File([new Uint8Array(content)], "produtos-ativos.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

describe("extractActiveProductsFromExcel", () => {
  it("includes populated cells beyond a stale worksheet range", () => {
    const sheet = XLSX.utils.aoa_to_sheet(createAbczRows());
    sheet["!ref"] = "A1:H9";

    const rows = sheetToRowsIncludingPopulatedCells(sheet);

    expect(rows).toHaveLength(26);
    expect(rows[25][0]).toBe("GIRR 72");
  });

  it("extracts all 18 animals and applies the ABCZ race to every animal", async () => {
    const file = createAbczWorkbookFile(createAbczRows());

    const animals = await extractActiveProductsFromExcel(file);

    expect(animals).toHaveLength(18);
    expect(animals.map((animal) => animal.rgn)).toEqual(
      Array.from({ length: 18 }, (_, index) => String(55 + index)),
    );
    expect(animals.every((animal) => animal.breed === "Gir")).toBe(true);
  });

  it("uses the selected breed for every imported animal", async () => {
    const file = createAbczWorkbookFile(createAbczRows());

    const animals = await extractActiveProductsFromExcel(file, "Angus");

    expect(animals).toHaveLength(18);
    expect(animals.every((animal) => animal.breed === "Angus")).toBe(true);
  });
});
