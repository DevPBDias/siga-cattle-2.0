import { UserProfile } from "@/types/user_profile.type";
import { cleanSupabaseDocument } from "@/lib/supabase/auth-helper";
import { createReplication } from "./base";

export const userProfileReplication = createReplication<UserProfile>({
  collectionName: "user_profiles",
  tableName: "user_profiles",
  replicationIdentifier: "user-profiles-replication-v13",

  mapToSupabase: (profile) => ({
    id: profile.id,
    full_name: profile.full_name,
    residential_address: profile.residential_address,
    cpf: profile.cpf,
    phone: profile.phone,
    email: profile.email,
    farm_name: profile.farm_name,
    farm_state_registration: profile.farm_state_registration,
    farm_address: profile.farm_address,
    farm_city: profile.farm_city,
    farm_car_number: profile.farm_car_number,
    farm_sigcar: profile.farm_sigcar,
    farm_nirb: profile.farm_nirb,
    farm_ccir: profile.farm_ccir,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    _deleted: profile._deleted,
    role: profile.role ?? "owner",
    permissions: profile.permissions ?? {},
    owner_id: profile.owner_id ?? null,
  }),

  mapFromSupabase: (doc) =>
    cleanSupabaseDocument(doc) as unknown as UserProfile,
});

export async function replicateUserProfilesNew(
  db: Parameters<typeof userProfileReplication>[0],
  supabaseUrl: string,
  supabaseKey: string,
) {
  return userProfileReplication(db, supabaseUrl, supabaseKey);
}
