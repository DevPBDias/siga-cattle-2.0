import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import { Animal } from "@/types/animal.type";
import { SelectedReportFields } from "@/types/report_field.type";
import { fieldMap } from "@/constants/dynamicFields";
import { Farm } from "@/types/farm.type";
import { saveBlobAsFile } from "./saveBlobFile";
import { getTenantBranding } from "@/lib/branding/get-tenant-branding";
import { formatDate, getTodayFormatted } from "@/utils/dates";

const LAYOUT = {
  unit: "mm" as const,
  format: "a4" as const,
  orientation: "landscape" as const,
  margins: { top: 50, bottom: 12, left: 10, right: 10 },
  colors: {
    headerText: [0, 0, 0] as [number, number, number],
    textDarkBlue: [17, 98, 174] as [number, number, number],
    textWhite: [255, 255, 255] as [number, number, number],
    titleRed: [180, 0, 0] as [number, number, number],
    lineGray: [180, 180, 180] as [number, number, number],
    lineRed: [180, 0, 0] as [number, number, number],
    textGray: [80, 80, 80] as [number, number, number],
    textBlack: [0, 0, 0] as [number, number, number],
    stripeGray: [248, 248, 248] as [number, number, number],
    primaryBlue: [17, 98, 174] as [number, number, number],
  },
  fonts: {
    base: "helvetica",
    bold: "bold",
    normal: "normal",
  },
  sizes: {
    headerDept: 10,
    headerOrg: 11,
    headerService: 10,
    title: 12,
    infoLabel: 9,
    infoValue: 9,
    tableHeader: 8,
    tableBody: 8,
    footer: 7.5,
  },
};

function drawTenantLogo(doc: jsPDF, x: number, y: number, branding: ReturnType<typeof getTenantBranding>): void {
  try {
    const initials = branding.farmName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    doc.setFillColor(255, 255, 255, 0.2);
    doc.roundedRect(x, y, 36, 12, 1.5, 1.5, "F");
    doc.setDrawColor(...branding.secondaryRgb);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, 36, 12, 1.5, 1.5, "D");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(initials, x + 3, y + 8);

    doc.setFontSize(5.5);
    doc.setTextColor(...branding.secondaryRgb);
    doc.text(branding.tenant.badgeText ?? "SIGA", x + 12, y + 5.5);
    doc.setFontSize(5);
    doc.setTextColor(255, 255, 255);
    doc.text("CATTLE", x + 12, y + 9.5);
  } catch (error) {
    console.error("Erro ao carregar logo no PDF:", error);
  }
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

export async function generateAnimalReportPDFPixelPerfect(
  data: Animal[],
  selectedFields: SelectedReportFields,
  farms: Farm[] = []
): Promise<{
  success: boolean;
  method: "share" | "save-picker" | "download";
} | null> {
  if (!data || data.length === 0) return null;

  const branding = getTenantBranding();

  // 1. Ordenação obrigatória por RGN decrescente
  const sortedData = [...data].sort((a, b) => {
    const rgnA = parseInt(a.rgn || "0", 10);
    const rgnB = parseInt(b.rgn || "0", 10);
    return rgnB - rgnA;
  });

  const doc = new jsPDF({
    orientation: LAYOUT.orientation,
    unit: LAYOUT.unit,
    format: LAYOUT.format,
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.width;
  const centerX = pageWidth / 2;
  const margins = LAYOUT.margins;

  const renderInstitutionalHeader = (doc: jsPDF, pageNumber: number) => {
    // Background do Header na cor da fazenda
    doc.setFillColor(...branding.primaryRgb);
    doc.rect(0, 0, pageWidth, 21, "F");

    // Linha dourada de acento
    doc.setFillColor(...branding.secondaryRgb);
    doc.rect(0, 20.4, pageWidth, 0.6, "F");

    // Logo
    drawTenantLogo(doc, margins.left, 4.5, branding);

    // Cabeçalho Centralizado
    doc.setTextColor(...LAYOUT.colors.textWhite);
    doc.setFont(LAYOUT.fonts.base, "bold");

    doc.setFontSize(LAYOUT.sizes.headerDept);
    doc.text(`SISTEMA DE GESTÃO PECUÁRIA - ${branding.farmName.toUpperCase()}`, centerX, 9, {
      align: "center",
    });

    doc.setFontSize(LAYOUT.sizes.headerOrg);
    doc.text("RELATÓRIO DE ACOMPANHAMENTO ANIMAL", centerX, 14, {
      align: "center",
    });

    // Blocos Informativos (Simulando dados da primeira entrada ou placeholders)
    doc.setTextColor(...LAYOUT.colors.textBlack);
    doc.setFontSize(LAYOUT.sizes.infoLabel);

    const startInfoY = 27;

    // Criador - Alinhado à esquerda
    doc.setFont(LAYOUT.fonts.base, "normal");
    doc.text("Sistema:", margins.left, startInfoY);
    const criadorLabelWidth = doc.getTextWidth("Sistema: ");
    doc.setFont(LAYOUT.fonts.base, "bold");
    doc.text(
      "SIGA CATTLE",
      margins.left + criadorLabelWidth + 1,
      startInfoY
    );

    // Fazenda - Alinhado ao centro
    const fazendaLabel = "Fazenda: ";
    const fazendaValue = branding.farmName.toUpperCase();
    doc.setFont(LAYOUT.fonts.base, "normal");
    const fazendaLabelWidth = doc.getTextWidth(fazendaLabel);
    const fazendaValueWidth = doc.getTextWidth(fazendaValue);
    const totalFazendaWidth = fazendaLabelWidth + fazendaValueWidth;

    doc.text(fazendaLabel, centerX - totalFazendaWidth / 2, startInfoY);
    doc.setFont(LAYOUT.fonts.base, "bold");
    doc.text(
      fazendaValue,
      centerX - totalFazendaWidth / 2 + fazendaLabelWidth,
      startInfoY
    );

    // Raça - Alinhado à direita
    const racaLabel = "Raça: ";
    const racaValue = "NELORE";
    doc.setFont(LAYOUT.fonts.base, "normal");
    const racaLabelWidth = doc.getTextWidth(racaLabel);
    const racaValueWidth = doc.getTextWidth(racaValue);
    const totalRacaWidth = racaLabelWidth + racaValueWidth;

    doc.text(racaLabel, pageWidth - margins.right - totalRacaWidth, startInfoY);
    doc.setFont(LAYOUT.fonts.base, "bold");
    doc.text(racaValue, pageWidth - margins.right - racaValueWidth, startInfoY);

    // Linha Divisória Tabela
    doc.setDrawColor(...LAYOUT.colors.lineGray);
    doc.line(margins.left, 30, pageWidth - margins.right, 30);
  };

  // 1. Colunas Fixas (RGD / RGN sempre primeiro, Sexo segundo)
  const allColumns: { header: string; key: string }[] = [];
  allColumns.push({ header: "RGD / RGN", key: "rgd_rgn" });
  allColumns.push({ header: "Sexo", key: "sex" });

  // 2. Colunas Dinâmicas (campos selecionados no UI, excluindo sex que já é fixo)
  const dynamicCols = Object.entries(fieldMap)
    .filter(
      ([key]) =>
        key !== "sex" && selectedFields[key as keyof SelectedReportFields]
    )
    .map(([key, config]) => ({
      header: config[0],
      key: key,
    }));

  allColumns.push(...dynamicCols);

  // 3. Mapeamento de Dados
  // Cria mapa de fazendas para busca rápida por ID
  const farmMap = new Map(farms.map((farm) => [farm.id, farm.farm_name]));

  const tableBody: any[] = sortedData.map((animal) => {
    const rowData: any = {};

    // Conteúdo fixo principal
    rowData["rgd_rgn"] = `${animal.serie_rgd || ""} ${animal.rgn || ""}`.trim();

    // Conteúdo restante
    Object.keys(fieldMap).forEach((key) => {
      // Preenche apenas se estiver nas colunas que serão exibidas
      if (selectedFields[key as keyof SelectedReportFields] || key === "sex") {
        let val = animal[key as keyof Animal];

        // Formatações específicas para manter fidelidade
        if (key === "born_date") val = formatDate(val as string);
        if (key === "sex") val = val === "M" ? "M" : val === "F" ? "F" : val;

        // Converte farm_id para o nome da fazenda
        if (key === "farm_name" && animal.farm_id) {
          val = farmMap.get(animal.farm_id) || "";
        }

        rowData[key] = formatValue(val);
      }
    });

    return rowData;
  });

  // 4. Fluxo de Geração com 16 linhas fixas por página
  const rowsPerPage = 16;
  const chunks: any[][] = [];
  for (let i = 0; i < tableBody.length; i += rowsPerPage) {
    const chunk = tableBody.slice(i, i + rowsPerPage);
    // Preenche com linhas vazias se for a última página e tiver menos de 15 registros
    while (chunk.length < rowsPerPage) {
      const emptyRow: any = {};
      allColumns.forEach((col) => (emptyRow[col.key] = ""));
      chunk.push(emptyRow);
    }
    chunks.push(chunk);
  }

  chunks.forEach((chunk, chunkIndex) => {
    // Adiciona nova página para todos os chunks exceto o primeiro
    if (chunkIndex > 0) {
      doc.addPage();
    }

    autoTable(doc, {
      startY: 35,
      head: [allColumns.map((c) => c.header)],
      body: chunk.map((row) => allColumns.map((c) => row[c.key])),
      columnStyles: allColumns.reduce((acc: any, col, idx) => {
        // Define larguras específicas baseadas no cabeçalho ou chave
        let width = 25; // default
        let fontStyle = "normal"; // Valor padrão para as células (não-headers)

        if (col.key === "rgd_rgn") {
          width = 22;
        }
        if (col.key === "sex") {
          width = 10;
        }
        if (
          col.key === "father_name" ||
          col.key === "maternal_grandfather_name" ||
          col.key === "paternal_grandfather_name"
        ) {
          acc[idx] = {
            halign: "center",
            cellWidth: col.key === "father_name" ? 45 : 40,
            fontStyle: "normal",
            fontSize: 7, // Fonte menor para colunas de genealogia
          };
        } else {
          acc[idx] = {
            halign: "center",
            cellWidth: width,
            fontStyle: fontStyle,
          };
        }
        return acc;
      }, {}),
      didParseCell: (data) => {
        if (data.section === "body") {
          const cell = data.cell;
          const colWidth = data.column.width || cell.width;

          if (colWidth > 0) {
            const padding = cell.padding("left") + cell.padding("right");
            const availableWidth = colWidth - padding;

            const rawText = Array.isArray(cell.text)
              ? cell.text.join(" ")
              : String(cell.text);
            const lines = data.doc.splitTextToSize(rawText, availableWidth);

            if (lines.length > 2) {
              let secondLine = lines[1];
              if (secondLine.length > 3) {
                secondLine =
                  secondLine.substring(0, secondLine.length - 3) + "...";
              } else if (secondLine.length > 0) {
                secondLine = secondLine + "...";
              }
              cell.text = [lines[0], secondLine];
            }
          }
        }
      },
      styles: {
        font: LAYOUT.fonts.base,
        fontSize: LAYOUT.sizes.tableBody,
        cellPadding: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
        textColor: LAYOUT.colors.textBlack,
        lineWidth: 0,
        valign: "middle",
        minCellHeight: 9.3, // Altura fixa para acomodar precisamente 2 linhas
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: LAYOUT.colors.textBlack,
        fontStyle: "bold",
        halign: "center",
        lineWidth: { top: 0, bottom: 0.1, left: 0, right: 0 },
        lineColor: LAYOUT.colors.lineGray,
      },
      alternateRowStyles: {
        fillColor: LAYOUT.colors.stripeGray,
      },
      margin: LAYOUT.margins,
      showHead: "everyPage",
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        renderInstitutionalHeader(doc, pageCount);

        // Footer
        const footerY = doc.internal.pageSize.height - 8;
        doc.setFontSize(LAYOUT.sizes.footer);
        doc.setFont(LAYOUT.fonts.base, "normal");
        doc.setTextColor(...LAYOUT.colors.textGray);

        const now = getTodayFormatted();

        doc.text(
          `Siga Cattle - ${branding.farmName} - Impresso em: ${now}`,
          margins.left,
          footerY
        );
        doc.text(`Página ${pageCount}`, pageWidth - margins.right, footerY, {
          align: "right",
        });
      },
    });
  });

  const pdfBlob = doc.output("blob");
  const fileName = `relatorio_${branding.tenant.id}_${Date.now()}.pdf`;

  return await saveBlobAsFile(pdfBlob, fileName);
}

export default generateAnimalReportPDFPixelPerfect;
