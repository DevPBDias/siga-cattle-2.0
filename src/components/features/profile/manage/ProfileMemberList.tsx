"use client";

import { Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_PERMISSIONS, PermissionKey, UserRole } from "@/types/permissions.type";
import { UserProfile } from "@/types/user_profile.type";

interface ProfileMemberListProps {
  profiles: UserProfile[];
  loading: boolean;
  editing: boolean;
  savingId: string | null;
  onChangeRole: (profile: UserProfile, role: UserRole) => void;
  onChangePermission: (profile: UserProfile, key: PermissionKey, value: boolean) => void;
}

export function ProfileMemberList({
  profiles,
  loading,
  editing,
  savingId,
  onChangeRole,
  onChangePermission,
}: ProfileMemberListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">
          Nenhum membro cadastrado na equipe ainda.
        </p>
        <p className="text-xs text-muted-foreground/70">
          Toque em “Novo usuário” para convidar o primeiro integrante.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {profiles.map((profile) => {
        const profileRole = profile.role === "member" ? "member" : "owner";
        const isSaving = savingId === profile.id;
        const title = profile.full_name || profile.email || profile.id;

        return (
          <article
            key={profile.id}
            className="space-y-3 rounded-2xl border border-border/60 bg-muted/40 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-primary">{title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile.email || "E-mail não informado"}
                </p>
              </div>
              <Select
                value={profileRole}
                disabled={!editing || isSaving}
                onValueChange={(value) => onChangeRole(profile, value as UserRole)}
              >
                <SelectTrigger
                  aria-label={`Função de ${title}`}
                  className="w-[110px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {profileRole === "member" && (
              <div className="grid grid-cols-2 gap-1.5">
                {APP_PERMISSIONS.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex min-h-9 items-center gap-2 rounded-md border border-border/60 bg-card px-2 text-xs font-semibold text-primary"
                  >
                    <Checkbox
                      checked={profile.permissions?.[key] === true}
                      disabled={!editing || isSaving}
                      onCheckedChange={(checked) =>
                        onChangePermission(profile, key, checked === true)
                      }
                    />
                    <span className="truncate">{label}</span>
                  </label>
                ))}
              </div>
            )}
            {isSaving && (
              <p className="text-xs text-muted-foreground">Salvando...</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
