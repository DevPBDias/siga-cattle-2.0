"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { cachePermissions, getCachedPermissions } from "@/lib/auth/permissionsCache";
import { useAuthContext } from "./AuthProvider";
import { getPermissionForPath } from "@/lib/auth/routeAccess";
import { canAccessPermission, getEffectivePermissions, getEffectiveRole, type PermissionKey, type UserPermissions, type UserRole } from "@/types/permissions.type";

interface AccessContextValue {
  role: UserRole;
  permissions: UserPermissions | undefined;
  loading: boolean;
  isConnectionOffline: boolean;
  canAccess: (key: PermissionKey) => boolean;
  canAccessPath: (pathname: string) => boolean;
}
const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: ReactNode }) {
  const { data: user, loading: authLoading, isOfflineAuth } = useAuthContext();
  const [role, setRole] = useState<UserRole>("member");
  const [permissions, setPermissions] = useState<UserPermissions>();
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const isConnectionOffline = typeof navigator !== "undefined" && !navigator.onLine;

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setRole("member"); setPermissions(undefined); setPermissionsLoading(false);
      return () => { active = false; };
    }
    const cached = getCachedPermissions(user.id);
    if (cached) {
      setRole(cached.role); setPermissions(cached.permissions); setPermissionsLoading(false);
    } else {
      setRole("member"); setPermissions(undefined); setPermissionsLoading(true);
    }
    if (isConnectionOffline || isOfflineAuth) {
      setPermissionsLoading(false);
      return () => { active = false; };
    }
    void Promise.resolve(getSupabase().from("user_profiles").select("id, role, permissions").eq("id", user.id).maybeSingle())
      .then(({ data, error }) => {
        if (!active) return;

        // Uma falha de rede/RLS ou um perfil ainda não sincronizado não pode
        // rebaixar um dono já reconhecido pelo cache local para member.
        if (error || !data) {
          if (process.env.NODE_ENV !== "production" && error) {
            console.warn("[Access] Não foi possível carregar user_profiles:", error.message);
          }
          const latestCached = getCachedPermissions(user.id);
          if (latestCached) {
            setRole(latestCached.role);
            setPermissions(latestCached.permissions);
          }
          return;
        }

        const nextRole = getEffectiveRole(data.role);
        const nextPermissions = getEffectivePermissions(nextRole, data.permissions);
        setRole(nextRole);
        setPermissions(nextPermissions);
        cachePermissions({ userId: user.id, role: nextRole, permissions: nextPermissions });
      })
      .catch(() => undefined)
      .finally(() => { if (active) setPermissionsLoading(false); });
    return () => { active = false; };
  }, [isConnectionOffline, isOfflineAuth, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const handleUpdate = (event: Event) => {
      const eventUserId = (event as CustomEvent<{ userId?: string }>).detail?.userId;
      if (eventUserId && eventUserId !== user.id) return;
      const cached = getCachedPermissions(user.id);
      if (!cached) return;
      setRole(cached.role); setPermissions(cached.permissions); setPermissionsLoading(false);
    };
    window.addEventListener("rico-ouro-permissions-updated", handleUpdate);
    return () => window.removeEventListener("rico-ouro-permissions-updated", handleUpdate);
  }, [user?.id]);

  const loading = authLoading || permissionsLoading;
  const canAccess = (key: PermissionKey) => canAccessPermission(role, permissions, key);
  const canAccessPath = (pathname: string) => {
    if (loading) return false;
    const key = getPermissionForPath(pathname);
    if (!key) return pathname === "/perfil";
    return canAccessPermission(role, permissions, key);
  };
  const value = useMemo(() => ({ role, permissions, loading, isConnectionOffline, canAccess, canAccessPath }), [isConnectionOffline, loading, permissions, role]);
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccessContext() {
  const context = useContext(AccessContext);
  if (!context) throw new Error("useUserAccess deve ser usado dentro de AccessProvider");
  return context;
}
