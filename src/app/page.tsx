"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { hasCachedAuth } from "@/lib/auth/offlineAuthCache";
import { getActiveTenant } from "@/config/tenant";
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
      router.push(isAuthenticated ? "/home" : "/login");
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
    return (
      <main
        className="relative h-dvh w-full overflow-hidden"
        style={{
          backgroundColor: resolution.tenant?.backgroundColor || "#1e3b2b",
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
