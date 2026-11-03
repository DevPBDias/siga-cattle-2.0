
"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserAccess } from "@/hooks/auth/useUserAccess";
import { useReplication } from "@/providers/ReplicationProvider";

export default function ProtectedClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, canAccess, canAccessPath } = useUserAccess();
  const { initialSyncReady } = useReplication();

  const router = useRouter();
  const pathname = usePathname();

  const pathAllowed = !pathname || canAccessPath(pathname);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (
      !loading &&
      initialSyncReady &&
      user &&
      pathname &&
      !pathAllowed
    ) {
      router.replace(
        canAccess("consulta") ? "/consulta" : "/perfil"
      );
    }
  }, [
    loading,
    initialSyncReady,
    user,
    pathname,
    pathAllowed,
    canAccess,
    router,
  ]);

  // Só bloqueia por permissão de rota depois que o sync resolveu —
  // antes disso, canAccessPath pode retornar false para rotas legítimas.
  const accessDenied = initialSyncReady && !pathAllowed;

  if (loading || !user || accessDenied) {
    return null;
  }

  return <>{children}</>;
}
