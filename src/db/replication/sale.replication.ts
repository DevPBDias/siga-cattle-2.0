import { createReplication } from "./base";
import { Sale } from "@/types/sale.type";
import { cleanSupabaseDocument } from "@/lib/supabase/auth-helper";

/**
 * Replicação de Vendas usando o template padronizado.
 */
export const saleReplication = createReplication<Sale>({
  collectionName: "sales",
  tableName: "sales",
  replicationIdentifier: "sales-replication-v13",

  // Mapeia documento RxDB → Supabase
  mapToSupabase: (doc) => ({
    id: doc.id,
    animal_key: doc.animal_key ?? null,
    animal_rgn: doc.animal_rgn,
    client_id: doc.client_id,
    date: doc.date,
    total_value: doc.total_value ?? null,
    down_payment: doc.down_payment ?? null,
    payment_method: doc.payment_method ?? null,
    installments: doc.installments ?? null,
    financial_status: doc.financial_status ?? null,
    gta_number: doc.gta_number ?? null,
    invoice_number: doc.invoice_number ?? null,
    installment_value: doc.installment_value ?? null,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    _deleted: doc._deleted,
    sale_type: doc.sale_type ?? null,
  }),

  // Configurações
  pullBatchSize: 1000,
  pushBatchSize: 1000,
  retryTime: 5000,
  live: true,
  autoStart: false,

  mapFromSupabase: (doc) => {
    return cleanSupabaseDocument(doc) as unknown as Sale;
  },
});

/**
 * Função wrapper para compatibilidade.
 */
export async function replicateSalesNew(
  db: Parameters<typeof saleReplication>[0],
  supabaseUrl: string,
  supabaseKey: string,
) {
  return saleReplication(db, supabaseUrl, supabaseKey);
}
