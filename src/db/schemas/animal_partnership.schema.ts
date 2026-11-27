import { RxJsonSchema } from "rxdb";
import { AnimalPartnership } from "@/types/partnership.type";

export const animalPartnershipSchema: RxJsonSchema<AnimalPartnership> = {
  title: "animal_partnership schema",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 36 },
    partner_name: { type: "string" },
    created_at: { type: "number" },
    updated_at: { type: "number" },
    _deleted: { type: "boolean" },
  },
  required: ["id", "partner_name", "_deleted", "created_at", "updated_at"],
  additionalProperties: false,
};
