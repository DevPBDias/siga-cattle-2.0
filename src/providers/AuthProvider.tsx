"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AuthChangeEvent, Session, SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { cacheAuth, clearAuthCache, getCachedAuth } from "@/lib/auth/offlineAuthCache";
import { clearPermissionsCache } from "@/lib/auth/permissionsCache";
import { clearAllDatabases } from "@/db/client";

interface AuthContextValue {
  data: User | null;
  loading: boolean;
  error: null;
  isOfflineAuth: boolean;
  actions: { signIn: (email: string, password: string) => Promise<void>; signOut: () => Promise<void> };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineAuth, setIsOfflineAuth] = useState(false);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const getClient = useCallback(() => {
    if (typeof window === "undefined") return null;
    supabaseRef.current ??= getSupabase();
    return supabaseRef.current;
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = getClient();
    if (!supabase) {
      const cachedUser = getCachedAuth();
      if (cachedUser) { setUser(cachedUser); setIsOfflineAuth(true); }
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const online = typeof navigator === "undefined" || navigator.onLine;
        if (!online) {
          const cachedUser = getCachedAuth();
          if (cachedUser) { setUser(cachedUser); setIsOfflineAuth(true); }
        } else {
          const { data, error } = await supabase.auth.getSession();
          if (!mounted) return;
          if (error) {
            const cachedUser = getCachedAuth();
            if (cachedUser) { setUser(cachedUser); setIsOfflineAuth(true); }
          } else if (data.session?.user) {
            setUser(data.session.user); cacheAuth(data.session.user); setIsOfflineAuth(false);
          } else setUser(null);
        }
      } catch {
        const cachedUser = getCachedAuth();
        if (cachedUser && mounted) { setUser(cachedUser); setIsOfflineAuth(true); }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void initAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user); cacheAuth(session.user); setIsOfflineAuth(false);
        } else if (typeof navigator === "undefined" || navigator.onLine) {
          setUser(null); clearAuthCache(); clearPermissionsCache();
        }
        setLoading(false);
      },
    );
    const handleOnline = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted || !data.session?.user) return;
      setUser(data.session.user); cacheAuth(data.session.user); setIsOfflineAuth(false);
    };
    const handleOffline = () => { if (mounted) setIsOfflineAuth(true); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [getClient]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getClient();
    if (!supabase) throw new Error("Cliente não inicializado");
    if (!navigator.onLine) throw new Error("Você precisa estar online para fazer login.");
    // Não reutilizar uma decisão de autorização antiga durante um novo login.
    clearPermissionsCache();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) cacheAuth(data.user);
    } finally { setLoading(false); }
  }, [getClient]);

  const signOut = useCallback(async () => {
    const supabase = getClient();
    clearAuthCache(); clearPermissionsCache(); setUser(null); setIsOfflineAuth(false);
    await clearAllDatabases();
    await Promise.race([
      supabase?.auth.signOut().catch(() => undefined) ?? Promise.resolve(),
      new Promise<void>((resolve) => setTimeout(resolve, 1500)),
    ]);
  }, [getClient]);

  const value = useMemo(() => ({ data: user, loading, error: null, isOfflineAuth, actions: { signIn, signOut } }), [isOfflineAuth, loading, signIn, signOut, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
