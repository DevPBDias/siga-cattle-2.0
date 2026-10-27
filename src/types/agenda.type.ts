export type AgendaItemType = "vacina" | "reproducao" | "nascimento" | "lembrete";
export type AgendaStatusFilter = "todos" | "proximos" | "realizados";
export type AgendaTypeFilter = "todos" | AgendaItemType;

export interface AgendaItem {
  id: string;
  date: string;
  type: AgendaItemType;
  title: string;
  subtitle: string;
  rgn?: string;
  source: "vaccine" | "reproduction" | "birth" | "reminder";
}

export interface AgendaDayCell {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  types: AgendaItemType[];
}
