import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { SanitaryReportData } from "../types";
import { DEFAULT_TABLE_STYLES } from "../core/base-styles";
import {
  drawHeader,
  drawFooter,
  generateCoverPage,
} from "../core/branding-utils";

export const generateSanitaryByFarmPDF = async (
  reportData: SanitaryReportData
) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a3",
  });

  const brandingOptions = {
    reportName: "RELATÓRIO SANITÁRIO (VACINAS)",
    farmName: reportData.farmName,
    systemName: reportData.systemName,
    reportDate: reportData.reportDate,
    totalItems: reportData.data.length,
  };

  // 1. Capa Institucional (Personalizada para Sanitário)
  generateCoverPage(doc, {
    ...brandingOptions,
    gender: `Período: ${reportData.startDate} a ${reportData.endDate}`,
  });

  // 2. Preparação de Dados
  const columns = [
    { header: "RGD RGN", dataKey: "rgdn" },
    { header: "VACINA", dataKey: "vaccineName" },
    { header: "DATA", dataKey: "date" },
    { header: "OBSERVAÇÕES", dataKey: "observations" },
  ];

  // Ordenação por Data Decrescente e RGN
  const sortedData = [...reportData.data].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.rgn.localeCompare(a.rgn, undefined, { numeric: true });
  });

  const rows = sortedData.map((item) => ({
    rgdn: `${item.rgd || ""} ${item.rgn || ""}`.trim() || "---",
    animalName: item.animalName || "---",
    vaccineName: item.vaccineName,
    date: item.date,
    observations: item.observations || "---",
  }));

  // 3. Geração da Tabela
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    columns: columns,
    body: rows,
    columnStyles: {
      rgdn: { cellWidth: 35 },
      vaccineName: { cellWidth: 60 },
      date: { cellWidth: 30 },
      observations: { cellWidth: "auto" },
    },
  });

  // 4. Aplicação de Branding
  drawHeader(doc, brandingOptions);
  drawFooter(doc);

  // 5. Salvar
  const filename = `relatorio-sanitario-${reportData.farmName
    .toLowerCase()
    .replace(/\s+/g, "-")}.pdf`;
  doc.save(filename);
};
