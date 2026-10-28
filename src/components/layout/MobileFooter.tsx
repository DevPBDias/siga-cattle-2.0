"use client";

import { CalendarDays, Home, UserRound, ClipboardPen, ChartLine } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useUserAccess } from "@/hooks/auth/useUserAccess";

const items = [
  { label: "Início", icon: Home, href: "/home" },
  { label: "Calendário", icon: CalendarDays, href: "/calendario" },
  { label: "Cadastro", icon: ClipboardPen, href: "/cadastro" },
  { label: "Evolução", icon: ChartLine, href: "/geral/evolucao" },
  { label: "Perfil", icon: UserRound, href: "/perfil" },
];

export function MobileFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const { canAccessPath, loading } = useUserAccess();
  const visibleItems = loading
    ? []
    : items.filter((item) => canAccessPath(item.href));

  return (
    <nav
      className="fixed z-10 bottom-0 left-0 right-0 bg-white/95 border-t border-border flex justify-between gap-[clamp(12px,8vw,92px)] px-6 py-1.5 backdrop-blur-md md:hidden"
      aria-label="Navegação principal"
    >
      {visibleItems.map(({ label, icon: Icon, href }) => {
        const active =
          href === "/home"
            ? pathname === "/home" || pathname === "/"
            : pathname?.startsWith(href);
        return (
          <button
            key={label}
            className={`border-0 rounded-[14px] flex flex-col items-center justify-center gap-1 text-[9px] cursor-pointer transition-all ${active
              ? "text-field-green font-extrabold"
              : "text-[#809086]"
              }`}
            onClick={() => router.push(href)}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="w-4 h-4 transition-transform" />
            <span className="tracking-tight uppercase">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
