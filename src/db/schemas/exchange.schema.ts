import { Exchange } from "@/types/exchange.type";
import { RxJsonSchema } from "rxdb";

export const exchangeSchema: RxJsonSchema<Exchange> = {
  title: "exchanges",
  version: 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 36 },
    animal_key: { type: "string" },
    traded_animal_key: { type: "string" },
    substitute_animal_key: { type: "string" },
    animal_rgn: { type: "string" },
    date: { type: "string", maxLength: 50 },
    client_id: { type: "string", maxLength: 36 },
    traded_animal_rgn: { type: "string" },
    substitute_animal_rgn: { type: "string" },
    value_difference: { type: "number" },
    created_at: {
      type: "number",
      multipleOf: 1,
      minimum: 0,
      maximum: 1000000000000000,
    },
    updated_at: { type: "number" },
    _deleted: { type: "boolean" },
  },
  required: [
    "id",
    "animal_rgn",
    "date",
    "client_id",
    "traded_animal_rgn",
    "created_at",
    "updated_at",
    "_deleted",
  ],
  indexes: ["date", "created_at"],
};
