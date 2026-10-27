import { UserProfile } from "@/types/user_profile.type";
import { UserProfileFields } from "@/hooks/db/user_profiles/useUserProfile";

export type ProfileUserValues = Pick<
  UserProfile,
  "full_name" | "residential_address" | "cpf" | "phone" | "email"
>;

export type ProfileFarmValues = Pick<
  UserProfile,
  | "farm_name"
  | "farm_state_registration"
  | "farm_address"
  | "farm_city"
  | "farm_car_number"
  | "farm_sigcar"
  | "farm_nirb"
  | "farm_ccir"
>;

export const EMPTY_USER_VALUES: ProfileUserValues = {
  full_name: "",
  residential_address: "",
  cpf: "",
  phone: "",
  email: "",
};

export const EMPTY_FARM_VALUES: ProfileFarmValues = {
  farm_name: "",
  farm_state_registration: "",
  farm_address: "",
  farm_city: "",
  farm_car_number: "",
  farm_sigcar: "",
  farm_nirb: "",
  farm_ccir: "",
};

export function userValuesFrom(
  profile: UserProfile | null,
  fallbackEmail = "",
  fallbackName = "",
): ProfileUserValues {
  return {
    full_name: profile?.full_name || fallbackName,
    residential_address: profile?.residential_address ?? "",
    cpf: profile?.cpf ?? "",
    phone: profile?.phone ?? "",
    email: profile?.email || fallbackEmail,
  };
}

export function farmValuesFrom(profile: UserProfile | null): ProfileFarmValues {
  return {
    farm_name: profile?.farm_name ?? "",
    farm_state_registration: profile?.farm_state_registration ?? "",
    farm_address: profile?.farm_address ?? "",
    farm_city: profile?.farm_city ?? "",
    farm_car_number: profile?.farm_car_number ?? "",
    farm_sigcar: profile?.farm_sigcar ?? "",
    farm_nirb: profile?.farm_nirb ?? "",
    farm_ccir: profile?.farm_ccir ?? "",
  };
}

export function toSavePayload(
  user: ProfileUserValues,
  farm: ProfileFarmValues,
): UserProfileFields {
  return {
    full_name: user.full_name.trim(),
    residential_address: user.residential_address.trim(),
    cpf: user.cpf.trim(),
    phone: user.phone.trim(),
    email: user.email.trim(),
    farm_name: farm.farm_name.trim(),
    farm_state_registration: farm.farm_state_registration.trim(),
    farm_address: farm.farm_address.trim(),
    farm_city: farm.farm_city.trim(),
    farm_car_number: farm.farm_car_number.trim(),
    farm_sigcar: farm.farm_sigcar.trim(),
    farm_nirb: farm.farm_nirb.trim(),
    farm_ccir: farm.farm_ccir.trim(),
  };
}
