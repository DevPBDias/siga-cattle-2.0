"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/db/user_profiles/useUserProfile";
import {
  EMPTY_PROFILE_FARM,
  farmValuesFromProfile,
  ProfileFarmValues,
  userValuesFromProfile,
} from "@/types/user_profile.type";

export function useFarmProfileForm() {
  const {
    data: profile,
    user,
    actions: { saveProfile },
  } = useUserProfile();
  const [values, setValues] = useState<ProfileFarmValues>(EMPTY_PROFILE_FARM);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) return;
    setValues(farmValuesFromProfile(profile));
  }, [
    editing,
    profile?.farm_name,
    profile?.farm_state_registration,
    profile?.farm_address,
    profile?.farm_city,
    profile?.farm_car_number,
    profile?.farm_sigcar,
    profile?.farm_nirb,
    profile?.farm_ccir,
  ]);

  const setField = <K extends keyof ProfileFarmValues>(
    field: K,
    value: ProfileFarmValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const startEdit = () => {
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveProfile({
        ...userValuesFromProfile(profile, user?.email ?? ""),
        farm_name: values.farm_name.trim(),
        farm_state_registration: values.farm_state_registration.trim(),
        farm_address: values.farm_address.trim(),
        farm_city: values.farm_city.trim(),
        farm_car_number: values.farm_car_number.trim(),
        farm_sigcar: values.farm_sigcar.trim(),
        farm_nirb: values.farm_nirb.trim(),
        farm_ccir: values.farm_ccir.trim(),
      });
      setEditing(false);
      toast.success("Dados da fazenda salvos.");
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar os dados da fazenda.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return {
    data: { values, editing },
    loading: false,
    error,
    actions: { setField, startEdit, save },
    saving,
  };
}
