import { UserProfile } from "@/types/user_profile.type";
import { RxJsonSchema } from "rxdb";

export const userProfileSchema: RxJsonSchema<UserProfile> = {
  title: "user_profiles",
  version: 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 36 },
    full_name: { type: "string" },
    residential_address: { type: "string" },
    cpf: { type: "string" },
    phone: { type: "string" },
    email: { type: "string", maxLength: 254 },
    farm_name: { type: "string" },
    farm_state_registration: { type: "string" },
    farm_address: { type: "string" },
    farm_city: { type: "string" },
    farm_car_number: { type: "string" },
    farm_sigcar: { type: "string" },
    farm_nirb: { type: "string" },
    farm_ccir: { type: "string" },
    created_at: { type: "number" },
    updated_at: { type: "number" },
    _deleted: { type: "boolean" },
    role: { type: "string", enum: ["owner", "member"] },
    permissions: { type: "object", additionalProperties: { type: "boolean" } },
    owner_id: { type: "string", maxLength: 36 },
  },
  required: ["id", "created_at", "updated_at", "_deleted"],
};
