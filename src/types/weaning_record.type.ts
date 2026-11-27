export type CalfVisualClass = "A" | "B" | "C" | "D";

export interface WeaningRecord {
  id: string;
  animal_key: string;
  animal_rgn: string;
  mother_animal_key?: string;
  mother_rgn: string;
  farm_id?: string;
  born_date: string;
  weaning_date: string;
  age_days: number;
  birth_weight_kg: number;
  calf_weight_kg: number;
  mother_weight_kg: number;
  adjusted_weight_210_kg: number;
  efficiency_percent: number;
  visual_class: CalfVisualClass;
  created_at: number;
  updated_at: number;
  _deleted: boolean;
}
