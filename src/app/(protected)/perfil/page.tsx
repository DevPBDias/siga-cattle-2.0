"use client";

import ProtectedClient from "@/components/auth/WrapperAuth";
import { ProfileWorkspace } from "@/components/features/profile/ProfileWorkspace";
import ShortHeader from "@/components/layout/ShortHeader";

export default function ProfilePage() {
  return (
    <ProtectedClient>
      <div className="min-h-screen bg-background pb-12">
        <ShortHeader title="Meu Perfil" />
        <main className="mx-auto max-w-lg space-y-4 p-4">
          <ProfileWorkspace />
        </main>
      </div>
    </ProtectedClient>
  );
}
