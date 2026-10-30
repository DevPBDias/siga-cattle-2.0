import React, { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserAccess } from "@/hooks/auth/useUserAccess";
import LoadingScreen from "./LoadingScreen";
import { useReplication } from "@/providers/ReplicationProvider";
import { hasCachedAuth } from "@/lib/auth/offlineAuthCache";

/**
 * Chave de sessionStorage usada para sinalizar que a tela de splash
 * já foi exibida nesta sessão de navegação.
 *
 * O `page.tsx` (rota raiz) seta esta flag logo antes de redirecionar,
 * garantindo que o WrapperAuth não exiba um segundo loading screen
 * quando o usuário chega numa rota protegida vindo da splash.
 */
const SPLASH_DONE_KEY = "splash_done";

export default function ProtectedClient({ children }: { children: React.ReactNode }) {
  const { user, loading, canAccess, canAccessPath } = useUserAccess();
  const { initialSyncReady } = useReplication();
  const router = useRouter();
  const pathname = usePathname();
  const pathAllowed = !pathname || canAccessPath(pathname);

  // Se a splash já foi exibida nesta sessão, não bloqueamos a rota com
  // outro loading. O usuário autenticado (ou com cache válido) é liberado
  // imediatamente enquanto o auth finaliza em background.
  const splashAlreadyShown = useRef(
    typeof window !== "undefined" &&
      (sessionStorage.getItem(SPLASH_DONE_KEY) === "1" || hasCachedAuth()),
  );

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && initialSyncReady && user && pathname && !pathAllowed) {
      router.replace(canAccess("consulta") ? "/consulta" : "/perfil");
    }
  }, [canAccess, initialSyncReady, loading, pathAllowed, pathname, router, user]);

  // Exibir loading apenas quando:
  //   1. O splash NÃO foi exibido nesta sessão (primeira navegação sem cache), E
  //   2. O auth ainda está carregando OU o sync ainda não está pronto
  const shouldShowLoading =
    !splashAlreadyShown.current && (loading || (!!user && !initialSyncReady));

  if (shouldShowLoading) return <LoadingScreen />;
  if (!loading && !user) return null;
  if (!user || !pathAllowed) return null;
  return <div>{children}</div>;
}
