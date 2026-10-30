"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { hasCachedAuth } from "@/lib/auth/offlineAuthCache";
import { getActiveTenant } from "@/config/tenant";
import { getDeviceHomeRoute } from "@/hooks/use-mobile";
import { TenantSplash } from "@/components/splash/TenantSplash";

export default function OpeningPage() {
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
    }, 600);
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!isMounted) return;

    // Se o identificador de tenant for inválido, não redireciona automaticamente
    if (!resolution.isValid) return;

    // Splash duration: 2.8 seconds
    const timer = setTimeout(() => {
      triggerRedirect();
    }, 2800);

    return () => clearTimeout(timer);
  }, [isMounted, resolution.isValid, triggerRedirect]);

  if (!isMounted) {
    let initialBg = resolution.tenant?.backgroundColor || "#1e3b2b";
    if (resolution.tenant?.id === "agro3mil") {
      initialBg = "#2B68B1";
    } else if (resolution.tenant?.id === "nelore-indi-ouro") {
      initialBg = "#081a2f";
    }

    return (
      <main
        className="relative h-dvh w-full overflow-hidden"
        style={{
          backgroundColor: initialBg,
        }}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!isExiting && (
        <TenantSplash
          key={resolution.tenant?.id || "unconfigured-tenant"}
          resolution={resolution}
          onSkip={triggerRedirect}
        />
      )}
    </AnimatePresence>
  );
}
