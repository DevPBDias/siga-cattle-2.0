"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isMobileDevice } from "@/hooks/use-mobile";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { LayoutDashboard } from "lucide-react";
import { useFarms } from "@/hooks/db/farms/useFarms";
import { useUserAccess } from "@/hooks/auth/useUserAccess";
import { useUserProfile } from "@/hooks/db/user_profiles/useUserProfile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(() => isMobileDevice());
  const [selectedFarmId, setSelectedFarmId] = useState("all");
  const { data: farms = [], loading: farmsLoading, error: farmsError } = useFarms();
  const { role, loading: accessLoading } = useUserAccess();
  const {
    data: userProfile,
    loading: profileLoading,
    error: profileError,
  } = useUserProfile();

  const memberFarm = useMemo(() => {
    const profileFarmName = userProfile?.farm_name?.trim().toLowerCase();
    if (role !== "member" || !profileFarmName) return null;
    return farms.find((farm) => farm.farm_name.trim().toLowerCase() === profileFarmName) ?? null;
  }, [farms, role, userProfile?.farm_name]);

  const effectiveFarmId =
    role === "member"
      ? memberFarm?.id ?? ""
      : selectedFarmId === "all"
        ? undefined
        : selectedFarmId;

  useEffect(() => {
    if (
      selectedFarmId !== "all" &&
      !farmsLoading &&
      !farms.some((farm) => farm.id === selectedFarmId)
    ) {
      setSelectedFarmId("all");
    }
  }, [farms, farmsLoading, selectedFarmId]);

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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-primary" />
              <h1 className="text-sm font-semibold text-primary">Dashboard Geral</h1>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Indicadores atualizados com os dados locais sincronizados
            </p>
          </div>
          {role === "owner" ? (
            <div className="flex items-center gap-2">
              <label htmlFor="dashboard-farm-filter" className="text-xs font-semibold text-muted-foreground">
                Fazenda
              </label>
              <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                <SelectTrigger id="dashboard-farm-filter" className="w-52" aria-label="Filtrar por fazenda">
                  <SelectValue placeholder="Todas as fazendas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as fazendas</SelectItem>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id}>
                      {farm.farm_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : !profileLoading && memberFarm ? (
            <div className="rounded-md border border-border/60 bg-card px-3 py-1.5 text-xs text-muted-foreground">
              Fazenda: <span className="font-semibold text-primary">{memberFarm.farm_name}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="@container/main flex flex-1 flex-col gap-3 p-4 lg:p-6">
        {farmsError && (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Não foi possível carregar as fazendas: {String(farmsError)}
          </p>
        )}
        {role === "member" && !accessLoading && !profileLoading && !memberFarm && (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Não foi possível identificar a fazenda vinculada ao seu perfil. Os dados do dashboard foram limitados.
            {profileError ? ` ${String(profileError)}` : ""}
          </p>
        )}
        {/* KPI Cards */}
        <SectionCards farmId={effectiveFarmId} />

        {/* Chart */}
        <div className="min-w-0">
          <ChartAreaInteractive farmId={effectiveFarmId} />
        </div>

        {/* Data table */}
        <div className="min-w-0">
          <DataTable farmId={effectiveFarmId} />
        </div>
      </div>
    </div>
  );
}

