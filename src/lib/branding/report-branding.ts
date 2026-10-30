import { jsPDF } from "jspdf";
import { getTenantBranding, TenantBranding } from "./get-tenant-branding";
import { formatDate, getTodayFormatted } from "@/utils/dates";

export interface ReportHeaderOptions {
  reportName: string;
  farmName?: string;
  gender?: string;
  totalItems?: number;
  systemName?: string;
  reportDate?: string;
  subtitle?: string;
  tenantId?: string;
}

export interface ReportFooterOptions {
  customText?: string;
  tenantId?: string;
  showDate?: boolean;
}

const LAYOUT_CONFIG = {
  fonts: {
    base: "helvetica",
    bold: "bold",
    normal: "normal",
  },
  sizes: {
    headerOrg: 8,
    headerDept: 9.5,
    title: 12,
    infoLabel: 8.5,
    infoValue: 8.5,
    footer: 7.5,
  },
};

/**
 * Desenha o emblema institucional / logo no cabeçalho do documento jsPDF.
 */
function drawEmblemLogo(
  doc: jsPDF,
  x: number,
  y: number,
  branding: TenantBranding,
  width: number = 36,
  height: number = 14
): void {
  try {
    // Tenta renderizar um bloco institucional harmonioso com iniciais e anel
    const initials = branding.farmName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    // Fundo do emblema
    doc.setFillColor(255, 255, 255, 0.15);
    doc.roundedRect(x, y, width, height, 2, 2, "F");

    // Borda secundária (dourada ou accent)
    doc.setDrawColor(...branding.secondaryRgb);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, width, height, 2, 2, "D");

    // Iniciais da Fazenda
    doc.setTextColor(255, 255, 255);
    doc.setFont(LAYOUT_CONFIG.fonts.base, LAYOUT_CONFIG.fonts.bold);
    doc.setFontSize(8);
    doc.text(initials, x + 3.5, y + 8.5);

    // Texto de identificação
    doc.setFontSize(6);
    doc.setTextColor(...branding.secondaryRgb);
    doc.text(branding.tenant.badgeText ?? "SIGA", x + 12, y + 6);
    doc.setFontSize(5.5);
    doc.setTextColor(255, 255, 255);
    doc.text("CATTLE", x + 12, y + 10.5);
  } catch (error) {
    console.warn("Aviso ao desenhar logo no cabeçalho do PDF:", error);
  }
}

/**
 * Aplica o cabeçalho padronizado em todas as páginas do PDF com a identidade visual do cliente.
 */
export function addReportHeader(doc: jsPDF, options: ReportHeaderOptions): void {
  const branding = getTenantBranding(options.tenantId);
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  const marginLeft = 10;
  const marginRight = 10;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // 1. Barra superior colorida com a cor primária da fazenda
    doc.setFillColor(...branding.primaryRgb);
    doc.rect(0, 0, pageWidth, 23, "F");

    // Linha de acento sutil na base do cabeçalho
    doc.setFillColor(...branding.secondaryRgb);
    doc.rect(0, 22.4, pageWidth, 0.6, "F");

    // 2. Logo / Emblema da Fazenda
    drawEmblemLogo(doc, marginLeft, 4.5, branding);

    // 3. Título Centralizado do Relatório
    doc.setTextColor(255, 255, 255);
    doc.setFont(LAYOUT_CONFIG.fonts.base, LAYOUT_CONFIG.fonts.bold);

    doc.setFontSize(LAYOUT_CONFIG.sizes.title);
    doc.text(options.reportName.toUpperCase(), centerX, 9, {
      align: "center",
    });

    // 4. Nome da Fazenda e Identificação Siga Cattle
    doc.setFontSize(LAYOUT_CONFIG.sizes.headerDept);
    const farmDisplay = options.farmName && options.farmName !== "GERAL"
      ? `Fazenda: ${options.farmName.toUpperCase()}`
      : branding.farmName.toUpperCase();

    doc.text(farmDisplay, centerX, 14, {
      align: "center",
    });

    // 5. Linha de Quantidade / Categoria
    doc.setFontSize(LAYOUT_CONFIG.sizes.infoValue);

    let unitLabel = options.gender || "";
    if (unitLabel === "M") unitLabel = "machos";
    else if (unitLabel === "F") unitLabel = "fêmeas";
    else if (unitLabel === "Ambos" || unitLabel === "Machos e Fêmeas") {
      unitLabel = options.reportName.includes("SÊMEN") ? "touros" : "animais";
    } else if (unitLabel.toUpperCase().includes("IATF")) {
      unitLabel = options.totalItems === 1 ? "IATF" : "IATFs";
    } else {
      unitLabel = unitLabel.toLowerCase();
    }

    if (options.totalItems !== undefined) {
      doc.text(
        `Quantidade: ${options.totalItems} ${unitLabel}`,
        centerX,
        19,
        {
          align: "center",
        }
      );
    } else if (options.subtitle) {
      doc.text(options.subtitle, centerX, 19, { align: "center" });
    }

    // 6. Data de Emissão (canto direito)
    const reportDateStr = options.reportDate || getTodayFormatted();
    const isDescriptivePeriod =
      reportDateStr.toLowerCase().startsWith("todas") ||
      reportDateStr.toLowerCase().includes("datas selecionadas");

    const dateLabel = isDescriptivePeriod ? "" : "Data: ";
    doc.setFont(LAYOUT_CONFIG.fonts.base, LAYOUT_CONFIG.fonts.normal);
    const dateLabelWidth = dateLabel ? doc.getTextWidth(dateLabel) : 0;
    const dateValueWidth = doc.getTextWidth(reportDateStr);
    const totalDateWidth = dateLabelWidth + dateValueWidth;

    if (dateLabel) {
      doc.text(dateLabel, pageWidth - marginRight - totalDateWidth, 14);
    }
    doc.setFont(LAYOUT_CONFIG.fonts.base, LAYOUT_CONFIG.fonts.bold);
    doc.text(reportDateStr, pageWidth - marginRight - dateValueWidth, 14);

    // Sistema institucional (canto superior direito)
    doc.setFontSize(LAYOUT_CONFIG.sizes.headerOrg);
    doc.setFont(LAYOUT_CONFIG.fonts.base, LAYOUT_CONFIG.fonts.normal);
    doc.setTextColor(240, 240, 240);
    doc.text("SIGA CATTLE", pageWidth - marginRight, 8, { align: "right" });
  }
}

/**
 * Aplica o rodapé padronizado em todas as páginas do PDF com a identidade visual do cliente.
 */
export function addReportFooter(doc: jsPDF, options?: ReportFooterOptions): void {
  const branding = getTenantBranding(options?.tenantId);
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 10;
  const marginRight = 10;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont(LAYOUT_CONFIG.fonts.base, LAYOUT_CONFIG.fonts.normal);
    doc.setFontSize(LAYOUT_CONFIG.sizes.footer);
    doc.setTextColor(90, 90, 90);

    const footerY = pageHeight - 8;

    // Linha separadora do footer
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(marginLeft, footerY - 3, pageWidth - marginRight, footerY - 3);

    // Texto institucional dinâmico do cliente
    const defaultText = `Siga Cattle - ${branding.farmName} • Gestão Pecuária`;
    const footerText = options?.customText ?? defaultText;

    doc.text(footerText, marginLeft, footerY);

    // Numeração de páginas
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - marginRight, footerY, {
      align: "right",
    });
  }
}

/**
 * Gera capa institucional para relatórios que requerem capa.
 */
export function addReportCoverPage(doc: jsPDF, options: ReportHeaderOptions): void {
  const branding = getTenantBranding(options.tenantId);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  // Centro: Nome do Relatório na cor primária da fazenda
  doc.setFont(LAYOUT_CONFIG.fonts.base, LAYOUT_CONFIG.fonts.bold);
  doc.setFontSize(24);
  doc.setTextColor(...branding.primaryRgb);
  doc.text(options.reportName.toUpperCase(), centerX, pageHeight / 3, {
    align: "center",
  });

  doc.setFontSize(16);
  doc.setTextColor(80, 80, 80);
  doc.text(options.farmName || branding.farmName, centerX, pageHeight / 3 + 15, { align: "center" });

  doc.setFontSize(12);
  if (options.gender) {
    doc.setFont(LAYOUT_CONFIG.fonts.base, LAYOUT_CONFIG.fonts.normal);
    doc.text(`Filtro Sexo: ${options.gender}`, centerX, pageHeight / 2, {
      align: "center",
    });
  }

  if (options.totalItems !== undefined) {
    doc.setFont(LAYOUT_CONFIG.fonts.base, LAYOUT_CONFIG.fonts.normal);
    doc.text(
      `Total de Registros: ${options.totalItems}`,
      centerX,
      pageHeight / 2 + 10,
      { align: "center" }
    );
  }

  doc.setFont(LAYOUT_CONFIG.fonts.base, LAYOUT_CONFIG.fonts.normal);
  doc.setFontSize(10);
  const reportDateStr = options.reportDate || getTodayFormatted();
  doc.text(`Data de Emissão: ${reportDateStr}`, centerX, pageHeight - 30, {
    align: "center",
  });
  doc.text(`Siga Cattle - ${branding.farmName}`, centerX, pageHeight - 20, { align: "center" });

  doc.addPage();
}

// Aliases mantendo compatibilidade direta com a assinatura existente de branding-utils
export const drawHeader = addReportHeader;
export const drawFooter = (doc: jsPDF, options?: { customText?: string }) => addReportFooter(doc, options);
export const generateCoverPage = addReportCoverPage;
