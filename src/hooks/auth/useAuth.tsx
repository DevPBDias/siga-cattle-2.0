import { useEffect, useState, useCallback, useRef } from "react";
import type {
  User,
  Session,
  AuthChangeEvent,
  SupabaseClient,
} from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import {
  cacheAuth,
  getCachedAuth,
  clearAuthCache,
} from "@/lib/auth/offlineAuthCache";
import { clearPermissionsCache } from "@/lib/auth/permissionsCache";
import { clearAllDatabases } from "@/db/client";


/**
 * Enhanced authentication hook with offline support.
 *
 * When online: Uses Supabase auth and caches the session for offline use.
 * When offline: Uses cached session to allow access to the app.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineAuth, setIsOfflineAuth] = useState(false);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  // Initialize supabase client only on client side
  const getClient = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!supabaseRef.current) {
      supabaseRef.current = getSupabase();
    }
    return supabaseRef.current;
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && user) {
      console.log("[Auth] Usuário logado:", {
        user,
        isOfflineAuth,
      });
    }
  }, [user, isOfflineAuth]);

  useEffect(() => {
    let mounted = true;
    const supabase = getClient();

    if (!supabase) {
      // SSR or no client - check cached auth and finish
      const cachedUser = typeof window !== "undefined" ? getCachedAuth() : null;
      if (cachedUser) {
        setUser(cachedUser);
        setIsOfflineAuth(true);
      }
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        // Check if we're online
        const isOnline =
          typeof navigator !== "undefined" ? navigator.onLine : true;

        if (isOnline) {
          // Online: Try to get session from Supabase
          const { data, error } = await supabase.auth.getSession();

          if (!mounted) return;

          if (error) {
            console.warn(
              "[Auth] Supabase error, falling back to cache:",
              error.message
            );
            // Fall back to cached auth on error
            const cachedUser = getCachedAuth();
            if (cachedUser) {
              setUser(cachedUser);
              setIsOfflineAuth(true);
            }
          } else if (data.session?.user) {
            // Valid session - cache it for offline use
            setUser(data.session.user);
            cacheAuth(data.session.user);
            setIsOfflineAuth(false);
          } else {
            // No session
            setUser(null);
          }
        } else {
          // Offline: Use cached auth
          console.log("[Auth] Offline mode - checking cached auth");
          const cachedUser = getCachedAuth();
          if (cachedUser) {
            setUser(cachedUser);
            setIsOfflineAuth(true);
            console.log("[Auth] Using cached user:", cachedUser.email);
          } else {
            console.log("[Auth] No cached auth available");
            setUser(null);
          }
        }
      } catch (error) {
        console.error("[Auth] Initialization error:", error);
        // On any error, try cached auth
        const cachedUser = getCachedAuth();
        if (cachedUser && mounted) {
          setUser(cachedUser);
          setIsOfflineAuth(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes (only works when online)
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        if (session?.user) {
          // Evita re-renders desnecessarios quando o mesmo usuario e re-emitido
          setUser((prev) => {
            if (prev?.id === session.user.id) return prev;
            cacheAuth(session.user);
            return session.user;
          });
          setIsOfflineAuth(false);
        } else {
          // Only clear user if we're online (to preserve offline access)
          if (navigator.onLine) {
            setUser(null);
            clearAuthCache();
          }
        }
        setLoading(false);
      }
    );

    // Listen for online/offline events
    const handleOnline = async () => {
      console.log("[Auth] Back online - refreshing session");
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setUser(data.session.user);
          cacheAuth(data.session.user);
          setIsOfflineAuth(false);
        }
      } catch (error) {
        console.warn("[Auth] Failed to refresh session:", error);
      }
    };

    const handleOffline = () => {
      console.log("[Auth] Gone offline - preserving current auth state");
      if (user) {
        setIsOfflineAuth(true);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, [getClient]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const supabase = getClient();
      if (!supabase) {
        throw new Error("Client não inicializado");
      }

      // Check if online
      if (!navigator.onLine) {
        throw new Error(
          "Você precisa estar online para fazer login. Conecte-se à internet e tente novamente."
        );
      }

      setLoading(true);
      try {
        const res = await supabase.auth.signInWithPassword({ email, password });
        if (res.error) throw res.error;

        // Cache the auth for offline use
        if (res.data.user) {
          cacheAuth(res.data.user);
        }
      } finally {
        setLoading(false);
      }
    },
    [getClient]
  );

  const signOut = useCallback(async () => {
    const supabase = getClient();
    const remoteSignOut = supabase
      ? supabase.auth.signOut().catch((error) => {
          console.warn("[Auth] Supabase signOut failed (may be offline):", error);
        })
      : Promise.resolve();

    clearAuthCache();
    clearPermissionsCache();
    setUser(null);
    setIsOfflineAuth(false);
    await clearAllDatabases();

    // A rede pode estar indisponível. O logout local não deve ficar preso
    // esperando uma resposta do Supabase.
    await Promise.race([
      remoteSignOut,
      new Promise<void>((resolve) => setTimeout(resolve, 1500)),
    ]);
  }, [getClient]);

  return {
    data: user,
    loading,
    error: null,
    actions: {
      signIn,
      signOut,
    },
    /** True if using cached auth (offline mode) */
    isOfflineAuth,
  };
}
