import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { SemenDoseReportData } from "../types";
import { DEFAULT_TABLE_STYLES } from "../core/base-styles";
import { drawHeader, drawFooter } from "../core/branding-utils";
import { todayISO } from "@/utils/dates";

export const generateSemenDosePDF = async (reportData: SemenDoseReportData) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a3",
  });

  const brandingOptions = {
    reportName: "RELATÓRIO DE ESTOQUE DE SÊMEN",
    farmName: reportData.farmName,
    gender: "Ambos",
    systemName: reportData.systemName,
    reportDate: reportData.reportDate,
    totalItems: reportData.totalItems,
  };

  // 1. Preparação de Dados e Colunas
  const columns = [
    { header: "ANIMAL", dataKey: "animal_name" },
    { header: "RAÇA", dataKey: "breed" },
    { header: "QTDE", dataKey: "quantity" },
    { header: "PAI", dataKey: "father_name" },
    { header: "AVÔ MATERNO", dataKey: "maternal_grandfather_name" },
    { header: "iABCZ", dataKey: "iabcz" },
    { header: "REGISTRO", dataKey: "registration" },
    { header: "CENTRAL", dataKey: "center_name" },
  ];

  // 2. Geração da Tabela
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    columns: columns,
    body: reportData.data, // Data is already prepared/uppercased in the definition
    columnStyles: {
      animal_name: { cellWidth: 50 },
      breed: { cellWidth: 35 },
      quantity: { cellWidth: 20 },
      father_name: { cellWidth: 35 },
      maternal_grandfather_name: { cellWidth: 35 },
      iabcz: { cellWidth: 20 },
      registration: { cellWidth: 25 },
      center_name: { cellWidth: "auto" },
    },
  });

  // 3. Aplicação de Branding
  drawHeader(doc, brandingOptions);
  drawFooter(doc);

  // 4. Download
  const filename = `estoque-semen-${todayISO()}.pdf`;
  doc.save(filename);
};
