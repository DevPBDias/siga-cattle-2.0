export type AgendaReminderType =
  | "vacinacao"
  | "inseminacao"
  | "nascimento"
  | "manejo";

export interface AgendaReminder {
  id: string;
  type: AgendaReminderType;
  scheduled_date: string;
  rgn?: string;
  notes?: string;
  created_at: number;
  updated_at: number;
  _deleted: boolean;
}
