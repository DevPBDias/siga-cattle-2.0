import { SemenDose } from "@/types/semen_dose.type";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveBlobAsFile } from "./saveBlobFile";
import { SelectedDoseReportFields } from "@/types/dose_report_field.type";
import { formatDateTime } from "@/utils/dates";

const doseFieldMap: Record<
  keyof SelectedDoseReportFields,
  [string, keyof SemenDose]
> = {
  animal_name: ["Nome Animal", "animal_name"],
  breed: ["Raça", "breed"],
  quantity: ["Quantidade", "quantity"],
  father_name: ["Pai", "father_name"],
  maternal_grandfather_name: ["Avô Materno", "maternal_grandfather_name"],
  iabcz: ["iABCZ", "iabcz"],
  registration: ["Registro", "registration"],
  center_name: ["Central", "center_name"],
};

export async function generateDoseReportPDF(
  data: SemenDose[],
  selectedFields: SelectedDoseReportFields
): Promise<{
  success: boolean;
  method: "share" | "save-picker" | "download";
} | null> {
  if (!data || data.length === 0) {
    alert("Nenhum dado disponível para gerar o relatório!");
    return null;
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm" });

  const primaryColor: [number, number, number] = [17, 98, 174]; // #1162ae
  const lightGray: [number, number, number] = [245, 245, 245];
  const darkGray: [number, number, number] = [60, 60, 60];
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Header compacto
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 22, "F");
  
  // Linha decorativa
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 21, pageWidth, 1, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE DOSES DE SÊMEN", pageWidth / 2, 9, {
    align: "center",
  });
  
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  const dateStr = formatDateTime(new Date());
  doc.text(`Gerado em: ${dateStr}`, pageWidth / 2, 15, {
    align: "center",
  });
  
  // Informações adicionais no header
  doc.setFontSize(7);
  doc.setTextColor(200, 200, 200);
  const totalDoses = data.reduce((sum, dose) => sum + dose.quantity, 0);
  doc.text(
    `Total: ${data.length} animal${data.length !== 1 ? "is" : ""} | ${totalDoses} doses`,
    pageWidth / 2,
    19,
    { align: "center" }
  );

  const columns = Object.entries(doseFieldMap)
    .filter(([key]) => selectedFields[key as keyof SelectedDoseReportFields])
    .map(([, [header, key]]) => ({ header, key }));

  // Ordenar por raça e depois por nome
  const sortedData = [...data].sort((a, b) => {
    if (a.breed !== b.breed) {
      return a.breed.localeCompare(b.breed);
    }
    return a.animal_name.localeCompare(b.animal_name);
  });

  type DoseReportRow = {
    animal_name: string;
    breed: string;
    quantity: string;
    father_name: string;
    maternal_grandfather_name: string;
    iabcz: string;
    registration: string;
    center_name: string;
  };

  const body: DoseReportRow[] = sortedData.map((dose) => ({
    animal_name: dose.animal_name || "",
    breed: dose.breed || "",
    quantity: dose.quantity.toString(),
    father_name: dose.father_name || "",
    maternal_grandfather_name: dose.maternal_grandfather_name || "",
    iabcz: dose.iabcz || "",
    registration: dose.registration || "",
    center_name: dose.center_name || "",
  }));

  // Calcular larguras das colunas
  const columnWidths = columns.map((col) => {
    const headerLength = col.header.length;
    const maxContentLength = Math.max(
      headerLength,
      ...body.map((row) => {
        const value = String(row[col.key as keyof DoseReportRow] || "");
        return value.length;
      })
    );
    
    // Larguras ajustadas por tipo de campo
    if (col.key === "animal_name") {
      return Math.max(25, Math.min(35, maxContentLength * 1.2));
    } else if (col.key === "breed") {
      return 20;
    } else if (col.key === "quantity") {
      return 15;
    } else if (col.key === "father_name" || col.key === "maternal_grandfather_name") {
      return Math.max(28, Math.min(38, maxContentLength * 1.0));
    } else if (col.key === "iabcz" || col.key === "registration") {
      return 18;
    } else if (col.key === "center_name") {
      return 25;
    } else {
      return Math.max(15, Math.min(28, maxContentLength * 1.3));
    }
  });

  // Função para truncar texto longo
  const truncateText = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) return text;
    if (maxLength < 10) return text.substring(0, maxLength - 1) + ".";
    return text.substring(0, maxLength - 3) + "...";
  };

  autoTable(doc, {
    startY: 35,
    head: [columns.map((col) => col.header)],
    body: body.map((row) =>
      columns.map((col, colIndex) => {
        const value = row[col.key as keyof DoseReportRow] || "";
        const maxChars = Math.floor(columnWidths[colIndex] / 1.2);
        return truncateText(String(value), maxChars);
      })
    ),
    theme: "striped",
    styles: {
      fontSize: 7,
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      valign: "middle",
      halign: "left",
      textColor: darkGray,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
      overflow: "linebreak",
      cellWidth: "wrap",
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 7.5,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: darkGray,
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
    margin: { top: 35, left: 5, right: 5, bottom: 18 },
    tableWidth: "auto",
    columnStyles: columns.reduce((acc, col, index) => {
      acc[index] = {
        cellWidth: columnWidths[index],
        halign: col.key === "quantity" || col.key === "iabcz" || col.key === "registration"
          ? "center" 
          : "left",
        valign: "middle",
      };
      return acc;
    }, {} as Record<number, any>),
    didDrawPage: (data) => {
      if (data.cursor) {
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.3);
        doc.line(5, data.cursor.y, pageWidth - 5, data.cursor.y);
      }
    },
    rowPageBreak: "avoid",
  });

  // Footer compacto em todas as páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Linha separadora do footer
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.15);
    doc.line(5, pageHeight - 12, pageWidth - 5, pageHeight - 12);
    
    // Número da página
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    );
    
    // Total no canto esquerdo
    doc.text(
      `Total: ${data.length} animal${data.length !== 1 ? "is" : ""} | ${totalDoses} doses`,
      7,
      pageHeight - 6
    );
    
    // Data no canto direito
    doc.text(
      dateStr,
      pageWidth - 7,
      pageHeight - 6,
      { align: "right" }
    );
  }

  const pdfBlob = doc.output("blob");
  const fileName = `relatorio_doses_semen_${Date.now()}.pdf`;

  return await saveBlobAsFile(pdfBlob, fileName, {
    shareTitle: "📊 Relatório de Doses de Sêmen",
    shareText: `Relatório com ${data.length} animais e ${totalDoses} doses - INDI Ouro`,
  });
}

