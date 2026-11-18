import { AnimalVaccine } from "@/types/vaccine.type";
import { RxJsonSchema } from "rxdb";

export const animalVaccineSchema: RxJsonSchema<AnimalVaccine> = {
  title: "animal_vaccines",
  version: 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 36 },
    animal_key: { type: "string" },
    rgn: { type: "string", maxLength: 10 },
    vaccine_id: { type: "string", maxLength: 36 },
    date: { type: "string", format: "date" },
    updated_at: { type: "number" },
    created_at: { type: "number" },
    _deleted: { type: "boolean" },
  },
  required: ["id", "rgn", "vaccine_id", "_deleted", "updated_at", "created_at"],
  indexes: ["rgn", "vaccine_id"],
};
