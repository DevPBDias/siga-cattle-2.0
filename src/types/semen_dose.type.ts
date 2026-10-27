export type DoseSortOption = "name-asc" | "name-desc" | "qty-asc" | "qty-desc";

export interface SemenDose {
  id: string;
  animal_name: string;
  animal_image?: string;
  father_name?: string;
  maternal_grandfather_name?: string;
  iabcz?: string;
  registration?: string;
  center_name?: string;
  breed: string;
  quantity: number;
  created_at: number;
  updated_at: number;
  _deleted: boolean;
}
