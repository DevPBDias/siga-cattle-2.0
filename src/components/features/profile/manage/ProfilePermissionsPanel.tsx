"use client";

import { useState } from "react";
import { Lock, Unlock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteMemberDialog } from "@/components/features/profile/manage/InviteMemberDialog";
import { ProfileMemberList } from "@/components/features/profile/manage/ProfileMemberList";
import { useInviteMember } from "@/hooks/auth/useInviteMember";
import { useUserProfile } from "@/hooks/db/user_profiles/useUserProfile";
import { useUserProfiles } from "@/hooks/db/user_profiles/useUserProfiles";
import { PermissionKey, UserRole } from "@/types/permissions.type";
import { UserProfile } from "@/types/user_profile.type";

interface ProfilePermissionsPanelProps {
  editing: boolean;
}

export function ProfilePermissionsPanel({ editing }: ProfilePermissionsPanelProps) {
  const { data: userProfile, user } = useUserProfile();
  const {
    data: allProfiles,
    loading,
    actions: { update, create },
  } = useUserProfiles();
  const { data: inviteData, actions } = useInviteMember();
  const [inviteOpen, setInviteOpen] = useState(false);

  // O dono também precisa visualizar o próprio perfil na equipe.
  const members = allProfiles;

  const handleRole = (profile: UserProfile, role: UserRole) => {
    if (!editing) return;
    void actions.updateAccess(profile, { role }, update);
  };

  const handlePermission = (
    profile: UserProfile,
    permission: PermissionKey,
    value: boolean,
  ) => {
    if (!editing) return;
    void actions.updateAccess(profile, { permission, value }, update);
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div>
          <h2 className="text-base font-bold tracking-tight text-primary">
            Permissões da equipe
          </h2>
          <p className="text-xs text-muted-foreground">
            Defina o perfil de acesso dos integrantes da fazenda.
          </p>
        </div>
        <Button type="button" onClick={() => setInviteOpen(true)}>
          <UserPlus />
          Novo usuário
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-muted/60 p-2.5 text-xs text-muted-foreground">
        {editing ? (
          <Unlock className="h-4 w-4 shrink-0 text-field-green" />
        ) : (
          <Lock className="h-4 w-4 shrink-0" />
        )}
        <span>
          {editing
            ? "Modo de edição ativo. Altere a função e as telas de cada membro."
            : "Modo de visualização. Clique em Editar informações para alterar acessos."}
        </span>
      </div>

      <ProfileMemberList
        profiles={members}
        loading={loading}
        editing={editing}
        savingId={inviteData.savingId}
        onChangeRole={handleRole}
        onChangePermission={handlePermission}
      />

      <InviteMemberDialog
        open={inviteOpen}
        ownerId={user?.id}
        farmName={userProfile?.farm_name}
        onCreate={create}
        onOpenChange={setInviteOpen}
      />
    </section>
  );
}
