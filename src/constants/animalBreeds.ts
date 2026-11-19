export const ANIMAL_BREEDS = [
  "Nelore",
  "Nelore Mocha",
  "Gir",
  "Guzerá",
  "Brahman",
  "Tabapuã",
  "Caracu",
  "Curraleiro",
  "Girolando",
  "Canchim",
  "Brangus",
  "Charolês",
  "Angus",
  "Holandês",
  "Hereford",
  "Senepol",
] as const;

export type AnimalBreed = (typeof ANIMAL_BREEDS)[number] | (string & {});
