import { AnimalMetric } from "@/types/animal_metrics.type";
import { RxJsonSchema } from "rxdb";

export const animalMetricCESchema: RxJsonSchema<AnimalMetric> = {
  title: "animal_ce",
  version: 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 36 },
    metric_type: { type: "string", enum: ["weight", "ce"] },
    animal_key: { type: "string" },
    rgn: { type: "string", maxLength: 10 },
    born_metric: { type: "boolean" },
    date: { type: "string" },
    value: { type: "number" },
    created_at: { type: "number" },
    updated_at: { type: "number" },
    _deleted: { type: "boolean" },
  },
  required: ["id", "rgn", "_deleted", "created_at", "updated_at"],
  indexes: ["rgn"],
};
