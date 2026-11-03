/*
 * ARCH: Auth/Loading separation — verified scenarios
 *
 * 1. Offline cached (hasCachedAuth === true):
 *    → splashAlreadyShown = true immediately → children rendered, auth resolves in bg.
 *
 * 2. First login (no cache, loading === true):
 *    → shouldShowLoading = true → RouteLoadingScreen shown until auth resolves.
 *    → After resolve: user present → children; no user → redirect /login.
 *
 * 3. Reload on protected route (hasCachedAuth may be false, splash_done absent):
 *    → document.referrer !== origin+"/" → splashAlreadyShown = true → no block.
 *    → Redirect effects still run: no user → /login; bad path → /consulta|/perfil.
 *
 * 4. Session token refresh (loading briefly true, cache present):
 *    → hasCachedAuth === true → no block.
 *
 * 5. Permission guard: canAccessPath checked in redirect effect (not in loading
 *    condition), gated by initialSyncReady so premature redirects never happen.
 */
"use client";
import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserAccess } from "@/hooks/auth/useUserAccess";
import { RouteLoadingScreen } from "./RouteLoadingScreen";
import { useReplication } from "@/providers/ReplicationProvider";
import { hasCachedAuth } from "@/lib/auth/offlineAuthCache";

const SPLASH_DONE_KEY = "splash_done";
const LOADING_TIMEOUT_MS = 2000;

export default function ProtectedClient({ children }: { children: React.ReactNode }) {
  const { user, loading, canAccess, canAccessPath } = useUserAccess();
  const { initialSyncReady } = useReplication();
  const router = useRouter();
  const pathname = usePathname();
  const pathAllowed = !pathname || canAccessPath(pathname);

  const splashAlreadyShown = useRef(
    typeof window !== "undefined" &&
      (sessionStorage.getItem(SPLASH_DONE_KEY) === "1" ||
        hasCachedAuth() ||
        document.referrer === "" ||
        !document.referrer.startsWith(window.location.origin + "/") ||
        new URL(document.referrer).pathname !== "/"),
  );

  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  useEffect(() => {
    if (splashAlreadyShown.current) return;
    const timer = setTimeout(() => setLoadingTimedOut(true), LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && initialSyncReady && user && pathname && !pathAllowed) {
      router.replace(canAccess("consulta") ? "/consulta" : "/perfil");
    }
  }, [canAccess, initialSyncReady, loading, pathAllowed, pathname, router, user]);

  // Block ONLY when: not from splash/cache/reload AND auth still unknown AND no cache
  const shouldShowLoading =
    !splashAlreadyShown.current &&
    !loadingTimedOut &&
    loading &&
    !hasCachedAuth();

  if (shouldShowLoading) return <RouteLoadingScreen />;
  if (!loading && !user) return null;
  if (!user || !pathAllowed) return null;

  return <>{children}</>;
}
