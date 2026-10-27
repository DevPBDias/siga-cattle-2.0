import { Animal } from "@/types/animal.type";
import { calculateAgeInMonths } from "@/utils/dates";

// Função para verificar se um animal é matriz (fêmea com 20+ meses)
export function isMatriz(animal: Animal): boolean {
  if (animal.sex !== "F") return false;
  const ageInMonths = calculateAgeInMonths(animal.born_date);
  return ageInMonths >= 20;
}
