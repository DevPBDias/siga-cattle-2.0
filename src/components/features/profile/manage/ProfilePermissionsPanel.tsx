"use client";

import { useMemo, useState } from "react";
import { Lock, Unlock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    actions: { update, upsert, remove },
  } = useUserProfiles();
  const { data: inviteData, actions } = useInviteMember();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<UserProfile | null>(null);
  const ownerId = user?.id;
  const canManageTeam = userProfile?.role === "owner";
  const organizationId =
    userProfile?.org_id ??
    (userProfile?.role === "member" ? userProfile.owner_id : user?.id);

  const members = useMemo(() => {
    return allProfiles
      .filter(
        (profile) =>
          !!ownerId &&
          (profile.id === ownerId ||
            (!!organizationId && profile.org_id === organizationId) ||
            (!profile.org_id && profile.owner_id === ownerId)),
      )
      .sort((a, b) => {
        if (a.id === ownerId) return -1;
        if (b.id === ownerId) return 1;
        if (a.role === "owner" && b.role !== "owner") return -1;
        if (b.role === "owner" && a.role !== "owner") return 1;
        const nameA = a.full_name?.trim() || a.email?.trim() || "";
        const nameB = b.full_name?.trim() || b.email?.trim() || "";
        return nameA.localeCompare(nameB, "pt-BR");
      });
  }, [allProfiles, ownerId, organizationId]);

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

  const handleDeleteMember = async () => {
    if (!memberToDelete || !ownerId) return;
    const deleted = await actions.deleteMemberAccount(
      memberToDelete,
      ownerId,
      remove,
    );
    if (deleted) setMemberToDelete(null);
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
        {canManageTeam && (
          <Button type="button" onClick={() => setInviteOpen(true)}>
            <UserPlus />
            Novo usuário
          </Button>
        )}
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
        ownerId={user?.id}
        organizationId={organizationId}
        canDeleteMembers={canManageTeam}
        onChangeRole={handleRole}
        onChangePermission={handlePermission}
        onDeleteMember={setMemberToDelete}
      />

      <Dialog
        open={memberToDelete !== null}
        onOpenChange={(open) => {
          if (!open && inviteData.savingId !== memberToDelete?.id) {
            setMemberToDelete(null);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border border-border/60 bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary">
              Excluir membro permanentemente?
            </DialogTitle>
            <DialogDescription>
              {memberToDelete?.full_name || memberToDelete?.email || "Este membro"}{" "}
              terá a conta de autenticação e o perfil excluídos. Essa ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={inviteData.savingId === memberToDelete?.id}
              onClick={() => setMemberToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              disabled={inviteData.savingId === memberToDelete?.id}
              onClick={() => void handleDeleteMember()}
            >
              {inviteData.savingId === memberToDelete?.id
                ? "Excluindo..."
                : "Excluir permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InviteMemberDialog
        open={inviteOpen}
        ownerId={user?.id}
        onCreate={upsert}
        onOpenChange={setInviteOpen}
      />
    </section>
  );
}
