"use client";

import { useState } from "react";
import { toast } from "sonner";
import { generateUserPassword } from "@/lib/auth/passwordHelper";
import { getSupabase } from "@/lib/supabase/client";
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
  const nextRole = changes.role ?? (profile.role === "owner" ? "owner" : "member");
  const currentPermissions = profile.permissions ?? {};
  const nextPermissions: UserPermissions = changes.role
    ? changes.role === "owner"
      ? OWNER_PERMISSIONS
      : profile.role === "owner"
        ? DEFAULT_MEMBER_PERMISSIONS
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
      if (!ownerId) {
        throw new Error("Não foi possível identificar o administrador da fazenda.");
      }

      const {
        data: { session },
        error: sessionError,
      } = await getSupabase().auth.getSession();
      if (sessionError) throw sessionError;
      if (!session || session.user.id !== ownerId) {
        throw new Error("Somente o administrador autenticado pode criar usuários.");
      }

      const response = await fetch("/api/profile/members/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: cleanName,
          email: cleanEmail,
          password: passwordToUse,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        profile?: Partial<UserProfile>;
      };
      if (!response.ok || !result.profile) {
        throw new Error(result.error || "Não foi possível criar o usuário.");
      }

      await createLocal(result.profile);

      setCredentials({
        email: cleanEmail,
        password: passwordToUse,
        role: "member",
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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível atualizar as permissões.";
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  };

  const deleteMemberAccount = async (
    profile: UserProfile,
    ownerId: string,
    onRemove: (id: string) => Promise<void>,
  ): Promise<boolean> => {
    if (
      profile.role !== "member" ||
      !ownerId
    ) {
      toast.error("Este membro não pertence à sua equipe.");
      return false;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("Conecte-se à internet para excluir a conta do membro.");
      return false;
    }

    setSavingId(profile.id);
    try {
      const supabase = getSupabase();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session || session.user.id !== ownerId) {
        throw new Error("Somente o administrador autenticado pode excluir membros.");
      }

      const response = await fetch("/api/profile/members/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberId: profile.id }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível excluir a conta do membro.");
      }

      await onRemove(profile.id);

      toast.success(`${profile.full_name || profile.email || "Membro"} excluído da fazenda.`);
      return true;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível excluir a conta do membro.";
      toast.error(message);
      return false;
    } finally {
      setSavingId(null);
    }
  };

  return {
    data: { credentials, savingId },
    loading,
    error,
    actions: { invite, reset, previewPassword, updateAccess, deleteMemberAccount },
  };
}
