"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  Scale,
  Syringe,
  Heart,
  Baby,
  Truck,
  ShoppingCart,
  CalendarDays,
  TrendingUp,
  FileBarChart2,
  Plus,
  Beef,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { SyncStatusIndicator } from "@/components/sync/SyncStatusIndicator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useUserAccess } from "@/hooks/auth/useUserAccess";
import logo_hor_siga_cattle from "@/assets/icons/logo_hor_siga_cattle.png";
import Image from "next/image";

const navMain = [
  {
    title: "Dashboard Geral",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Rebanho & Consulta",
    url: "/consulta",
    icon: Beef,
  },
  {
    title: "Gerenciar Animais",
    url: "/gerenciar",
    icon: ClipboardList,
  },
  {
    title: "Pesagem",
    url: "/pesagem-ce",
    icon: Scale,
  },
  {
    title: "Sanitário & Vacinas",
    url: "/vacinas",
    icon: Syringe,
  },
  {
    title: "Reprodução & IATF",
    url: "/reproducao",
    icon: Heart,
  },
  {
    title: "Maternidade & Nascimentos",
    url: "/nascimentos",
    icon: Baby,
  },
  {
    title: "Movimentações & Mortes",
    url: "/movimentacoes",
    icon: Truck,
  },
  {
    title: "Comercial / Vendas",
    url: "/comercial",
    icon: ShoppingCart,
  },
  {
    title: "Agenda & Calendário",
    url: "/calendario",
    icon: CalendarDays,
  },
];

const navOwner = [
  {
    title: "Evolução do Rebanho",
    url: "/geral/evolucao",
    icon: TrendingUp,
  },
  {
    title: "Relatórios & Exportação",
    url: "/geral",
    icon: FileBarChart2,
  },
];

const navSecondary = [
  {
    title: "Meu Perfil",
    url: "/perfil",
    icon: Users,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, role } = useUserAccess();

  const displayName =
    user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "Usuário";
  const email = user?.email ?? "";
  const avatar = user?.user_metadata?.avatar_url ?? "";

  const fullNavMain = role === "owner" ? [...navMain, ...navOwner] : navMain;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="flex flex-row justify-between items center">
        {/* Logo + nome do sistema */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-2!"
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                <Image
                  src={logo_hor_siga_cattle}
                  alt="SIGA Cattle"
                  width={100}
                  height={18}
                  className="ntain"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Botão de atalho rápido */}
        <div className="w-full">
          <SyncStatusIndicator />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={fullNavMain} />
      </SidebarContent>

      <SidebarSeparator />

      {/* Status de Sincronização no rodapé */}
      <div className="px-3 py-2">
        <Link
          href="/cadastro"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-white/15 px-2 py-2 text-xs font-bold text-white border border-white/20 shadow-sm transition-all hover:bg-white/25 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Novo Animal
        </Link>
      </div>

      <SidebarFooter>
        <NavUser
          user={{
            name: displayName,
            email,
            avatar,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
