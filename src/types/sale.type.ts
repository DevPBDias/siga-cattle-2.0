export interface Sale {
  id: string;
  animal_key?: string;
  animal_rgn: string;
  client_id: string;
  date: string;
  total_value?: number;
  down_payment?: number;
  payment_method?: string;
  installments?: number;
  installment_value?: number;
  financial_status?: string;
  gta_number?: string;
  invoice_number?: string;
  created_at: number;
  updated_at: number;
  _deleted: boolean;
  sale_type?: string; // 'abate' | 'comprado'
}
