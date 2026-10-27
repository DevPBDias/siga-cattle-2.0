import { parseDateParts, formatDateOrDash } from "@/utils/dates";

export const DEATH_REASONS = [
  "Doença",
  "Picada de cobra",
  "Acidente",
  "Fraqueza",
  "Abate",
  "Infecção",
  "Raio",
  "Natimorto",
  "Febre",
] as const;

export const NATIMORTO = "Natimorto";

/** Máximo de fotos por registro de morte. */
export const MAX_PHOTOS = 2;

/** Animais com menos meses que isso são tratados como bezerros (exigem a mãe). */
export const CALF_MAX_MONTHS = 12;

export interface IsoDateParts {
  year: number;
  month: number;
  day: number;
}

/** Interpreta "AAAA-MM-DD" (com ou sem hora) ou "DD/MM/AAAA". */
export function parseIsoDate(date?: string | null): IsoDateParts | null {
  const parts = parseDateParts(date);
  if (!parts) return null;
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function formatIsoDate(date?: string | null): string {
  return formatDateOrDash(date);
}

/**
 * Reduz a foto (lado maior = maxSize) e converte para JPEG em base64,
 * para o registro não ficar pesado no banco local.
 */
export function compressImage(
  file: File,
  maxSize = 1024,
  quality = 0.7,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a foto."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Foto inválida."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível processar a foto."));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
