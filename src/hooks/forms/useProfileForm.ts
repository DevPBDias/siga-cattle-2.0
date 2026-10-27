"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/db/user_profiles/useUserProfile";
import {
  EMPTY_PROFILE_USER,
  farmValuesFromProfile,
  ProfileUserValues,
  userValuesFromProfile,
} from "@/types/user_profile.type";

export function useProfileForm() {
  const {
    data: profile,
    user,
    loading,
    error: profileError,
    actions: { saveProfile },
  } = useUserProfile();
  const [values, setValues] = useState<ProfileUserValues>(EMPTY_PROFILE_USER);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fallbackName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "";

  useEffect(() => {
    if (editing) return;
    setValues(userValuesFromProfile(profile, user?.email ?? "", fallbackName));
  }, [
    editing,
    fallbackName,
    user?.email,
    profile?.full_name,
    profile?.residential_address,
    profile?.cpf,
    profile?.phone,
    profile?.email,
  ]);

  const setField = <K extends keyof ProfileUserValues>(
    field: K,
    value: ProfileUserValues[K],
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
        ...farmValuesFromProfile(profile),
        full_name: values.full_name.trim(),
        residential_address: values.residential_address.trim(),
        cpf: values.cpf.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
      });
      setEditing(false);
      toast.success("Dados do usuário salvos.");
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar os dados do usuário.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const displayName = values.full_name || user?.email || "Meu perfil";
  const initials = displayName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return {
    data: { values, editing, displayName, initials },
    loading,
    error: error || (profileError ? "Não foi possível carregar o perfil." : null),
    actions: { setField, startEdit, save },
    saving,
  };
}
