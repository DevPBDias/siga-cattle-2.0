import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ReproductionReportData } from "../types";
import { DEFAULT_TABLE_STYLES } from "../core/base-styles";
import { drawHeader, drawFooter } from "../core/branding-utils";

export const generateReproductionPDF = async (
  reportData: ReproductionReportData
) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a3",
  });

  const brandingOptions = {
    reportName: "RELATÓRIO DE EVENTOS DE REPRODUÇÃO",
    farmName: reportData.farmName,
    gender: reportData.data.length === 1 ? "Fêmea" : "Fêmeas",
    systemName: reportData.systemName,
    reportDate: reportData.reportDate,
    totalItems: reportData.data.length,
  };

  // Fixed Columns based on requested layout
  const columns = [
    { header: "rgn", dataKey: "rgn" },
    { header: "fazenda", dataKey: "farmName" },
    { header: "idade", dataKey: "idade" },
    { header: "classe", dataKey: "classification" },
    { header: "tipo de evento", dataKey: "event_type" },
    { header: "status produtivo", dataKey: "productive_status" },
    { header: "ecc", dataKey: "body_score" },
    { header: "tam. ovário", dataKey: "ovary_size" },
    { header: "estrut. ovário", dataKey: "ovary_structure" },
    { header: "ciclo", dataKey: "cycle_stage" },
    { header: "protocolo", dataKey: "protocol_name" },
    { header: "d0", dataKey: "d0" },
    { header: "d8/d9", dataKey: "d8" },
    { header: "d10/d11", dataKey: "d10" },
    { header: "touro", dataKey: "touro" },
    { header: "resync d0 (d22/d23)", dataKey: "resync_d0" },
    { header: "resync d8 (d30/d32)", dataKey: "resync_d8" },
    { header: "dg30", dataKey: "dg30s" },
    { header: "resync d10 (d32/d34)", dataKey: "resync_d10" },
    { header: "touro resync", dataKey: "touro_resync" },
  ];

  // Sorting: RGN Ascending
  const sortedData = [...reportData.data].sort((a, b) => {
    return a.rgn.localeCompare(b.rgn, undefined, { numeric: true });
  });

  // Data Mapping
  const rows = sortedData.map((item) => {
    const row: {
      rgn: string;
      farmName?: string;
    } = {
      rgn: item.rgn || "---",
    };

    // Adiciona farmName se showFarmColumn estiver ativo
    if (reportData.showFarmColumn && item.farmName) {
      row.farmName = item.farmName;
    }

    return {
      ...row,
      idade: item.idade || "---",
      classification: item.classification || "---",
      event_type: item.event_type?.toUpperCase() || "---",
      productive_status: item.productive_status?.toUpperCase() || "---",
      body_score: item.body_score || "---",
      ovary_size: item.ovary_size?.toUpperCase() || "---",
      ovary_structure: item.ovary_structure?.toUpperCase() || "---",
      cycle_stage: item.cycle_stage || "---",
      protocol_name: item.protocol_name?.toUpperCase() || "---",
      touro: item.bull_name?.toUpperCase() || "---",
      d0: item.d0_date || "---",
      d8: item.d8_date || "---",
      d10: item.d10_date || "---",
      touro_resync: item.resync_bull?.toUpperCase() || "---",
      resync_d0: item.resync_d0 || "---",
      resync_d8: item.resync_d8 || "---",
      dg30s: item.diagnostic_d30?.toUpperCase() || "---",
      resync_d10: item.resync_d10 || "---",
    };
  });

  // 3. Table Generation
  autoTable(doc, {
    ...DEFAULT_TABLE_STYLES,
    columns: columns,
    body: rows,
    columnStyles: {
      rgn: { cellWidth: 10 },
      farmName: { cellWidth: 20 },
      idade: { cellWidth: 15 },
      classification: { cellWidth: 18 },
      event_type: { cellWidth: 18 },
      productive_status: { cellWidth: 25 },
      body_score: { cellWidth: 10 },
      ovary_size: { cellWidth: 20 },
      ovary_structure: { cellWidth: 25 },
      cycle_stage: { cellWidth: 16 },
      protocol_name: { cellWidth: 24 },
      touro: { cellWidth: 35 },
      d0: { cellWidth: 21 },
      d8: { cellWidth: 21 },
      d10: { cellWidth: 21 },
      touro_resync: { cellWidth: 35 },
      resync_d0: { cellWidth: 21 },
      resync_d8: { cellWidth: 21 },
      dg30s: { cellWidth: 15 },
      resync_d10: { cellWidth: 23 },
    },
    styles: {
      ...DEFAULT_TABLE_STYLES.styles,
      fontSize: 7.5,
    },
    didParseCell: (data) => {
      if (data.section === "head") {
        data.cell.text = data.cell.text.map((t) => t.toUpperCase());
      }
    },
  });

  // 4. Branding (Header/Footer on all pages)
  drawHeader(doc, brandingOptions);
  drawFooter(doc);

  // 5. Save/Download
  const filename = `relatorio-reproducao-${reportData.farmName
    .toLowerCase()
    .replace(/\s+/g, "-")}.pdf`;
  doc.save(filename);
};
