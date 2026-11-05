"use client";

import { useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormRow } from "@/components/ui/FormRow";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useFarms } from "@/hooks/db/farms/useFarms";
import { useMovements } from "@/hooks/db/movements/useMovements";
import { useUserAccess } from "@/hooks/auth/useUserAccess";
import { useUserProfile } from "@/hooks/db/user_profiles/useUserProfile";
import { MONTHS } from "@/utils/birth.utils";
import { birthForecastDefinition } from "@/lib/pdf/definitions/birthForecast.definition";
import { ReportFilters } from "@/lib/pdf/definitions/types";
import { toast } from "sonner";

const ALL = "all";
const FIELD_CLASS = "h-9 w-full border-0 bg-muted/40 text-sm";

type FilterMode = "month-year" | "period";

export function BirthReport() {
  const { data: animals = [] } = useAnimals();
  const { data: farms = [] } = useFarms();
  const { data: movements = [] } = useMovements();
  const { role } = useUserAccess();
  const { data: userProfile } = useUserProfile();

  const [mode, setMode] = useState<FilterMode>("month-year");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(ALL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [farmFilter, setFarmFilter] = useState(ALL);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fazenda vinculada para membros
  const memberFarm = useMemo(() => {
    if (role !== "member" || !userProfile?.farm_name) return null;
    const cleanProfileFarm = userProfile.farm_name.trim().toLowerCase();
    return (
      farms.find((f) => f.farm_name.trim().toLowerCase() === cleanProfileFarm) ??
      null
    );
  }, [role, userProfile?.farm_name, farms]);

  // Anos disponíveis a partir dos movimentos de nascimento
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());
    for (const m of movements) {
      if (m.type === "nascimento" && !m._deleted) {
        const rawDate = m.event_date || m.date;
        if (rawDate) {
          const y = parseInt(rawDate.slice(0, 4), 10);
          if (!isNaN(y)) yearsSet.add(y);
        }
      }
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [movements]);

  // Contagem em tempo real dos registros que batem com os filtros
  const matchingCount = useMemo(() => {
    const effectiveFarmId =
      role === "member" && memberFarm
        ? memberFarm.id
        : farmFilter !== ALL
        ? farmFilter
        : undefined;

    const animalMap = new Map(animals.map((a) => [a.rgn, a]));

    return movements.filter((m) => {
      if (m.type !== "nascimento" || m._deleted || !m.animal_id) return false;
      const animal = animalMap.get(m.animal_id);
      if (!animal) return false;

      if (effectiveFarmId && animal.farm_id !== effectiveFarmId) return false;

      const rawDate = m.event_date || m.date || animal.born_date;

      if (mode === "period") {
        if (!rawDate) return false;
        const dateStr = rawDate.slice(0, 10);
        if (startDate && dateStr < startDate) return false;
        if (endDate && dateStr > endDate) return false;
      } else {
        // modo mês/ano
        if (year !== ALL) {
          let movYear: number | null = null;
          if (rawDate) {
            const y = parseInt(rawDate.slice(0, 4), 10);
            if (!isNaN(y)) movYear = y;
          }
          if (!movYear && m.created_at) movYear = new Date(m.created_at).getFullYear();
          if (movYear !== Number(year)) return false;
        }
        if (month !== ALL) {
          if (!rawDate) return false;
          const movMonth = parseInt(rawDate.slice(5, 7), 10);
          if (movMonth !== Number(month)) return false;
        }
      }

      return true;
    }).length;
  }, [animals, movements, mode, year, month, startDate, endDate, farmFilter, role, memberFarm]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Determina a fazenda efetiva
      const effectiveFarm =
        role === "member" && memberFarm
          ? memberFarm
          : farmFilter !== ALL
          ? farms.find((f) => f.id === farmFilter) ?? null
          : null;

      const filters: ReportFilters = {
        farmFilterMode: effectiveFarm ? "specific" : "all",
        farmId: effectiveFarm?.id,
        farmIds: effectiveFarm ? [effectiveFarm.id] : [],
        farmName: effectiveFarm?.farm_name,
        farmNames: effectiveFarm ? [effectiveFarm.farm_name] : [],
        birthForecastSortBy: "birthDate",
      };

      if (mode === "period") {
        filters.startDate = startDate || undefined;
        filters.endDate = endDate || undefined;
      } else {
        // mês/ano: se mês selecionado, converte para intervalo de datas do mês
        if (month !== ALL && year !== ALL) {
          const y = Number(year);
          const mo = Number(month);
          const lastDay = new Date(y, mo, 0).getDate(); // dia 0 do mês seguinte = último dia do mês atual
          filters.startDate = `${y}-${String(mo).padStart(2, "0")}-01`;
          filters.endDate = `${y}-${String(mo).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        } else {
          filters.year = year !== ALL ? year : undefined;
        }
      }

      await birthForecastDefinition.generate({ filters });
    } catch (err) {
      console.error("[BirthReport] Erro ao gerar PDF:", err);
      toast.error("Não foi possível gerar o relatório. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toggle de modo */}
      <div
        role="group"
        aria-label="Modo de filtro do relatório"
        className="grid grid-cols-2 rounded-xl border border-border bg-muted/30 p-1 gap-1"
      >
        <button
          type="button"
          onClick={() => setMode("month-year")}
          className={`rounded-lg py-2 text-xs font-bold uppercase transition-colors ${
            mode === "month-year"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Por mês / ano
        </button>
        <button
          type="button"
          onClick={() => setMode("period")}
          className={`rounded-lg py-2 text-xs font-bold uppercase transition-colors ${
            mode === "period"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Por período
        </button>
      </div>

      {/* Painel de filtros */}
      <section
        className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        aria-label="Filtros do relatório de nascimentos"
      >
        {/* Fazenda */}
        {role === "member" && memberFarm ? (
          <FormRow label="Fazenda" htmlFor="report-farm-member" className="flex flex-col items-start gap-1">
            <div
              id="report-farm-member"
              className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-muted/40 px-3 text-xs font-semibold text-primary"
            >
              <span>{memberFarm.farm_name}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                Escopo ativo
              </span>
            </div>
          </FormRow>
        ) : (
          <FormRow label="Fazenda" htmlFor="report-farm-select" className="flex flex-col items-start gap-1">
            <Select value={farmFilter} onValueChange={setFarmFilter}>
              <SelectTrigger id="report-farm-select" className={FIELD_CLASS}>
                <SelectValue placeholder="Todas as fazendas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas as fazendas</SelectItem>
                {farms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.farm_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
        )}

        {/* Filtros específicos por modo */}
        {mode === "month-year" ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <FormRow label="Ano" htmlFor="report-year" className="flex flex-col items-start gap-1">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="report-year" className={FIELD_CLASS}>
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos os anos</SelectItem>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>

            <FormRow label="Mês" htmlFor="report-month" className="flex flex-col items-start gap-1">
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger id="report-month" className={FIELD_CLASS}>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos os meses</SelectItem>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="report-start-date"
                className="text-[10px] font-bold uppercase text-muted-foreground"
              >
                De
              </Label>
              <Input
                id="report-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={FIELD_CLASS}
                max={endDate || undefined}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label
                htmlFor="report-end-date"
                className="text-[10px] font-bold uppercase text-muted-foreground"
              >
                Até
              </Label>
              <Input
                id="report-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={FIELD_CLASS}
                min={startDate || undefined}
              />
            </div>
          </div>
        )}
      </section>

      {/* Badge de contagem + botão gerar */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 flex-1 items-center justify-center rounded-xl bg-primary/10 px-3 text-primary">
          <span className="text-xl font-black">{matchingCount}</span>
          <span className="ml-1.5 text-[10px] font-bold uppercase leading-tight text-primary/70">
            registro{matchingCount !== 1 ? "s" : ""}
          </span>
        </div>

        <Button
          type="button"
          className="h-11 flex-[2] gap-2 text-xs font-bold uppercase"
          onClick={() => void handleGenerate()}
          disabled={isGenerating || matchingCount === 0}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {isGenerating ? "Gerando PDF..." : "Gerar PDF"}
        </Button>
      </div>

      {matchingCount === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Nenhum nascimento encontrado para os filtros selecionados.
        </p>
      )}
    </div>
  );
}
