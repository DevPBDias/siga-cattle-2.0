"use client";

import { useState } from "react";
import { Building2, Pencil, Save, ShieldCheck, UserRound } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutBtn";
import { ProfileFarmForm } from "@/components/features/profile/form/ProfileFarmForm";
import { ProfileUserForm } from "@/components/features/profile/form/ProfileUserForm";
import { ProfilePermissionsPanel } from "@/components/features/profile/manage/ProfilePermissionsPanel";
import { Button } from "@/components/ui/button";
import { StandardTabList } from "@/components/ui/StandardTabList";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useUserAccess } from "@/hooks/auth/useUserAccess";
import { useFarmProfileForm } from "@/hooks/forms/useFarmProfileForm";
import { useProfileForm } from "@/hooks/forms/useProfileForm";

const BASE_TABS = [
  { value: "usuario", label: "Usuário", icon: UserRound },
  { value: "fazenda", label: "Fazenda", icon: Building2 },
];

const OWNER_TAB = { value: "permissoes", label: "Permissões", icon: ShieldCheck };

export function ProfileWorkspace() {
  const { role } = useUserAccess();
  const userForm = useProfileForm();
  const farmForm = useFarmProfileForm();
  const [tab, setTab] = useState("usuario");
  const [permissionsEditing, setPermissionsEditing] = useState(false);

  const tabs = role === "owner" ? [...BASE_TABS, OWNER_TAB] : BASE_TABS;
  const isPermissions = tab === "permissoes";
  const activeForm = tab === "fazenda" ? farmForm : userForm;
  const saving = userForm.saving || farmForm.saving;
  const editing = isPermissions ? permissionsEditing : activeForm.data.editing;

  const handleEditButton = () => {
    if (isPermissions) {
      setPermissionsEditing((current) => !current);
      return;
    }
    if (activeForm.data.editing) {
      void activeForm.actions.save();
      return;
    }
    activeForm.actions.startEdit();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-base font-extrabold text-white">
          {userForm.data.initials || <UserRound className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold leading-tight text-primary">
            {userForm.data.displayName}
          </h2>
          <span className="text-xs text-muted-foreground">
            {role === "owner" ? "Administrador da fazenda" : "Membro da fazenda"}
          </span>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <StandardTabList
          tabs={tabs}
          activeTab={tab}
          onTabChange={setTab}
          variant="simple"
        />

        <Button
          type="button"
          className="w-full"
          disabled={saving || (tab === "usuario" && userForm.loading)}
          onClick={handleEditButton}
        >
          {saving ? (
            "Salvando..."
          ) : editing ? (
            <>
              <Save /> Salvar alterações
            </>
          ) : (
            <>
              <Pencil /> Editar informações
            </>
          )}
        </Button>

        <TabsContent value="usuario">
          <ProfileUserForm
            values={userForm.data.values}
            editing={userForm.data.editing}
            loading={userForm.loading}
            error={userForm.error}
            onChange={userForm.actions.setField}
          />
        </TabsContent>
        <TabsContent value="fazenda">
          <ProfileFarmForm
            values={farmForm.data.values}
            editing={farmForm.data.editing}
            error={farmForm.error}
            onChange={farmForm.actions.setField}
          />
        </TabsContent>
        {role === "owner" && (
          <TabsContent value="permissoes">
            <ProfilePermissionsPanel editing={permissionsEditing} />
          </TabsContent>
        )}
      </Tabs>

      {tab === "usuario" && <LogoutButton />}
    </div>
  );
}
