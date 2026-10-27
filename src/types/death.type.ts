export interface Death {
  id: string;
  animal_rgn: string;
  date: string;
  reason: string;
  mother_name?: string;
  photos: string[];
  photo_paths: string[];
  created_at: number;
  updated_at: number;
  _deleted: boolean;
}
