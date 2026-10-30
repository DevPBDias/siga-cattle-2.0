"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { hasCachedAuth } from "@/lib/auth/offlineAuthCache";
import { getActiveTenant } from "@/config/tenant";
import { getDeviceHomeRoute } from "@/hooks/use-mobile";
import { TenantLoadingScreen } from "@/components/loading/TenantLoadingScreen";
import { useReplication } from "@/providers/ReplicationProvider";

/**
 * Tela de abertura do aplicativo (rota raiz "/").
 *
 * Aguarda auth + initialSyncReady antes de redirecionar.
 * Utiliza overlay fixo para não ocupar espaço estático no fluxo do documento.
 */
export default function LoadingPage() {
  const router = useRouter();
  const { data: user, loading: authLoading } = useAuth();
  const { initialSyncReady } = useReplication();
  const [isMounted, setIsMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const redirectTriggered = useRef(false);
  const resolution = getActiveTenant();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const triggerRedirect = useCallback(() => {
    if (redirectTriggered.current) return;
    redirectTriggered.current = true;

    setIsExiting(true);
    setTimeout(() => {
      const isAuthenticated = (!authLoading && !!user) || hasCachedAuth();
      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }
      try {
        sessionStorage.setItem("splash_done", "1");
      } catch {
        // sessionStorage indisponível (modo privado restrito)
      }
      // Desktop (≥768px) → /dashboard | Mobile (<768px) → /home
      router.replace(getDeviceHomeRoute());
    }, 250);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!isMounted) return;
    if (!resolution.isValid) return;

    if (!authLoading && initialSyncReady) {
      triggerRedirect();
      return;
    }

    const safetyTimer = setTimeout(() => {
      triggerRedirect();
    }, 3000);

    return () => clearTimeout(safetyTimer);
  }, [isMounted, resolution.isValid, authLoading, initialSyncReady, triggerRedirect]);

  if (!isMounted) {
    const initialBg = resolution.tenant?.backgroundColor || "#2B68B1";
    return (
      <main
        className="fixed inset-0 z-50 h-dvh w-full overflow-hidden"
        style={{ backgroundColor: initialBg }}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!isExiting && (
        <TenantLoadingScreen
          key={resolution.tenant?.id || "unconfigured-tenant"}
          tenantConfig={resolution.tenant ?? undefined}
        />
      )}
    </AnimatePresence>
  );
}
