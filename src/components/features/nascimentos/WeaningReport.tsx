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
import { useFarms } from "@/hooks/db/farms/useFarms";
import { useUserAccess } from "@/hooks/auth/useUserAccess";
import { useUserProfile } from "@/hooks/db/user_profiles/useUserProfile";
import { useLocalQuery } from "@/hooks/core/useLocalQuery";
import { WeaningRecord } from "@/types/weaning_record.type";
import { MONTHS } from "@/utils/birth.utils";
import { weaningReportDefinition } from "@/lib/pdf/definitions/weaningReport.definition";
import { toast } from "sonner";
import type { MangoQuery } from "rxdb";

const ALL = "all";
const FIELD_CLASS = "h-9 w-full border-0 bg-muted/40 text-sm";
type FilterMode = "month-year" | "period";

export function WeaningReport() {
  const { data: farms = [] } = useFarms();
  const { role } = useUserAccess();
  const { data: userProfile } = useUserProfile();
  const query = useMemo<MangoQuery<WeaningRecord>>(
    () => ({ selector: { _deleted: { $eq: false } } }),
    [],
  );
  const { data: records = [] } = useLocalQuery<WeaningRecord>("weaning_records", query);

  const [mode, setMode] = useState<FilterMode>("month-year");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(ALL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [farmFilter, setFarmFilter] = useState(ALL);
  const [isGenerating, setIsGenerating] = useState(false);

  const memberFarm = useMemo(() => {
    if (role !== "member" || !userProfile?.farm_name) return null;
    const name = userProfile.farm_name.trim().toLowerCase();
    return farms.find((farm) => farm.farm_name.trim().toLowerCase() === name) ?? null;
  }, [role, userProfile?.farm_name, farms]);

  const availableYears = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    for (const record of records) {
      const value = Number(record.weaning_date?.slice(0, 4));
      if (Number.isInteger(value) && value > 0) years.add(value);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [records]);

  const matchingCount = useMemo(() => {
    const effectiveFarmId = role === "member" && memberFarm
      ? memberFarm.id
      : farmFilter !== ALL ? farmFilter : undefined;
    return records.filter((record) => {
      if (effectiveFarmId && record.farm_id !== effectiveFarmId) return false;
      const date = record.weaning_date?.slice(0, 10);
      if (mode === "period") {
        if (!date) return false;
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
      } else {
        if (year !== ALL && Number(date?.slice(0, 4)) !== Number(year)) return false;
        if (month !== ALL && Number(date?.slice(5, 7)) !== Number(month)) return false;
      }
      return true;
    }).length;
  }, [records, role, memberFarm, farmFilter, mode, startDate, endDate, year, month]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const effectiveFarm = role === "member" && memberFarm
        ? memberFarm
        : farmFilter !== ALL ? farms.find((farm) => farm.id === farmFilter) ?? null : null;
      const filters: { farmId?: string; farmName?: string; year?: string; startDate?: string; endDate?: string } = {
        farmId: effectiveFarm?.id,
        farmName: effectiveFarm?.farm_name,
      };
      if (mode === "period") {
        filters.startDate = startDate || undefined;
        filters.endDate = endDate || undefined;
      } else if (month !== ALL && year !== ALL) {
        const y = Number(year);
        const mo = Number(month);
        filters.startDate = `${y}-${String(mo).padStart(2, "0")}-01`;
        filters.endDate = `${y}-${String(mo).padStart(2, "0")}-${String(new Date(y, mo, 0).getDate()).padStart(2, "0")}`;
      } else {
        filters.year = year !== ALL ? year : undefined;
      }
      await weaningReportDefinition.generate({ filters });
    } catch (error) {
      console.error("[WeaningReport] Erro ao gerar PDF:", error);
      toast.error("Não foi possível gerar o relatório. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Modo de filtro do relatório" className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/30 p-1">
        <button type="button" onClick={() => setMode("month-year")} className={`rounded-lg py-2 text-xs font-bold uppercase transition-colors ${mode === "month-year" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          Por mês / ano
        </button>
        <button type="button" onClick={() => setMode("period")} className={`rounded-lg py-2 text-xs font-bold uppercase transition-colors ${mode === "period" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          Por período
        </button>
      </div>

      <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm" aria-label="Filtros do relatório de desmamas">
        {role === "member" && memberFarm ? (
          <FormRow label="Fazenda" htmlFor="weaning-report-farm-member" className="flex flex-col items-start gap-1">
            <div id="weaning-report-farm-member" className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-muted/40 px-3 text-xs font-semibold text-primary">
              <span>{memberFarm.farm_name}</span><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Escopo ativo</span>
            </div>
          </FormRow>
        ) : (
          <FormRow label="Fazenda" htmlFor="weaning-report-farm" className="flex flex-col items-start gap-1">
            <Select value={farmFilter} onValueChange={setFarmFilter}>
              <SelectTrigger id="weaning-report-farm" className={FIELD_CLASS}><SelectValue placeholder="Todas as fazendas" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>Todas as fazendas</SelectItem>{farms.map((farm) => <SelectItem key={farm.id} value={farm.id}>{farm.farm_name}</SelectItem>)}</SelectContent>
            </Select>
          </FormRow>
        )}

        {mode === "month-year" ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <FormRow label="Ano" htmlFor="weaning-report-year" className="flex flex-col items-start gap-1">
              <Select value={year} onValueChange={setYear}><SelectTrigger id="weaning-report-year" className={FIELD_CLASS}><SelectValue placeholder="Todos os anos" /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todos os anos</SelectItem>{availableYears.map((item) => <SelectItem key={item} value={String(item)}>{item}</SelectItem>)}</SelectContent></Select>
            </FormRow>
            <FormRow label="Mês" htmlFor="weaning-report-month" className="flex flex-col items-start gap-1">
              <Select value={month} onValueChange={setMonth}><SelectTrigger id="weaning-report-month" className={FIELD_CLASS}><SelectValue placeholder="Todos os meses" /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todos os meses</SelectItem>{MONTHS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
            </FormRow>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex flex-col gap-1"><Label htmlFor="weaning-report-start" className="text-[10px] font-bold uppercase text-muted-foreground">De</Label><Input id="weaning-report-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={FIELD_CLASS} max={endDate || undefined} /></div>
            <div className="flex flex-col gap-1"><Label htmlFor="weaning-report-end" className="text-[10px] font-bold uppercase text-muted-foreground">Até</Label><Input id="weaning-report-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={FIELD_CLASS} min={startDate || undefined} /></div>
          </div>
        )}
      </section>

      <div className="flex items-center gap-3">
        <div className="flex h-11 flex-1 items-center justify-center rounded-xl bg-primary/10 px-3 text-primary"><span className="text-xl font-black">{matchingCount}</span><span className="ml-1.5 text-[10px] font-bold uppercase leading-tight text-primary/70">registro{matchingCount !== 1 ? "s" : ""}</span></div>
        <Button type="button" className="h-11 flex-[2] gap-2 text-xs font-bold uppercase" onClick={() => void handleGenerate()} disabled={isGenerating || matchingCount === 0}>
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}{isGenerating ? "Gerando PDF..." : "Gerar PDF"}
        </Button>
      </div>
      {matchingCount === 0 && <p className="text-center text-xs text-muted-foreground">Nenhuma desmama encontrada para os filtros selecionados.</p>}
    </div>
  );
}
