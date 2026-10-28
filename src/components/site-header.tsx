"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/consulta": "Rebanho & Consulta",
  "/gerenciar": "Gerenciar Animais",
  "/pesagem-ce": "Pesagem",
  "/vacinas": "Sanitário & Vacinas",
  "/reproducao": "Reprodução & IATF",
  "/nascimentos": "Maternidade & Nascimentos",
  "/movimentacoes": "Movimentações",
  "/mortes": "Mortes",
  "/comercial": "Comercial / Vendas",
  "/calendario": "Agenda & Calendário",
  "/geral/evolucao": "Evolução do Rebanho",
  "/geral": "Relatórios & Exportação",
  "/perfil": "Meu Perfil",
  "/cadastro": "Novo Cadastro",
};

export function SiteHeader() {
  const pathname = usePathname();

  // Determinar label da página atual
  const currentLabel = ROUTE_LABELS[pathname ?? ""] ?? "SIGA Cattle";

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <span className="text-xs text-muted-foreground font-medium">SIGA Cattle</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-semibold text-primary">
                {currentLabel}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
