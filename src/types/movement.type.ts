import { Sale } from "./sale.type";

export type MovementType = "nascimento" | "morte" | "venda" | "troca";

export interface MortePayload {
  reason: string;
  mother_name?: string;
  photos?: string[];
}

export interface SalePayload extends Partial<Sale> {}

export interface TrocaPayload {
  client_id: string;
  traded_animal_rgn: string;
  substitute_animal_rgn?: string;
  value_difference?: number;
}

export interface Movement {
  id: string;
  type: MovementType;
  date: string; // ISO Date
  /** Data efetiva do evento. Mantém date para compatibilidade com registros antigos. */
  event_date?: string;
  animal_id: string; // RGN of the main animal involved
  details_id: string;
  created_by?: string;
  created_at: number;
  updated_at: number;
  _deleted: boolean;
}
