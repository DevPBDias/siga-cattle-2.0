export const ANIMAL_BREEDS = [
  "Angus",
  "Brahman",
  "Caracu",
  "Charolês",
  "Curraleiro",
  "Gir",
  "Gir Mocha",
  "Girolando",
  "Guzerá",
  "Holandês",
  "Nelore",
  "Nelore Mocha",
  "Retinta",
  "Senepol",
  "Sindi",
  "Tabapuã",
] as const;

export type AnimalBreed = (typeof ANIMAL_BREEDS)[number] | (string & {})

export const ANIMAL_COLORS = [
  "Amarela",
  "Branca",
  "Castanha",
  "Chitada",
  "Cinza",
  "Manchada",
  "Moura",
  "Pintada de vermelho",
  "Pintada de preto",
  "Preta",
  "Vermelha",
] as const;

export type AnimalColor = (typeof ANIMAL_COLORS)[number] | (string & {});