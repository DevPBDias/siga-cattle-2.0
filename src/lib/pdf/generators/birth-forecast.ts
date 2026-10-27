import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BirthForecastReportData } from "../types";
import { DEFAULT_TABLE_STYLES } from "../core/base-styles";
import { drawHeader, drawFooter } from "../core/branding-utils";

export const generateBirthForecastPDF = async (reportData: BirthForecastReportData) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
  const brandingOptions = {
    reportName: `RELATÓRIO DE NASCIMENTOS${reportData.yearFilter ? ` - ANO ${reportData.yearFilter}` : ""}`,
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
      sex: { cellWidth: 25 },
      birth_date: { cellWidth: 35 },
      weight: { cellWidth: 25 },
      mother: { cellWidth: 35 },
      farm_name: { cellWidth: 45 },
      registration_date: { cellWidth: 35 },
      created_by: { cellWidth: 45 },
    },
    styles: { ...DEFAULT_TABLE_STYLES.styles, fontSize: 8 },
    didParseCell: (data) => {
      if (data.section === "head") data.cell.text = data.cell.text.map((text) => text.toUpperCase());
    },
  });
  drawHeader(doc, brandingOptions);
  drawFooter(doc);
  const farmSlug = (reportData.farmName || "todas").toLowerCase().replace(/\s+/g, "-");
  const yearSuffix = reportData.yearFilter ? `-${reportData.yearFilter}` : "";
  doc.save(`relatorio-nascimentos-${farmSlug}${yearSuffix}.pdf`);
};
