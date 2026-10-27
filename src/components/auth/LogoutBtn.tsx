"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { LogOut, LucideClockFading } from "lucide-react";

export default function LogoutButton() {
  const {
    actions: { signOut },
  } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await Promise.race([
        signOut(),
        new Promise<void>((resolve) => setTimeout(resolve, 2500)),
      ]);
      router.replace("/login");
    } catch (err) {
      console.error("Erro ao finalizar a sessão:", err);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className="flex mt-20 min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border-destructive/30 text-xs font-extrabold text-destructive hover:bg-destructive/5"
      >
        {loading ? <LucideClockFading size={18} /> : <LogOut size={18} />}
        Sair da conta
      </Button>

      {confirmOpen && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="space-y-1">
              <h2 id="logout-title" className="text-base font-bold text-primary">
                Sair da conta?
              </h2>
              <p className="text-sm text-muted-foreground">
                A sessão, o token e os dados locais deste dispositivo serão removidos.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => setConfirmOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={loading}
                onClick={() => void handleLogout()}
              >
                {loading ? "Saindo..." : "Confirmar saída"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
