import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserAccess } from "@/hooks/auth/useUserAccess";
import LoadingScreen from "./LoadingScreen";
import { useReplication } from "@/providers/ReplicationProvider";

export default function ProtectedClient({ children }: { children: React.ReactNode }) {
  const { user, loading, canAccess, canAccessPath } = useUserAccess();
  const { initialSyncReady } = useReplication();
  const router = useRouter();
  const pathname = usePathname();
  const pathAllowed = !pathname || canAccessPath(pathname);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && initialSyncReady && user && pathname && !pathAllowed) {
      router.replace(canAccess("consulta") ? "/consulta" : "/perfil");
    }
  }, [canAccess, initialSyncReady, loading, pathAllowed, pathname, router, user]);

  if (loading || (user && !initialSyncReady)) return <LoadingScreen />;
  if (!user || !pathAllowed) return null;
  return <div>{children}</div>;
}
