import { UserPermissions, UserRole } from "./permissions.type";

export type ProfileUserValues = {
  full_name: string;
  residential_address: string;
  cpf: string;
  phone: string;
  email: string;
};

export type ProfileFarmValues = {
  farm_name: string;
  farm_state_registration: string;
  farm_address: string;
  farm_city: string;
  farm_car_number: string;
  farm_sigcar: string;
  farm_nirb: string;
  farm_ccir: string;
};

export const EMPTY_PROFILE_USER: ProfileUserValues = {
  full_name: "",
  residential_address: "",
  cpf: "",
  phone: "",
  email: "",
};

export const EMPTY_PROFILE_FARM: ProfileFarmValues = {
  farm_name: "",
  farm_state_registration: "",
  farm_address: "",
  farm_city: "",
  farm_car_number: "",
  farm_sigcar: "",
  farm_nirb: "",
  farm_ccir: "",
};

export interface UserProfile {
  id: string;
  full_name: string;
  residential_address: string;
  cpf: string;
  phone: string;
  email: string;
  farm_name: string;
  farm_state_registration: string;
  farm_address: string;
  farm_city: string;
  farm_car_number: string;
  farm_sigcar: string;
  farm_nirb: string;
  farm_ccir: string;
  created_at: number;
  updated_at: number;
  _deleted: boolean;
  role?: UserRole;
  permissions?: UserPermissions;
  owner_id?: string;
}

export function userValuesFromProfile(
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

export function farmValuesFromProfile(
  profile: UserProfile | null,
): ProfileFarmValues {
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
