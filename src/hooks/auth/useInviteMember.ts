"use client";

import { useState } from "react";
import { toast } from "sonner";
import { generateUserPassword } from "@/lib/auth/passwordHelper";
import { createIsolatedAuthClient, getSupabase } from "@/lib/supabase/client";
import {
  DEFAULT_MEMBER_PERMISSIONS,
  OWNER_PERMISSIONS,
  PermissionKey,
  UserPermissions,
  UserRole,
} from "@/types/permissions.type";
import { UserProfile } from "@/types/user_profile.type";

type InviteInput = {
  fullName: string;
  email: string;
  ownerId?: string;
  farmName?: string;
  createLocal: (data: Partial<UserProfile>) => Promise<UserProfile>;
};

type MemberAccessChanges = {
  role?: UserRole;
  permission?: PermissionKey;
  value?: boolean;
};

export type CreatedCredentials = {
  email: string;
  password: string;
  role: UserRole;
};

function nextMemberAccess(profile: UserProfile, changes: MemberAccessChanges) {
  const nextRole = changes.role ?? (profile.role === "member" ? "member" : "owner");
  const currentPermissions = profile.permissions ?? {};
  const nextPermissions: UserPermissions = changes.role
    ? changes.role === "owner"
      ? OWNER_PERMISSIONS
      : { ...DEFAULT_MEMBER_PERMISSIONS, ...currentPermissions }
    : {
        ...currentPermissions,
        ...(changes.permission ? { [changes.permission]: changes.value } : {}),
      };

  return { nextRole, nextPermissions };
}

export function useInviteMember() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const previewPassword = (email: string) => generateUserPassword(email);

  const reset = () => {
    setError(null);
    setCredentials(null);
    setLoading(false);
  };

  const invite = async ({
    fullName,
    email,
    ownerId,
    farmName,
    createLocal,
  }: InviteInput) => {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Informe o nome completo do usuário.");
      return false;
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Informe um e-mail válido.");
      return false;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const message =
        "É necessário estar conectado à internet para cadastrar o usuário no Supabase Authentication.";
      setError(message);
      toast.error(message);
      return false;
    }

    const passwordToUse = generateUserPassword(cleanEmail);
    if (!passwordToUse || passwordToUse.length < 6) {
      setError(
        "O e-mail precisa conter pelo menos 3 letras antes do '@' para compor a senha inicial.",
      );
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const roleToSave: UserRole = "member";
      const permissionsToSave: UserPermissions = { consulta: true };

      const isolatedClient = createIsolatedAuthClient();
      const { data: authData, error: authError } = await isolatedClient.auth.signUp({
        email: cleanEmail,
        password: passwordToUse,
        options: { data: { full_name: cleanName } },
      });

      if (authError) {
        if (
          authError.message.toLowerCase().includes("already registered") ||
          authError.message.toLowerCase().includes("already been registered")
        ) {
          throw new Error("Este e-mail já está cadastrado no sistema.");
        }
        throw new Error(`Falha no Supabase Auth: ${authError.message}`);
      }

      if (authData.user?.identities && authData.user.identities.length === 0) {
        throw new Error("Este e-mail já está cadastrado no Supabase.");
      }

      const authUserId = authData.user?.id;
      if (!authUserId) {
        throw new Error(
          "Não foi possível obter o identificador do usuário gerado pelo Supabase.",
        );
      }

      const now = Date.now();
      const { error: profileError } = await getSupabase()
        .from("user_profiles")
        .upsert({
          id: authUserId,
          full_name: cleanName,
          email: cleanEmail,
          role: roleToSave,
          permissions: permissionsToSave,
          owner_id: ownerId,
          farm_name: farmName || "",
          created_at: now,
          updated_at: now,
          _deleted: false,
        });

      if (profileError) {
        console.warn("[Perfil] Aviso ao gravar user_profiles no Supabase:", profileError);
      }

      await createLocal({
        id: authUserId,
        full_name: cleanName,
        email: cleanEmail,
        role: roleToSave,
        permissions: permissionsToSave,
        owner_id: ownerId,
        farm_name: farmName || "",
        created_at: now,
        updated_at: now,
        _deleted: false,
        residential_address: "",
        cpf: "",
        phone: "",
        farm_state_registration: "",
        farm_address: "",
        farm_city: "",
        farm_car_number: "",
        farm_sigcar: "",
        farm_nirb: "",
        farm_ccir: "",
      });

      setCredentials({
        email: cleanEmail,
        password: passwordToUse,
        role: roleToSave,
      });
      toast.success("Usuário cadastrado com sucesso.");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar usuário.";
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateAccess = async (
    profile: UserProfile,
    changes: MemberAccessChanges,
    onUpdate: (id: string, data: Partial<UserProfile>) => Promise<void>,
  ) => {
    const { nextRole, nextPermissions } = nextMemberAccess(profile, changes);
    setSavingId(profile.id);
    try {
      await onUpdate(profile.id, {
        role: nextRole,
        permissions: nextPermissions,
      });

      if (typeof navigator === "undefined" || navigator.onLine) {
        void getSupabase()
          .from("user_profiles")
          .update({
            role: nextRole,
            permissions: nextPermissions,
            updated_at: Date.now(),
          })
          .eq("id", profile.id);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível atualizar as permissões.";
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  };

  return {
    data: { credentials, savingId },
    loading,
    error,
    actions: { invite, reset, previewPassword, updateAccess },
  };
}
