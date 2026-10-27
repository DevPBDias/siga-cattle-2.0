"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { hasCachedAuth } from "@/lib/auth/offlineAuthCache";
import { activeBrand } from "@/config/branding";
import { NeloreIndiOuroSplash } from "@/components/splash/NeloreIndiOuroSplash";
import { SigaCattleSplash } from "@/components/splash/SigaCattleSplash";

export default function OpeningPage() {
  const router = useRouter();
  const { data: user, loading: authLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const redirectTriggered = useRef(false);

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

    // Splash duration: 2.8 seconds
    const timer = setTimeout(() => {
      triggerRedirect();
    }, 2800);

    return () => clearTimeout(timer);
  }, [isMounted, triggerRedirect]);

  if (!isMounted) {
    return (
      <main
        className="relative h-dvh w-full overflow-hidden"
        style={{ backgroundColor: activeBrand.colors.primary }}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!isExiting &&
        (activeBrand.id === "nelore-indi-ouro" ? (
          <NeloreIndiOuroSplash key="indi-ouro" onSkip={triggerRedirect} />
        ) : (
          <SigaCattleSplash key="siga-cattle" onSkip={triggerRedirect} />
        ))}
    </AnimatePresence>
  );
}
