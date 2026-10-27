"use client";

import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLocalMutation, useLocalQuery } from "@/hooks/core";
import { UserProfile } from "@/types/user_profile.type";
import { getEffectiveRole } from "@/types/permissions.type";
import { cachePermissions } from "@/lib/auth/permissionsCache";
import type { MangoQuery } from "rxdb";

export type UserProfileFields = Pick<
  UserProfile,
  | "full_name"
  | "residential_address"
  | "cpf"
  | "phone"
  | "email"
  | "farm_name"
  | "farm_state_registration"
  | "farm_address"
  | "farm_city"
  | "farm_car_number"
  | "farm_sigcar"
  | "farm_nirb"
  | "farm_ccir"
>;

export function useUserProfile() {
  const { data: user, loading: authLoading } = useAuth();
  const query = useMemo<MangoQuery<UserProfile> | null>(
    () =>
      user
        ? {
            selector: {
              id: { $eq: user.id },
              _deleted: { $eq: false },
            },
          }
        : null,
    [user?.id],
  );
  const { data, loading: profileLoading, error } = useLocalQuery<UserProfile>(
    "user_profiles",
    query,
  );
  const { actions } = useLocalMutation<UserProfile>("user_profiles");

  // Quando o perfil local carregar, sincroniza o cache de permissões para
  // garantir que useUserAccess tenha dados atualizados mesmo sem conexão.
  useEffect(() => {
    const profile = data[0];
    if (!profile || !user?.id) return;
    cachePermissions({
      userId: user.id,
      role: getEffectiveRole(profile.role),
      permissions: profile.permissions ?? {},
    });
  }, [data, user?.id]);

  const saveProfile = async (fields: UserProfileFields): Promise<UserProfile> => {
    if (!user?.id) {
      throw new Error("Não foi possível identificar o usuário autenticado.");
    }

    const currentProfile = data[0];
    const savedProfile = await actions.upsert({
      id: user.id,
      ...fields,
      created_at: currentProfile?.created_at ?? Date.now(),
      role: currentProfile?.role ?? "owner",
      permissions: currentProfile?.permissions ?? {},
      owner_id: currentProfile?.owner_id,
      _deleted: false,
    });

    // Atualiza o cache de permissões para refletir imediatamente na UI.
    cachePermissions({
      userId: user.id,
      role: getEffectiveRole(savedProfile.role),
      permissions: savedProfile.permissions ?? {},
    });

    return savedProfile;
  };

  return {
    data: data[0] ?? null,
    user,
    loading: authLoading || profileLoading,
    error: data[0] ? null : error,
    actions: { saveProfile },
  };
}
