import { Animal } from "@/types/animal.type";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveBlobAsFile } from "./saveBlobFile";
import { SelectedReportFields } from "@/types/report_field.type";
import { fieldMap } from "@/constants/dynamicFields";
import { getDatabase } from "@/db/client";
import { AnimalMetric } from "@/types/animal_metrics.type";
import { AnimalVaccine } from "@/types/vaccine.type";
import { formatDate, formatDateTime } from "@/utils/dates";

export async function generateAnimalReportPDF(
  data: Animal[],
  selectedFields: SelectedReportFields
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
  doc.text("RELATÓRIO DE ANIMAIS", pageWidth / 2, 9, {
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
  doc.text(
    `Total: ${data.length} animal${data.length !== 1 ? "is" : ""}`,
    pageWidth / 2,
    19,
    { align: "center" }
  );

  const columns = Object.entries(fieldMap)
    .filter(([key]) => selectedFields[key as keyof SelectedReportFields])
    .map(([, [header, key]]) => ({ header, key }));

  const sortedData = [...data].sort((a, b) => {
    const rgnA = parseInt(a.rgn || "0", 10);
    const rgnB = parseInt(b.rgn || "0", 10);
    return rgnB - rgnA;
  });

  // Buscar dados relacionados do banco
  let weightsMap: Map<string, AnimalMetric[]> = new Map();
  let ceMap: Map<string, AnimalMetric[]> = new Map();
  let vaccinesMap: Map<string, AnimalVaccine[]> = new Map();
  let vaccineNamesMap: Map<string, string> = new Map();

  try {
    const db = await getDatabase();
    if (db) {
      // Buscar pesos
      if (selectedFields.animal_metrics_weight || selectedFields.daily_gain) {
        const weights = await db.animal_metrics_weight
          .find({ selector: { _deleted: { $eq: false } } })
          .exec();
        weights.forEach((w) => {
          const rgn = w.rgn;
          if (!weightsMap.has(rgn)) weightsMap.set(rgn, []);
          weightsMap.get(rgn)!.push(w.toJSON() as AnimalMetric);
        });
      }

      // Buscar circunferências
      if (selectedFields.animal_metrics_ce) {
        const ceMetrics = await db.animal_metrics_ce
          .find({ selector: { _deleted: { $eq: false } } })
          .exec();
        ceMetrics.forEach((ce) => {
          const rgn = ce.rgn;
          if (!ceMap.has(rgn)) ceMap.set(rgn, []);
          ceMap.get(rgn)!.push(ce.toJSON() as AnimalMetric);
        });
      }

      // Buscar vacinas e criar mapa de nomes
      if (selectedFields.vaccines) {
        // Buscar todas as vacinas para mapear IDs para nomes
        const allVaccines = await db.vaccines
          .find({ selector: { _deleted: { $eq: false } } })
          .exec();
        allVaccines.forEach((v) => {
          vaccineNamesMap.set(v.id, v.vaccine_name);
        });

        // Buscar vacinas dos animais
        const animalVaccines = await db.animal_vaccines
          .find({ selector: { _deleted: { $eq: false } } })
          .exec();
        animalVaccines.forEach((v) => {
          const rgn = v.rgn;
          if (!vaccinesMap.has(rgn)) vaccinesMap.set(rgn, []);
          vaccinesMap.get(rgn)!.push(v.toJSON() as AnimalVaccine);
        });
      }
    }
  } catch (error) {
    console.warn("Erro ao buscar dados relacionados:", error);
  }

  type ReportRow = {
    name: string;
    rgn: string;
    serie_rgd: string;
    sex: string;
    born_date: string;
    born_color: string;
    iabcgz: string;
    deca: string;
    p: string;
    f: string;
    father_name: string;
    mother_serie_rgd: string;
    mother_rgn: string;
    maternal_grandfather_name: string;
    paternal_grandfather_name: string;
    partnership: string;
    animal_metrics_weight: string;
    vaccines: string;
    animal_metrics_ce: string;
    status: string;
    farm_id: string;
    daily_gain: string;
    classification: string;
    type: string;
    genotyping: string;
    condition: string;
  };


  const formatWeight = (value?: number) =>
    value ? `${value.toFixed(1)} kg` : "";

  const formatCE = (value?: number) =>
    value ? `${value.toFixed(1)} cm` : "";

  // Calcular GMD (Ganho Médio Diário)
  const calculateGMD = (weights: AnimalMetric[]): string => {
    if (weights.length < 2) return "";
    const sorted = [...weights].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const daysDiff =
      (new Date(last.date).getTime() - new Date(first.date).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysDiff <= 0) return "";
    const gain = last.value - first.value;
    const gmd = gain / daysDiff;
    return `${gmd.toFixed(2)} kg/dia`;
  };

  const body: ReportRow[] = sortedData.map((animal) => {
    const nome =
      animal.name?.trim() ||
      `${animal.serie_rgd || ""} ${animal.rgn || ""}`.trim();

    const animalWeights = weightsMap.get(animal.rgn) || [];
    const animalCE = ceMap.get(animal.rgn) || [];
    const animalVaccines = vaccinesMap.get(animal.rgn) || [];

    // Formatar pesos (últimos 3 ou todos se menos de 3)
    const weightsStr =
      animalWeights.length > 0
        ? animalWeights
            .slice(0, 3)
            .map((w) => `${formatWeight(w.value)} (${formatDate(w.date)})`)
            .join("; ")
        : "";

    // Formatar CE (últimos 3 ou todos se menos de 3)
    const ceStr =
      animalCE.length > 0
        ? animalCE
            .slice(0, 3)
            .map((ce) => `${formatCE(ce.value)} (${formatDate(ce.date)})`)
            .join("; ")
        : "";

    // Formatar vacinas (últimas 5 ou todas se menos de 5)
    const vaccinesStr =
      animalVaccines.length > 0
        ? animalVaccines
            .slice(0, 5)
            .map((v) => {
              const vaccineName = vaccineNamesMap.get(v.vaccine_id) || "Vacina";
              return `${vaccineName} (${formatDate(v.date)})`;
            })
            .join("; ")
        : "";

    return {
      name: nome || "",
      rgn: animal.rgn || "",
      serie_rgd: animal.serie_rgd || "",
      sex: animal.sex === "M" ? "M" : animal.sex === "F" ? "F" : animal.sex || "",
      born_date: formatDate(animal.born_date),
      born_color: animal.born_color || "",
      iabcgz: animal.iabcgz || "",
      deca: animal.deca || "",
      p: animal.p || "",
      f: animal.f || "",
      father_name: animal.father_name || "",
      mother_serie_rgd: animal.mother_serie_rgd || "",
      mother_rgn: animal.mother_rgn || "",
      maternal_grandfather_name: animal.maternal_grandfather_name || "",
      paternal_grandfather_name: animal.paternal_grandfather_name || "",
      partnership: animal.partnership || "",
      animal_metrics_weight: weightsStr,
      vaccines: vaccinesStr,
      animal_metrics_ce: ceStr,
      status: typeof animal.status === "string" 
        ? animal.status 
        : (animal.status && typeof animal.status === "object" && "status_name" in animal.status)
          ? (animal.status as { status_name: string }).status_name
          : "",
      farm_id: animal.farm_id?.toString() || "",
      daily_gain: calculateGMD(animalWeights),
      classification: animal.classification || "",
      type: animal.type || "",
      genotyping: animal.genotyping || "",
      condition: animal.condition || "",
    };
  });

  // Calcular larguras das colunas baseado no conteúdo (otimizado para mais colunas)
  const columnWidths = columns.map((col, index) => {
    const headerLength = col.header.length;
    const maxContentLength = Math.max(
      headerLength,
      ...body.map((row) => {
        const value = String(row[col.key as keyof ReportRow] || "");
        // Para campos longos (pesos, vacinas, etc), considerar apenas primeira parte
        const displayLength = value.includes(";") 
          ? value.split(";")[0].length + 10 // Adiciona espaço para "..."
          : value.length;
        return displayLength;
      })
    );
    
    // Larguras ajustadas por tipo de campo
    if (col.key === "name" || col.key === "father_name" || col.key === "maternal_grandfather_name" || col.key === "paternal_grandfather_name") {
      return Math.max(25, Math.min(35, maxContentLength * 1.2));
    } else if (col.key === "animal_metrics_weight" || col.key === "animal_metrics_ce" || col.key === "vaccines") {
      return Math.max(30, Math.min(45, maxContentLength * 1.1));
    } else if (col.key === "rgn" || col.key === "serie_rgd" || col.key === "mother_rgn" || col.key === "mother_serie_rgd") {
      return Math.max(18, Math.min(25, maxContentLength * 1.5));
    } else if (col.key === "born_date") {
      return 22; // Mantido aumentado conforme solicitado
    } else {
      return Math.max(15, Math.min(28, maxContentLength * 1.3));
    }
  });

  // Função para truncar texto longo mantendo informações importantes
  const truncateText = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) return text;
    // Se tem múltiplos itens separados por ";", pega os primeiros e adiciona "..."
    if (text.includes(";")) {
      const parts = text.split(";");
      let result = "";
      let charCount = 0;
      for (const part of parts) {
        const partWithSeparator = part.trim() + "; ";
        if (charCount + partWithSeparator.length > maxLength - 5) {
          return result.trim() + (result ? "..." : "");
        }
        result += partWithSeparator;
        charCount += partWithSeparator.length;
      }
      return result.trim();
    }
    // Para textos simples, truncar de forma inteligente
    if (maxLength < 10) return text.substring(0, maxLength - 1) + ".";
    return text.substring(0, maxLength - 3) + "...";
  };

  autoTable(doc, {
    startY: 35,
    head: [columns.map((col) => col.header)],
    body: body.map((row) =>
      columns.map((col, colIndex) => {
        const value = row[col.key as keyof ReportRow] || "";
        const maxChars = Math.floor(columnWidths[colIndex] / 1.2); // Aproximação de caracteres por mm
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
        halign: col.key.includes("date") || col.key.includes("rgn") || col.key.includes("rgd") || col.key === "sex" || col.key === "deca" || col.key === "p" || col.key === "f"
          ? "center" 
          : "left",
        valign: "middle",
      };
      return acc;
    }, {} as Record<number, any>),
    didDrawPage: (data) => {
      // Adicionar linha separadora após o header em cada página
      if (data.cursor) {
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.3);
        doc.line(5, data.cursor.y, pageWidth - 5, data.cursor.y);
      }
    },
    // Evitar quebra de página no meio de uma linha
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
    
    // Total de animais no canto esquerdo
    doc.text(
      `Total: ${data.length}`,
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
  const fileName = `relatorio_animais_${Date.now()}.pdf`;

  return await saveBlobAsFile(pdfBlob, fileName, {
    shareTitle: "📊 Relatório de Animais",
    shareText: `Relatório com ${data.length} animais - INDI Ouro`,
  });
}
