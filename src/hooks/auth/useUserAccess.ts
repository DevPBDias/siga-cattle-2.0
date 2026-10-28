"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { getSupabase } from "@/lib/supabase/client";
import {
  APP_PERMISSIONS,
  canAccessPermission,
  getEffectivePermissions,
  getEffectiveRole,
  PermissionKey,
  UserPermissions,
  UserRole,
} from "@/types/permissions.type";
import {
  cachePermissions,
  getCachedPermissions,
} from "@/lib/auth/permissionsCache";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

export function getPermissionForPath(pathname: string): PermissionKey | null {
  if (pathname === "/" || pathname === "/home") return "home";
  const permission = APP_PERMISSIONS
    .slice()
    .sort((a, b) => b.route.length - a.route.length)
    .find((item) => pathname === item.route || pathname.startsWith(`${item.route}/`));
  return permission?.key ?? null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Simplified access hook.
 *
 * Strategy:
 *  1. Read role+permissions from localStorage synchronously (no flash).
 *  2. Fetch the real profile from Supabase once per user session.
 *  3. Update the cache whenever a fresh profile arrives.
 *
 * The guard never sees an "uncertain" null state: if the cache has data,
 * it's used immediately. If not, we wait until Supabase responds.
 */
export function useUserAccess() {
  const { data: user, loading: authLoading, isOfflineAuth } = useAuth();
  const isConnectionOffline =
    typeof navigator !== "undefined" && !navigator.onLine;

  // ── Permissions state ────────────────────────────────────────────────────
  // Initialise synchronously from localStorage so the guard never flashes.
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window === "undefined" || !user?.id) return "member";
    return getCachedPermissions(user.id)?.role ?? "member";
  });
  const [permissions, setPermissions] = useState<UserPermissions | undefined>(
    () => {
      if (typeof window === "undefined" || !user?.id) return undefined;
      return getCachedPermissions(user.id)?.permissions;
    }
  );

  // True while we don't yet have confirmed permissions for this user.
  // Starts as false if we already have cached data; true otherwise.
  const [permissionsLoading, setPermissionsLoading] = useState<boolean>(() => {
    if (typeof window === "undefined" || !user?.id) return true;
    return getCachedPermissions(user.id) === null;
  });

  // Track which user ID we already fetched to avoid duplicate requests.
  const fetchedUserIdRef = useRef<string | null>(null);

  // ── Fetch from Supabase once per user ───────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      fetchedUserIdRef.current = null;
      setPermissionsLoading(false);
      return;
    }

    // Already fetched for this user in this session — nothing to do.
    if (fetchedUserIdRef.current === user.id) return;

    // If we have a cached value, show it immediately and refresh in background.
    const cached = getCachedPermissions(user.id);
    if (cached) {
      setRole(cached.role);
      setPermissions(cached.permissions);
      setPermissionsLoading(false);
    }

    // Skip remote fetch when offline.
    if (isConnectionOffline) {
      setPermissionsLoading(false);
      return;
    }

    fetchedUserIdRef.current = user.id;
    let active = true;

    Promise.resolve(
      getSupabase()
        .from("user_profiles")
        .select("id, role, permissions")
        .eq("id", user.id)
        .maybeSingle()
    )
      .then(({ data: profile, error }) => {
        if (!active || error || !profile) return;

        const freshRole = getEffectiveRole(
          (profile as { role?: UserRole }).role
        );
        const freshPermissions = getEffectivePermissions(
          freshRole,
          (profile as { permissions?: UserPermissions }).permissions,
        );

        setRole(freshRole);
        setPermissions(freshPermissions);
        cachePermissions({
          userId: user.id,
          role: freshRole,
          permissions: freshPermissions,
        });
      })
      .catch(() => {
        // Network error — keep whatever we had (cache or default).
      })
      .finally(() => {
        if (active) setPermissionsLoading(false);
      });

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isConnectionOffline]);

  // ── Reset when user changes ──────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      setRole("member");
      setPermissions(undefined);
      setPermissionsLoading(true);
    }
  }, [user?.id]);

  // Todas as partes da Home usam instÃ¢ncias independentes deste hook. O
  // evento garante que todas adotem o perfil atualizado imediatamente.
  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return;

    const handlePermissionsUpdated = (event: Event) => {
      const eventUserId = (event as CustomEvent<{ userId?: string }>).detail
        ?.userId;
      if (eventUserId && eventUserId !== user.id) return;

      const cached = getCachedPermissions(user.id);
      if (!cached) return;

      setRole(cached.role);
      setPermissions(cached.permissions);
      setPermissionsLoading(false);
    };

    window.addEventListener(
      "rico-ouro-permissions-updated",
      handlePermissionsUpdated,
    );

    return () =>
      window.removeEventListener(
        "rico-ouro-permissions-updated",
        handlePermissionsUpdated,
      );
  }, [user?.id]);

  // ── Dev diagnostics ─────────────────────────────────────────────────────
  /*useEffect(() => {
    if (process.env.NODE_ENV !== "production" && user) {
      console.log("[Auth] Diagnóstico de acesso:", {
        userId: user.id,
        role,
        permissions,
        permissionsLoading,
        isConnectionOffline,
        isOfflineAuth,
      });
    }
  }, [user, role, permissions, permissionsLoading, isConnectionOffline, isOfflineAuth]);*/

  // ── Derived loading state ─────────────────────────────────────────────────
  // Only show "loading" if auth itself isn't resolved yet, or if we have
  // no permissions at all (first login, no cache). A background refresh
  // never blocks navigation.
  const loading = authLoading || permissionsLoading;

  // ── canAccessPath ────────────────────────────────────────────────────────
  const canAccessPath = useCallback((pathname: string): boolean => {
    if (loading) return true; // Don't block while loading
    const key = getPermissionForPath(pathname);

    // Primeiro acesso: o usuário autenticado precisa conseguir chegar ao
    // início e concluir o cadastro do próprio perfil. Sem esse escape seguro,
    // a ausência de uma linha em user_profiles manda o usuário para /perfil e
    // remove o início da navegação, deixando-o preso nessa tela.
    if (permissions === undefined && (key === "home" || pathname === "/perfil")) {
      return true;
    }

    if (!key) return pathname === "/perfil" || role === "owner";
    return canAccessPermission(role, permissions, key);
  }, [loading, permissions, role]);

  return {
    user,
    role,
    permissions,
    isOfflineAuth,
    isConnectionOffline,
    loading,
    canAccess: (key: PermissionKey) => canAccessPermission(role, permissions, key),
    canAccessPath,
  };
}
