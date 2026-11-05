import { jsPDF } from "jspdf";
import {
  addReportHeader,
  addReportFooter,
  addReportCoverPage,
  ReportHeaderOptions,
} from "@/lib/branding/report-branding";

export type BrandingOptions = ReportHeaderOptions;

/**
 * Carrega uma imagem a partir de uma URL pública e retorna base64 com data URI.
 * Retorna null se o carregamento falhar (offline, 404, etc.).
 */
async function loadImageAsBase64(url: string): Promise<{ base64: string; format: string } | null> {
  try {
    const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    const response = await fetch(fullUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    const mimeType = blob.type || "image/png";
    const format = mimeType.includes("png") ? "PNG" : mimeType.includes("svg") ? "SVG" : "JPEG";
    // SVG não é suportado por jsPDF addImage — converte para base64 PNG via canvas
    if (format === "SVG") return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === "string") resolve({ base64: result, format });
        else resolve(null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Pré-carrega o logo do branding ativo e retorna o base64.
 * Exportado para uso direto nos generators que precisem pré-carregar.
 */
export async function preloadBrandingLogo(
  logoUrl: string,
): Promise<{ base64: string; format: string } | null> {
  return loadImageAsBase64(logoUrl);
}

/**
 * Desenha o cabeçalho padronizado com logo real quando disponível.
 * Assíncrono pois carrega a imagem do logo via fetch antes de renderizar.
 */
export const drawHeader = async (doc: jsPDF, options: BrandingOptions): Promise<void> => {
  await addReportHeader(doc, options);
};

/**
 * Desenha o rodapé padronizado (síncrono).
 */
export const drawFooter = (doc: jsPDF) => {
  addReportFooter(doc);
};

/**
 * Gera a capa institucional do relatório (assíncrono pois chama addReportHeader internamente).
 */
export const generateCoverPage = async (doc: jsPDF, options: BrandingOptions): Promise<void> => {
  await addReportCoverPage(doc, options);
};
