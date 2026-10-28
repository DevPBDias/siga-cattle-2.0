"use client";

import ProtectedClient from "@/components/auth/WrapperAuth";
import { MobileFooter } from "@/components/layout/MobileFooter";
import { ReportsProvider } from "@/context/ReportsContext";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedClient>
      <ReportsProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          {/* Sidebar visível apenas em telas médias e grandes (Desktop/Notebook >= 768px) */}
          <div className="hidden md:block">
            <AppSidebar variant="inset" />
          </div>

          <SidebarInset className="min-h-screen bg-background flex flex-col">
            {/* Header com breadcrumbs visível apenas no desktop */}
            <div className="hidden md:block">
              <SiteHeader />
            </div>

            {/* Conteúdo principal fluido */}
            <main className="flex-1 flex flex-col min-w-0">
              {children}
            </main>

            {/* Rodapé fixo mobile visível apenas em telas pequenas (< 768px) */}
            <MobileFooter />
          </SidebarInset>
        </SidebarProvider>
      </ReportsProvider>
    </ProtectedClient>
  );
}
