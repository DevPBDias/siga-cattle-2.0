"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { motion } from "framer-motion";
import loginImg from "@/assets/images/login-page.png";
import logoImg from "@/assets/icons/logo_siga_cattle.png";
import { hasCachedAuth } from "@/lib/auth/offlineAuthCache";

export default function LoginPage() {
  const {
    actions: { signIn },
    data: user,
    loading,
  } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Track online status
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Redirect if user is authenticated (or has cached auth when offline)
  useEffect(() => {
    if (!loading && user) {
      router.push("/home");
    }

    // If offline but has cached auth, redirect to home
    // The WrapperAuth will handle showing offline mode
    if (!loading && !user && !isOnline && hasCachedAuth()) {
      console.log("[Login] Offline with cached auth - redirecting to home");
      router.push("/home");
    }
  }, [user, loading, router, isOnline]);

  if (loading || user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLocal(true);
    setErr(null);
    try {
      await signIn(email, password);
    } catch (error: unknown) {
      const message =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Erro ao autenticar";
      setErr(message);
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <motion.main
      key="home"
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: 1.2,
        ease: "easeInOut",
      }}
      className="relative p-6 flex flex-col gap-6 items-center
      justify-center w-full min-h-dvh"
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src={logoImg}
          className="absolute top-6 left-1/2 transform -translate-x-1/2 w-52 h-40 object-contain z-10"
          alt="cow login page"
          priority
        />
        <Image
          src={loginImg}
          className="w-full h-full object-cover"
          alt="cow login page"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/40 to-black/60" />
      </div>
      <form
        onSubmit={handleSubmit}
        className="absolute bottom-4 flex w-full max-w-sm flex-col gap-4 rounded-lg border border-white/20 bg-primary/80 p-6 shadow-lg backdrop-blur-sm"
      >
        <div className="mt-1 flex flex-col gap-1">
          <label
            htmlFor="email"
            className="text-sm font-bold text-white uppercase"
          >
            E-mail:
          </label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            required
            id="email"
            className="h-10 rounded-lg border-2 border-white/80 bg-card pl-2 text-base font-medium text-foreground placeholder:text-muted-foreground placeholder:italic focus-visible:border-indi-ouro focus-visible:ring-2 focus-visible:ring-indi-ouro/70"
            type="email"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="password"
            className="text-sm font-bold text-white uppercase"
          >
            Senha:
          </label>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            id="password"
            type="password"
            className="h-10 rounded-lg border-2 border-white/80 bg-card pl-2 text-base font-medium text-foreground placeholder:text-muted-foreground placeholder:italic focus-visible:border-indi-ouro focus-visible:ring-2 focus-visible:ring-indi-ouro/70"
            required
          />
        </div>

        {err && (
          <div className="text-red-600 bg-red-100 p-2 rounded">{err}</div>
        )}

        {/* Offline warning */}
        {!isOnline && (
          <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 p-3 rounded-lg text-sm">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a5 5 0 010-7.072M13 12a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
            <span>
              Você está offline. Conecte-se à internet para fazer login.
            </span>
          </div>
        )}

        <Button
          disabled={loadingLocal || !isOnline}
          type="submit"
          className="uppercase text-sm font-bold mt-4"
        >
          {loadingLocal ? "Entrando..." : !isOnline ? "Sem conexão" : "Entrar"}
        </Button>
      </form>
    </motion.main>
  );
}
