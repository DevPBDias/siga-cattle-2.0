"use client";

import { useAuthContext } from "@/providers/AuthProvider";
import { useAccessContext } from "@/providers/AccessProvider";
export { getPermissionForPath } from "@/lib/auth/routeAccess";

export function useUserAccess() {
  const { data: user, isOfflineAuth } = useAuthContext();
  return { user, isOfflineAuth, ...useAccessContext() };
}
