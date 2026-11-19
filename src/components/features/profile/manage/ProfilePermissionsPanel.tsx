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
    actions: { update, create },
  } = useUserProfiles();
  const { data: inviteData, actions } = useInviteMember();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<UserProfile | null>(null);
  const ownerId = user?.id;
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

  const handleRemoveMember = async () => {
    if (!memberToRemove || !ownerId) return;
    const removed = await actions.removeFromFarm(
      memberToRemove,
      ownerId,
      update,
    );
    if (removed) setMemberToRemove(null);
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
        ownerId={user?.id}
        onChangeRole={handleRole}
        onChangePermission={handlePermission}
        onRemoveMember={setMemberToRemove}
      />

      <Dialog
        open={memberToRemove !== null}
        onOpenChange={(open) => {
          if (!open && inviteData.savingId !== memberToRemove?.id) {
            setMemberToRemove(null);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border border-border/60 bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary">
              Remover membro da fazenda?
            </DialogTitle>
            <DialogDescription>
              {memberToRemove?.full_name || memberToRemove?.email || "Este membro"}{" "}
              perderá o vínculo e as permissões desta fazenda. A conta continuará
              existindo, mas sem acesso à equipe.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={inviteData.savingId === memberToRemove?.id}
              onClick={() => setMemberToRemove(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              disabled={inviteData.savingId === memberToRemove?.id}
              onClick={() => void handleRemoveMember()}
            >
              {inviteData.savingId === memberToRemove?.id
                ? "Removendo..."
                : "Remover membro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InviteMemberDialog
        open={inviteOpen}
        ownerId={user?.id}
        orgId={organizationId}
        farmName={userProfile?.farm_name}
        onCreate={create}
        onOpenChange={setInviteOpen}
      />
    </section>
  );
}
