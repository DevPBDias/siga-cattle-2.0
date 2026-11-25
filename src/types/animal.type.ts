import type { AnimalBreed, AnimalColor } from "@/constants/animalVariations";

export type { AnimalBreed, AnimalColor } from "@/constants/animalVariations";

export interface Animal {
  animal_key?: string;
  id?: string;
  rgn: string;
  name?: string;
  sex?: "M" | "F" | string;
  is_natural_bull?: boolean;
  born_date?: string;
  serie_rgd: string;
  breed?: AnimalBreed;
  born_color?: AnimalColor;
  iabcgz?: string;
  deca?: string;
  p?: string;
  f?: string;
  document_situation?: string;
  /** Legacy status value persisted with the animal record. */
  status?: string;
  animal_state: string;
  defects?: string[];
  farm_id?: string;
  classification?: string;
  genotyping?: string;
  condition?: "Parida" | "Solteira";
  father_name?: string;
  mother_rgn?: string;
  mother_serie_rgd?: string;
  maternal_grandfather_name?: string;
  paternal_grandfather_name?: string;
  partnership?: string;
  /** URL da foto do touro (armazenada no Supabase Storage). */
  animal_image?: string;
  created_at: number;
  updated_at: number;
  _deleted: boolean;
}
