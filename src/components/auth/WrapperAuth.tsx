import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useUserAccess } from "@/hooks/auth/useUserAccess";
import LoadingScreen from "./LoadingScreen";

export default function ProtectedClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    user,
    role,
    loading,
    canAccessPath,
    isConnectionOffline,
  } = useUserAccess();
  const router = useRouter();
  const pathname = usePathname();

  // canAccessPath already returns true while loading, so this is clean.
  const pathAllowed = !pathname || canAccessPath(pathname);

  /*useEffect(() => {
    if (process.env.NODE_ENV !== "production" && user && pathname) {
      console.log("[Auth] Rota protegida avaliada:", {
        pathname,
        role,
        loading,
        pathAllowed,
      });
    }
  }, [user, pathname, role, loading, pathAllowed]); */

  // Redirect to login if not authenticated.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Redirect to permitted screen when loading is fully done and path is blocked.
  useEffect(() => {
    if (!loading && user && pathname && !pathAllowed) {
      if (canAccessPath("/consulta")) {
        router.replace("/consulta");
      } else {
        router.replace("/perfil");
      }
    }
  }, [loading, user, pathname, pathAllowed, router, canAccessPath]);

  if (loading) return <LoadingScreen />;

  if (!user) return null;

  if (isConnectionOffline && !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div className="max-w-sm space-y-2">
          <h1 className="text-lg font-bold text-primary">Perfil não sincronizado</h1>
          <p className="text-sm text-muted-foreground">
            Conecte-se à internet para sincronizar seu perfil e carregar suas permissões antes de usar o aplicativo offline.
          </p>
        </div>
      </div>
    );
  }

  if (!pathAllowed) return null;

  return <div>{children}</div>;
}
