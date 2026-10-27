import { Animal } from "@/types/animal.type";
import { MONTHS, parseDateParts, DateParts, formatDate } from "@/utils/dates";

export { MONTHS };
export type BirthDateParts = DateParts;

/** Aceita "AAAA-MM-DD" (ISO, com ou sem hora) ou "DD/MM/AAAA". */
export function parseBirthDate(bornDate?: string | null): BirthDateParts | null {
  return parseDateParts(bornDate);
}

export const formatBirthDate = (parts: BirthDateParts) =>
  formatDate(`${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`);

/**
 * Define o que aparece no histórico: animais com data de nascimento e mãe
 * informadas. Se quiser restringir (ex.: só os cadastrados pelo formulário),
 * ajuste apenas esta função.
 */
export const isBirthRecord = (animal: Animal) =>
  Boolean(animal.mother_rgn && parseBirthDate(animal.born_date));

export const SEX_LABEL: Record<string, string> = {
  M: "Macho",
  F: "Fêmea",
};
