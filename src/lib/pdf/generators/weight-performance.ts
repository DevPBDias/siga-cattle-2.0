import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { WeightReportData } from "../types";
import { DEFAULT_TABLE_STYLES } from "../core/base-styles";
import {
  drawHeader,
  drawFooter,
  generateCoverPage,
} from "../core/branding-utils";

export const generateWeightPerformancePDF = async (
  reportData: WeightReportData
) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a3",
  });

  const brandingOptions = {
    reportName: "RELATÓRIO DE DESEMPENHO (PESAGENS)",
    farmName: reportData.farmName,
    gender:
      reportData.gender === "Ambos" ? "Machos e Fêmeas" : reportData.gender,
    systemName: reportData.systemName,
    reportDate: reportData.reportDate,
    totalItems: reportData.data.length,
  };

  // 1. Capa
  generateCoverPage(doc, brandingOptions);

  // 2. Colunas Fixas
  const columns = [
    { header: "RGD RGN", dataKey: "rgdn" },
    { header: "NOME", dataKey: "animalName" },
    { header: "P1 (Última)", dataKey: "p1" },
    { header: "P2", dataKey: "p2" },
    { header: "P3", dataKey: "p3" },
    { header: "P4", dataKey: "p4" },
    { header: "P5", dataKey: "p5" },
    { header: "GMD (kg/d)", dataKey: "gmd" },
  ];

  // Ordenação RGN Decrescente
  const sortedData = [...reportData.data].sort((a, b) => {
    return b.rgn.localeCompare(a.rgn, undefined, { numeric: true });
  });

  const rows = sortedData.map((item) => {
    const formatP = (p?: { weight: number; date: string }) =>
      p ? `${p.weight} kg (${p.date})` : "---";

    return {
      rgdn: `${item.rgd || ""} ${item.rgn || ""}`.trim() || "---",
      animalName: item.animalName || "---",
      p1: formatP(item.p1),
      p2: formatP(item.p2),
      p3: formatP(item.p3),
      p4: formatP(item.p4),
      p5: formatP(item.p5),
      gmd: item.gmd ? `${item.gmd.toFixed(3)}` : "---",
    };
  });

  // 3. Tabela
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    columns: columns,
    body: rows,
    columnStyles: {
      rgdn: { cellWidth: 28 },
      animalName: { cellWidth: 35 },
      p1: { cellWidth: 33 },
      p2: { cellWidth: 33 },
      p3: { cellWidth: 33 },
      p4: { cellWidth: 33 },
      p5: { cellWidth: 33 },
      gmd: { cellWidth: 20, fontStyle: "bold" },
    },
  });

  // 4. Branding
  drawHeader(doc, brandingOptions);
  drawFooter(doc);

  // 5. Salvar
  const filename = `relatorio-desempenho-${reportData.farmName
    .toLowerCase()
    .replace(/\s+/g, "-")}.pdf`;
  doc.save(filename);
};
