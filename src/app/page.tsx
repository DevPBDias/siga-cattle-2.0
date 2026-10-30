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
 * Aguarda auth + initialSyncReady antes de redirecionar, eliminando a segunda
 * tela de loading que aparecia no WrapperAuth logo após o redirect.
 *
 * Timeout de segurança (3 s) garante que, mesmo se a replicação falhar,
 * o app não trave nesta tela.
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
        router.push("/login");
        return;
      }
      // Sinaliza que a splash já foi exibida nesta sessão.
      // O WrapperAuth lê esta flag para evitar exibir um segundo loading screen.
      try {
        sessionStorage.setItem("splash_done", "1");
      } catch {
        // sessionStorage indisponível (modo privado restrito) — sem problema
      }
      // Desktop (≥768px) → /dashboard | Mobile (<768px) → /home
      router.push(getDeviceHomeRoute());
    }, 300);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!isMounted) return;
    if (!resolution.isValid) return;

    // Redireciona assim que auth e sync estiverem prontos.
    // initialSyncReady = true quando:
    //   - Usuário não autenticado (sem sync necessário), ou
    //   - Replicação inicial já foi configurada ou falhou (app usa cache local).
    if (!authLoading && initialSyncReady) {
      triggerRedirect();
      return;
    }

    // Timeout de segurança: se auth ou sync demorar mais de 3 s, redireciona
    // assim mesmo para não deixar o usuário preso na splash.
    const safetyTimer = setTimeout(() => {
      triggerRedirect();
    }, 3000);

    return () => clearTimeout(safetyTimer);
  }, [isMounted, resolution.isValid, authLoading, initialSyncReady, triggerRedirect]);

  if (!isMounted) {
    const initialBg = resolution.tenant?.backgroundColor || "#2B68B1";
    return (
      <main
        className="relative h-dvh w-full overflow-hidden"
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
