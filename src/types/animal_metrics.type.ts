export interface AnimalMetric {
  id: string;
  metric_type?: "weight" | "ce";
  animal_key?: string;
  rgn: string;
  born_metric?: boolean;
  date: string;
  value: number;
  created_at: number;
  updated_at: number;
  _deleted: boolean;
}
