"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isMobileDevice } from "@/hooks/use-mobile";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(() => isMobileDevice());

  // Redireciona automaticamente para /home no mobile (<768px)
  useEffect(() => {
    const checkAndRedirect = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        router.replace("/home");
      }
    };
    checkAndRedirect();
    window.addEventListener("resize", checkAndRedirect);
    return () => window.removeEventListener("resize", checkAndRedirect);
  }, [router]);

  if (isMobile) {
    return <div className="h-full w-full bg-background" />;
  }

  return (
    <div className="hidden md:flex flex-1 flex-col min-h-0">
      {/* Page header */}
      <div className="border-b border-border px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-semibold text-primary">Dashboard Geral</h1>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Visão consolidada do rebanho — dados em tempo real do servidor
        </p>
      </div>

      {/* Content */}
      <div className="@container/main flex flex-1 flex-col gap-3 p-4 lg:p-6">
        {/* KPI Cards */}
        <SectionCards />

        {/* Chart */}
        <div className="min-w-0">
          <ChartAreaInteractive />
        </div>

        {/* Data table */}
        <div className="min-w-0">
          <DataTable />
        </div>
      </div>
    </div>
  );
}

