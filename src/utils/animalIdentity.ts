import { Animal } from "@/types/animal.type";

export function normalizeAnimalRegistration(value: string): string {
  return value.trim().toLocaleUpperCase("pt-BR");
}

export function getAnimalKey(
  animal: Pick<Animal, "serie_rgd" | "rgn">,
): string {
  const serie = normalizeAnimalRegistration(animal.serie_rgd);
  const rgn = normalizeAnimalRegistration(animal.rgn);

  if (!serie || !rgn) {
    throw new Error("Informe a série/RGD e o RGN para identificar o animal.");
  }

  return `${serie}::${rgn}`;
}

export function getAnimalKeyFromReference(
  animal: Pick<Animal, "animal_key" | "serie_rgd" | "rgn">,
): string {
  return animal.animal_key || getAnimalKey(animal);
}
