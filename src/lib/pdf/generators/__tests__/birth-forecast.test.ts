import { describe, expect, it, vi } from "vitest";
import type { BirthForecastReportData } from "../../types";
import { generateBirthForecastPDF } from "../birth-forecast";

const { autoTableMock, saveMock, drawHeaderMock, drawFooterMock } = vi.hoisted(
  () => ({
    autoTableMock: vi.fn(),
    saveMock: vi.fn(),
    drawHeaderMock: vi.fn(),
    drawFooterMock: vi.fn(),
  }),
);

vi.mock("jspdf", () => ({
  jsPDF: class {
    save = saveMock;
  },
}));

vi.mock("jspdf-autotable", () => ({ default: autoTableMock }));

vi.mock("../../core/branding-utils", () => ({
  drawHeader: drawHeaderMock,
  drawFooter: drawFooterMock,
}));

describe("generateBirthForecastPDF", () => {
  it("gera o relatório com as colunas e informações na ordem definida", async () => {
    const reportData: BirthForecastReportData = {
      farmName: "Fazenda Ouro",
      reportDate: "27/11/2026",
      systemName: "INDI Ouro 2.0",
      data: [
        {
          rgn: "1001",
          birth_date: "20/05/2026",
          ia_date: "11/08/2025",
          gestation_days: "282",
          sex: "Fêmea",
          color: "Branca",
          weight: "34 kg",
          mother: "INDI 900",
          father: "Touro 1",
          farm_name: "Fazenda Ouro",
          registration_date: "20/05/2026",
          created_by: "Usuário",
        },
      ],
    };

    await generateBirthForecastPDF(reportData);

    const [, options] = autoTableMock.mock.calls[0];
    expect(options.columns).toEqual([
      { header: "DATA NASC", dataKey: "birth_date" },
      { header: "DATA IA", dataKey: "ia_date" },
      { header: "DIAS GESTAÇÃO", dataKey: "gestation_days" },
      { header: "SEXO", dataKey: "sex" },
      { header: "COR", dataKey: "color" },
      { header: "PESO", dataKey: "weight" },
      { header: "MATRIZ", dataKey: "mother" },
    ]);
  });
});
