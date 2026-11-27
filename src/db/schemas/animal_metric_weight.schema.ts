import { AnimalMetric } from "@/types/animal_metrics.type";
import { RxJsonSchema } from "rxdb";

export const animalMetricWeightSchema: RxJsonSchema<AnimalMetric> = {
  title: "animal_weights",
  version: 2,
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
  required: ["id", "metric_type", "rgn", "_deleted", "created_at", "updated_at"],
  indexes: ["rgn"],
};
