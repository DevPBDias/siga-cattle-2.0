import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BirthForecastReportData } from "../types";
import { DEFAULT_TABLE_STYLES } from "../core/base-styles";
import { drawHeader, drawFooter } from "../core/branding-utils";

export const generateBirthForecastPDF = async (reportData: BirthForecastReportData) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });

  // Título do relatório: usa periodLabel se disponível, senão yearFilter
  const periodSuffix = reportData.periodLabel
    ? ` - ${reportData.periodLabel}`
    : reportData.yearFilter
    ? ` - ANO ${reportData.yearFilter}`
    : "";

  const brandingOptions = {
    reportName: `RELATÓRIO DE NASCIMENTOS${periodSuffix}`,
    farmName: reportData.farmName,
    gender: "Ambos",
    systemName: reportData.systemName || "INDI Ouro 2.0",
    reportDate: reportData.reportDate,
    totalItems: reportData.data.length,
  };

  const columns = [
    { header: "ANIMAL", dataKey: "animal" },
    { header: "SEXO", dataKey: "sex" },
    { header: "DATA NASCIMENTO", dataKey: "birth_date" },
    { header: "PESO", dataKey: "weight" },
    { header: "COR", dataKey: "color" },
    { header: "MÃE", dataKey: "mother" },
    { header: "FAZENDA", dataKey: "farm_name" },
    { header: "DATA REGISTRO", dataKey: "registration_date" },
    { header: "REGISTRADO POR", dataKey: "created_by" },
  ];

  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    columns,
    body: reportData.data,
    columnStyles: {
      animal: { cellWidth: 35 },
      sex: { cellWidth: 22 },
      birth_date: { cellWidth: 32 },
      weight: { cellWidth: 22 },
      color: { cellWidth: 28 },
      mother: { cellWidth: 33 },
      farm_name: { cellWidth: 42 },
      registration_date: { cellWidth: 32 },
      created_by: { cellWidth: 42 },
    },
    styles: { ...DEFAULT_TABLE_STYLES.styles, fontSize: 8 },
    didParseCell: (data) => {
      if (data.section === "head") data.cell.text = data.cell.text.map((text) => text.toUpperCase());
    },
  });

  await drawHeader(doc, brandingOptions);
  drawFooter(doc);

  const farmSlug = (reportData.farmName || "todas").toLowerCase().replace(/\s+/g, "-");
  const yearSuffix = reportData.yearFilter ? `-${reportData.yearFilter}` : "";
  doc.save(`relatorio-nascimentos-${farmSlug}${yearSuffix}.pdf`);
};
