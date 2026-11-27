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
    { header: "DATA NASC", dataKey: "birth_date" },
    { header: "DATA IA", dataKey: "ia_date" },
    { header: "DIAS GESTAÇÃO", dataKey: "gestation_days" },
    { header: "SEXO", dataKey: "sex" },
    { header: "COR", dataKey: "color" },
    { header: "PESO", dataKey: "weight" },
    { header: "MATRIZ", dataKey: "mother" },
  ];

  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    columns,
    body: reportData.data,
    columnStyles: {
      birth_date: { cellWidth: 35 },
      ia_date: { cellWidth: 35 },
      gestation_days: { cellWidth: 35 },
      sex: { cellWidth: 30 },
      color: { cellWidth: 30 },
      weight: { cellWidth: 30 },
      mother: { cellWidth: 45 },
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
