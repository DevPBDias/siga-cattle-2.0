import { Sale } from "@/types/sale.type";
import { RxJsonSchema } from "rxdb";

export const saleSchema: RxJsonSchema<Sale> = {
  title: "sales",
  version: 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 36 },
    animal_key: { type: "string" },
    animal_rgn: { type: "string" },
    client_id: { type: "string", maxLength: 36 },
    date: { type: "string", maxLength: 50 },
    total_value: { type: "number" },
    down_payment: { type: "number" },
    payment_method: { type: "string" },
    installments: { type: "integer" },
    installment_value: { type: "number" },
    financial_status: { type: "string" },
    gta_number: { type: "string" },
    invoice_number: { type: "string" },
    created_at: {
      type: "number",
      multipleOf: 1,
      minimum: 0,
      maximum: 1000000000000000,
    },
    updated_at: { type: "number" },
    _deleted: { type: "boolean" },
    sale_type: { type: "string" },
  },
  required: [
    "id",
    "animal_rgn",
    "client_id",
    "date",
    "created_at",
    "updated_at",
    "_deleted",
  ],
  indexes: ["date", "created_at"],
};
