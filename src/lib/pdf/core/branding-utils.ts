import { jsPDF } from "jspdf";
import {
  addReportHeader,
  addReportFooter,
  addReportCoverPage,
  ReportHeaderOptions,
} from "@/lib/branding/report-branding";

export type BrandingOptions = ReportHeaderOptions;

/**
 * Desenha o cabeçalho padronizado utilizando a identidade visual dinâmica do cliente.
 */
export const drawHeader = (doc: jsPDF, options: BrandingOptions) => {
  addReportHeader(doc, options);
};

/**
 * Desenha o rodapé padronizado utilizando a identidade visual dinâmica do cliente.
 */
export const drawFooter = (doc: jsPDF) => {
  addReportFooter(doc);
};

/**
 * Gera a capa institucional do relatório.
 */
export const generateCoverPage = (doc: jsPDF, options: BrandingOptions) => {
  addReportCoverPage(doc, options);
};
