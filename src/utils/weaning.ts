export function calculateAdjustedWeight210(
  birthWeightKg: number,
  weaningWeightKg: number,
  ageDays: number,
): number {
  if (
    !Number.isFinite(birthWeightKg) ||
    birthWeightKg <= 0 ||
    !Number.isFinite(weaningWeightKg) ||
    weaningWeightKg <= 0 ||
    !Number.isFinite(ageDays) ||
    ageDays <= 0
  ) {
    throw new Error("Pesos e idade devem ser maiores que zero.");
  }

  const adjusted =
    birthWeightKg + ((weaningWeightKg - birthWeightKg) / ageDays) * 210;

  if (!Number.isFinite(adjusted) || adjusted <= 0) {
    throw new Error("O peso ajustado calculado não é válido.");
  }

  return Math.round((adjusted + Number.EPSILON) * 100) / 100;
}

export function calculateMaternalEfficiencyPercent(
  adjustedWeight210Kg: number,
  motherWeightKg: number,
): number {
  if (
    !Number.isFinite(adjustedWeight210Kg) ||
    adjustedWeight210Kg <= 0 ||
    !Number.isFinite(motherWeightKg) ||
    motherWeightKg <= 0
  ) {
    throw new Error("O peso ajustado e o peso da matriz devem ser válidos.");
  }

  return (
    Math.round(
      ((adjustedWeight210Kg / motherWeightKg) * 100 + Number.EPSILON) * 100,
    ) / 100
  );
}
