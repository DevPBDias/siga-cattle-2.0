export const STATUS_ABCZ_OPTIONS = ["RGD", "RGN", "Apto", "Pendente"] as const;

export type STATUS_ABCZ = (typeof STATUS_ABCZ_OPTIONS)[number];

export type IStatus = STATUS_ABCZ | (string & {});

export interface AnimalStatus {
  id: string;
  status_name: STATUS_ABCZ;
  created_at: number;
  updated_at: number;
  _deleted: boolean;
}