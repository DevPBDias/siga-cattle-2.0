import { createReplication } from "./base";
import { Transaction } from "@/types/transaction.type";
import { cleanSupabaseDocument } from "@/lib/supabase/auth-helper";

/**
 * Replicação unificada de Transações Comerciais (Vendas e Compras).
 */
export const transactionReplication = createReplication<Transaction>({
  collectionName: "transactions",
  tableName: "transactions",
  replicationIdentifier: "transactions-replication-v1",

  mapToSupabase: (doc) => ({
    id: doc.id,
    animal_key: doc.animal_key ?? null,
    animal_rgn: doc.animal_rgn,
    client_id: doc.client_id,
    date: doc.date,
    transaction_type: doc.transaction_type ?? "venda",
    total_value: doc.total_value ?? null,
    down_payment: doc.down_payment ?? null,
    payment_method: doc.payment_method ?? null,
    installments: doc.installments ?? null,
    installment_value: doc.installment_value ?? null,
    financial_status: doc.financial_status ?? null,
    gta_number: doc.gta_number ?? null,
    invoice_number: doc.invoice_number ?? null,
    sale_type: doc.sale_type ?? null,
    adt: doc.adt ?? null,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    _deleted: doc._deleted,
  }),

  pullBatchSize: 1000,
  pushBatchSize: 1000,
  retryTime: 5000,
  live: true,
  autoStart: false,

  mapFromSupabase: (doc) => {
    return cleanSupabaseDocument(doc) as unknown as Transaction;
  },
});

export async function replicateTransactionsNew(
  db: Parameters<typeof transactionReplication>[0],
  supabaseUrl: string,
  supabaseKey: string,
) {
  return transactionReplication(db, supabaseUrl, supabaseKey);
}
