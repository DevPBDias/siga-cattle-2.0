import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DEFAULT_TABLE_STYLES } from "@/lib/pdf/core/base-styles";
import { drawFooter, drawHeader } from "@/lib/pdf/core/branding-utils";
import { WeaningRecord } from "@/types/weaning_record.type";
import { formatDate } from "@/utils/dates";

export interface WeaningReportData {
  farmName: string;
  periodLabel?: string;
  yearFilter?: string;
  reportDate: string;
  systemName: string;
  data: (WeaningRecord & { breed: string; sex: string })[];
}

export async function generateWeaningReportPDF(report: WeaningReportData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
  const period = report.periodLabel
    ? ` - ${report.periodLabel}`
    : report.yearFilter ? ` - ANO ${report.yearFilter}` : "";
  const branding = {
    reportName: `RELATÓRIO DE DESMAMAS${period}`,
    farmName: report.farmName,
    gender: "Ambos",
    systemName: report.systemName,
    reportDate: report.reportDate,
    totalItems: report.data.length,
  };

  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    columns: [
      { header: "DATA DESMAMA", dataKey: "weaning_date" },
      { header: "RGN BEZERRO", dataKey: "animal_rgn" },
      { header: "RGN MÃE", dataKey: "mother_rgn" },
      { header: "RAÇA", dataKey: "breed" },
      { header: "SEXO", dataKey: "sex" },
      { header: "IDADE (DIAS)", dataKey: "age_days" },
      { header: "PESO BEZERRO", dataKey: "calf_weight" },
      { header: "PESO AJUSTADO 210D", dataKey: "adjusted_weight" },
      { header: "CLASSE VISUAL", dataKey: "visual_class" },
      { header: "PESO MÃE", dataKey: "mother_weight" },
      { header: "EFICIÊNCIA (%)", dataKey: "efficiency" },
    ],
    body: report.data.map((record) => ({
      ...record,
      weaning_date: formatDate(record.weaning_date),
      age_days: `${record.age_days} dias`,
      breed: record.breed || "---",
      sex: record.sex || "---",
      calf_weight: `${record.calf_weight_kg.toFixed(1)} kg`,
      adjusted_weight: `${record.adjusted_weight_210_kg.toFixed(1)} kg`,
      mother_weight: `${record.mother_weight_kg.toFixed(1)} kg`,
      efficiency: `${record.efficiency_percent.toFixed(2)}%`,
    })),
    styles: { ...DEFAULT_TABLE_STYLES.styles, fontSize: 8 },
    didParseCell: (cell) => {
      if (cell.section === "head") cell.cell.text = cell.cell.text.map((text) => text.toUpperCase());
    },
  });

  await drawHeader(doc, branding);
  drawFooter(doc);
  const farmSlug = (report.farmName || "todas").toLowerCase().replace(/\s+/g, "-");
  const suffix = report.yearFilter ? `-${report.yearFilter}` : "";
  doc.save(`relatorio-desmamas-${farmSlug}${suffix}.pdf`);
}
