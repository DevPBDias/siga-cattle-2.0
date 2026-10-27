export interface Vaccine {
  id: string;
  vaccine_name: string;
  created_at: number;
  updated_at: number;
  _deleted: boolean;
}

export interface AnimalVaccine {
  id: string;
  rgn: string;
  vaccine_id: string;
  date?: string;
  created_at: number;
  updated_at: number;
  _deleted: boolean;
}

export interface VaccineHistoryEntry {
  id: string;
  name: string;
  date?: string;
}
