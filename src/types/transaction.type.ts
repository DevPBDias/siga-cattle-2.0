export type TransactionType = "venda" | "compra";

export interface Transaction {
  id: string;
  animal_key?: string;
  animal_rgn: string;
  client_id: string;
  date: string;
  transaction_type?: TransactionType;
  total_value?: number;
  down_payment?: number;
  payment_method?: string;
  installments?: number;
  installment_value?: number;
  financial_status?: string;
  gta_number?: string;
  invoice_number?: string;
  sale_type?: string; // 'abate' | 'comprado' (quando venda)
  adt?: string; // (quando compra)
  created_at: number;
  updated_at: number;
  _deleted: boolean;
}
