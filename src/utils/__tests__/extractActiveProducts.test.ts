import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { extractActiveProductsFromExcel } from "@/utils/extractData";

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
  it("applies the race declared in the ABCZ header to every animal", async () => {
    const file = createAbczWorkbookFile([
      ["ASSOCIAÇÃO BRASILEIRA DOS CRIADORES DE ZEBU"],
      ["Criador: 57282", "", "", "", "Raça: 2 - GIR"],
      ["RG", "Nome", "Sexo", "Dt.Nasc.", "Pai", "Mãe", "Receptora", "Status"],
      ["GIRR 55", "Animal 1", "F", "02/09/2010", "", "", "", "RG D"],
      ["GIRR 56", "Animal 2", "M", "03/09/2011", "", "", "", "RG D"],
    ]);

    const animals = await extractActiveProductsFromExcel(file);

    expect(animals).toHaveLength(2);
    expect(animals.map((animal) => animal.rgn)).toEqual(["55", "56"]);
    expect(animals.map((animal) => animal.breed)).toEqual(["Gir", "Gir"]);
  });
});
