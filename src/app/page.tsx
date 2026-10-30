"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { hasCachedAuth } from "@/lib/auth/offlineAuthCache";
import { getActiveTenant } from "@/config/tenant";
import { getDeviceHomeRoute } from "@/hooks/use-mobile";
import { TenantLoadingScreen } from "@/components/loading/TenantLoadingScreen";

export default function LoadingPage() {
  const router = useRouter();
  const { data: user, loading: authLoading } = useAuth();
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
      // Redireciona conforme o tipo de device: Desktop (≥768px) -> /dashboard, Mobile (<768px) -> /home
      router.push(getDeviceHomeRoute());
    }, 400);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!isMounted) return;
    if (!resolution.isValid) return;

    // Loading com a barra de carregamento ativa enquanto verifica sessão
    const timer = setTimeout(() => {
      triggerRedirect();
    }, 1800);

    return () => clearTimeout(timer);
  }, [isMounted, resolution.isValid, triggerRedirect]);

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
