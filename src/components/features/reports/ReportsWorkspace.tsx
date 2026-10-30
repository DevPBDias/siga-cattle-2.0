"use client";

import React from "react";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  HouseIcon,
  Loader2,
  RulerDimensionLine,
  Syringe,
  Upload,
  VenusAndMars,
  Baby,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ReportForm } from "@/components/features/reports/ReportForm";
import ShortHeader from "@/components/layout/ShortHeader";
import { StandardTabList } from "@/components/ui/StandardTabList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReports } from "@/context/ReportsContext";
import { useFarms } from "@/hooks/db/farms/useFarms";
import { useMovements } from "@/hooks/db/movements/useMovements";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { AVAILABLE_REPORTS } from "@/lib/pdf/definitions";
import { reproductionByCowDefinition } from "@/lib/pdf/definitions/reproductionByCow.definition";

const reportLabels: Record<string, string> = {
  "animals-by-farm": "Animais",
  "sanitary-by-farm": "Vacinas",
  reproduction: "Reprodução",
  "weight-performance": "Pesagem",
  "birth-forecast": "Nascimentos",
  "semen-dose": "Sêmen",
};

const reportIcons: Record<string, LucideIcon> = {
  Beef: HouseIcon,
  Syringe,
  Heart: VenusAndMars,
  Scale: RulerDimensionLine,
  FlaskConical,
  Baby,
};

export default function ReportsWorkspace() {
  const {
    selectedReport,
    filters,
    isGenerating,
    validationErrors,
    selectReport,
    updateFilters,
    generateReport,
  } = useReports();
  const { data: farms = [] } = useFarms();
  const { data: movements = [] } = useMovements();
  const { data: animals = [] } = useAnimals();

  // Contagem de nascimentos com os filtros atuais (para badge em tempo real)
  const matchingBirthCount = React.useMemo(() => {
    if (selectedReport?.id !== "birth-forecast") return 0;
    const targetYear = filters.year ? Number(filters.year) : undefined;
    const targetFarmId =
      filters.farmFilterMode === "specific"
        ? filters.farmId || filters.farmIds?.[0]
        : undefined;
    const animalMap = new Map(animals.map((a) => [a.rgn, a]));
    return movements.filter((m) => {
      if (m.type !== "nascimento" || m._deleted || !m.animal_id) return false;
      const animal = animalMap.get(m.animal_id);
      if (!animal) return false;
      if (targetFarmId && animal.farm_id !== targetFarmId) return false;
      if (targetYear) {
        const rawDate = m.event_date || m.date || animal.born_date;
        let movYear: number | null = null;
        if (rawDate) {
          const y = parseInt(rawDate.slice(0, 4), 10);
          if (!isNaN(y)) movYear = y;
        }
        if (!movYear && m.created_at) movYear = new Date(m.created_at).getFullYear();
        if (movYear !== targetYear) return false;
      }
      return true;
    }).length;
  }, [selectedReport?.id, movements, animals, filters.year, filters.farmFilterMode, filters.farmId, filters.farmIds]);

  // Anos disponíveis para o relatório de nascimentos
  const birthYears = React.useMemo(() => {
    const yearsSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    yearsSet.add(currentYear);
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
  const [step, setStep] = useState(1);
  const [isGeneratingCowReport, setIsGeneratingCowReport] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    if (
      !selectedReport ||
      !AVAILABLE_REPORTS.some((report) => report.id === selectedReport.id)
    ) {
      selectReport(AVAILABLE_REPORTS[0]);
    }
  }, [selectedReport, selectReport]);

  const activeReportId = selectedReport?.id ?? AVAILABLE_REPORTS[0].id;
  const farmSummary =
    filters.farmFilterMode === "all" ||
    (!filters.farmId && !filters.farmIds?.length)
      ? "Todas as fazendas"
      : filters.farmNames?.join(", ") ||
        filters.farmName ||
        "Fazendas selecionadas";
  const selectedColumns =
    filters.selectedColumns?.map((column) => column.header) ?? [];
  const isGlobalSemenReport = selectedReport?.id === "semen-dose";

  const handleReportChange = (id: string) => {
    const report = AVAILABLE_REPORTS.find((item) => item.id === id);
    if (!report) return;
    selectReport(report);
    setStep(1);
    setGenerationError(null);
  };

  const handleFarmSelect = (farmId: string) => {
    if (farmId === "all") {
      updateFilters({
        farmId: undefined,
        farmIds: [],
        farmName: undefined,
        farmNames: [],
        farmFilterMode: "all",
      });
      return;
    }

    const farm = farms.find((item) => item.id === farmId);
    if (!farm) return;

    updateFilters({
      farmId,
      farmIds: [farm.id],
      farmName: farm.farm_name,
      farmNames: [farm.farm_name],
      farmFilterMode: "specific",
    });
  };

  const handleGenerate = async () => {
    setGenerationError(null);
    const generated = await generateReport();
    if (!generated) {
      setGenerationError(
        validationErrors[0]?.message ??
          "Não foi possível gerar o relatório. Revise os filtros.",
      );
    }
  };

  const handleGenerateByCow = async () => {
    if (!selectedReport) return;
    setGenerationError(null);
    setIsGeneratingCowReport(true);
    try {
      await reproductionByCowDefinition.generate({ filters });
    } catch (error) {
      console.error("Erro ao gerar relatório por vaca:", error);
      setGenerationError("Não foi possível gerar o relatório por vaca.");
    } finally {
      setIsGeneratingCowReport(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <ShortHeader title="Relatórios" />

      <Link
        href="/geral/evolucao"
        className="mx-3 mt-3 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-primary transition-colors hover:bg-primary/10"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
          <BarChart3 className="h-5 w-5" />
        </span>
        <span>
          <strong className="block text-sm font-bold uppercase">Evolução do rebanho</strong>
          <span className="text-xs text-muted-foreground">Visualize a quantidade por mês, ano e categoria.</span>
        </span>
      </Link>

      <section className="space-y-2 px-3 py-2">
        <Tabs defaultValue="pdf" className="w-full">
          <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl border border-border bg-muted/30 p-1">
            <TabsTrigger
              value="pdf"
              className="gap-2 text-xs font-bold uppercase"
            >
              <FileText className="h-4 w-4" /> PDF
            </TabsTrigger>
            <TabsTrigger
              value="planilhas"
              className="gap-2 text-xs font-bold uppercase"
            >
              <FileSpreadsheet className="h-4 w-4" /> Planilhas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="mt-2 space-y-2">
            <div className="space-y-1">
              <p className="px-1 text-[10px] font-bold uppercase text-muted-foreground">
                Tipo de relatório
              </p>
              <Tabs
                value={activeReportId}
                onValueChange={handleReportChange}
                className="w-full"
              >
                <StandardTabList
                  tabs={AVAILABLE_REPORTS.map((report) => ({
                    value: report.id,
                    label: reportLabels[report.id] ?? report.title,
                    icon: reportIcons[report.icon],
                  }))}
                  activeTab={activeReportId}
                />

                <TabsContent
                  value={activeReportId}
                  className="mt-2 focus-visible:outline-none"
                >
                  <div className="space-y-2">
                    <div className="relative px-3">
                      <div
                        aria-hidden="true"
                        className="absolute left-[16.666%] right-[16.666%] top-3 h-0.5 bg-border"
                      >
                        <div
                          className="h-full bg-primary transition-[width] duration-200"
                          style={{ width: `${((step - 1) / 2) * 100}%` }}
                        />
                      </div>
                      <ol
                        aria-label="Etapas do relatório"
                        className="relative grid grid-cols-3"
                      >
                        {["Fazenda", "Colunas e datas", "Revisão"].map(
                          (label, index) => {
                            const stepNumber = index + 1;
                            const isCurrent = step === stepNumber;
                            const isComplete = step > stepNumber;

                            return (
                              <li
                                key={label}
                                aria-current={isCurrent ? "step" : undefined}
                                className="flex min-w-0 flex-col items-center gap-1 text-center"
                              >
                                <span
                                  className={`grid h-6 w-6 place-items-center rounded-full border text-[10px] font-bold ${
                                    isCurrent || isComplete
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border bg-card text-muted-foreground"
                                  }`}
                                >
                                  {isComplete ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    stepNumber
                                  )}
                                </span>
                                <span
                                  className={`text-[9px] font-bold uppercase leading-tight ${
                                    isCurrent
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {label}
                                </span>
                              </li>
                            );
                          },
                        )}
                      </ol>
                    </div>

                    {step === 1 && (
                      <section className="space-y-3 rounded-xl border border-border bg-card p-3">
                        {selectedReport?.id === "birth-forecast" ? (
                          <>
                            <div className="space-y-1">
                              <h2 className="text-base font-bold uppercase text-primary">
                                Filtros do relatório
                              </h2>
                              <p className="text-sm text-muted-foreground">
                                Selecione o ano e a fazenda para o relatório de nascimentos.
                              </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                              {/* Ano */}
                              <div className="space-y-1.5 sm:w-36">
                                <Label
                                  htmlFor="birth-year-step1"
                                  className="text-[10px] font-bold uppercase text-primary"
                                >
                                  Ano
                                </Label>
                                <Select
                                  value={filters.year || String(new Date().getFullYear())}
                                  onValueChange={(y) => updateFilters({ year: y })}
                                >
                                  <SelectTrigger id="birth-year-step1" className="h-11 bg-white">
                                    <SelectValue placeholder="Ano" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {birthYears.map((y) => (
                                      <SelectItem key={y} value={String(y)}>
                                        {y}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Fazenda */}
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <Label
                                  htmlFor="birth-farm-step1"
                                  className="text-[10px] font-bold uppercase text-primary"
                                >
                                  Fazenda
                                </Label>
                                <Select
                                  value={
                                    filters.farmFilterMode === "specific"
                                      ? (filters.farmId ?? "all")
                                      : "all"
                                  }
                                  onValueChange={(farmId) => {
                                    if (farmId === "all") {
                                      updateFilters({
                                        farmId: undefined,
                                        farmIds: [],
                                        farmName: undefined,
                                        farmNames: [],
                                        farmFilterMode: "all",
                                      });
                                    } else {
                                      const farm = farms.find((f) => f.id === farmId);
                                      if (farm) {
                                        updateFilters({
                                          farmId: farm.id,
                                          farmIds: [farm.id],
                                          farmName: farm.farm_name,
                                          farmNames: [farm.farm_name],
                                          farmFilterMode: "specific",
                                        });
                                      }
                                    }
                                  }}
                                >
                                  <SelectTrigger id="birth-farm-step1" className="h-11 bg-white">
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

                              {/* Badge de contagem */}
                              <div className="flex h-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 px-3 text-primary">
                                <span className="text-lg font-black">{matchingBirthCount}</span>
                                <span className="ml-1 text-[10px] font-bold uppercase leading-tight text-primary/70">
                                  registro{matchingBirthCount !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="space-y-1">
                              <h2 className="text-base font-bold uppercase text-primary">
                                Local dos animais
                              </h2>
                              <p className="text-sm text-muted-foreground">
                                Escolha a fazenda que entra neste relatório.
                              </p>
                            </div>

                            <div className="grid gap-3">
                              <div className="min-w-0 space-y-1.5">
                                <Label
                                  htmlFor="report-farm"
                                  className="text-[10px] font-bold uppercase text-primary"
                                >
                                  Fazenda
                                </Label>
                                <Select
                                  value={
                                    isGlobalSemenReport
                                      ? "all"
                                      : filters.farmFilterMode === "specific"
                                        ? filters.farmId ?? "all"
                                        : "all"
                                  }
                                  onValueChange={handleFarmSelect}
                                  disabled={isGlobalSemenReport}
                                >
                                  <SelectTrigger id="report-farm" className="h-11 bg-white">
                                    <SelectValue placeholder="Selecione a fazenda" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">
                                      {isGlobalSemenReport ? "Estoque geral" : "Todas as fazendas"}
                                    </SelectItem>
                                    {!isGlobalSemenReport &&
                                      farms.map((farm) => (
                                        <SelectItem key={farm.id} value={farm.id}>
                                          {farm.farm_name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </>
                        )}

                        <div className="flex justify-end">
                          <Button
                            type="button"
                            className="h-11 w-full text-xs font-bold uppercase sm:w-auto"
                            onClick={() => setStep(2)}
                          >
                            Avançar etapa
                          </Button>
                        </div>
                      </section>
                    )}

                    {step === 2 && (
                      <>
                        <ReportForm showGenerateActions={false} compact />
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 text-xs font-bold uppercase"
                            onClick={() => setStep(1)}
                          >
                            Voltar etapa
                          </Button>
                          <Button
                            type="button"
                            className="h-11 text-xs font-bold uppercase"
                            onClick={() => setStep(3)}
                          >
                            Avançar
                          </Button>
                        </div>
                      </>
                    )}

                    {step === 3 && (
                      <section className="space-y-3 rounded-xl border border-border bg-card p-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            Relatório em PDF · Papel A3
                          </span>
                          <h2 className="mt-1 text-base font-bold uppercase text-primary">
                            Revisar configuração
                          </h2>
                        </div>

                        <dl className="space-y-3 text-sm">
                          <div className="flex justify-between gap-3 border-b border-border pb-2">
                            <dt className="text-muted-foreground">Tipo</dt>
                            <dd className="text-right font-semibold text-primary">
                              {selectedReport?.title}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3 border-b border-border pb-2">
                            <dt className="text-muted-foreground">Fazenda</dt>
                            <dd className="max-w-[65%] text-right font-semibold text-primary">
                              {farmSummary}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3 border-b border-border pb-2">
                            <dt className="text-muted-foreground">Colunas</dt>
                            <dd className="text-right font-semibold text-primary">
                              {selectedColumns.length || "Padrão do relatório"}
                            </dd>
                          </div>
                          {!!filters.managementDates?.length && (
                            <div className="flex justify-between gap-3">
                              <dt className="text-muted-foreground">
                                Datas de manejo
                              </dt>
                              <dd className="text-right font-semibold text-primary">
                                {filters.managementDates.length} selecionadas
                              </dd>
                            </div>
                          )}
                          {selectedReport?.id === "birth-forecast" &&
                            filters.year && (
                              <div className="flex justify-between gap-3 border-b border-border pb-2">
                                <dt className="text-muted-foreground">Ano</dt>
                                <dd className="text-right font-semibold text-primary">
                                  {filters.year}
                                </dd>
                              </div>
                            )}
                        </dl>

                        {generationError && (
                          <p role="alert" className="text-sm text-destructive">
                            {generationError}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 text-xs font-bold uppercase"
                            onClick={() => setStep(2)}
                            disabled={isGenerating || isGeneratingCowReport}
                          >
                            Voltar etapa
                          </Button>
                          <Button
                            type="button"
                            className="h-11 gap-2 text-xs font-bold uppercase"
                            onClick={() => void handleGenerate()}
                            disabled={isGenerating || isGeneratingCowReport}
                          >
                            {isGenerating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                            {isGenerating ? "Gerando..." : "Gerar PDF"}
                          </Button>
                        </div>

                        {selectedReport?.id === "reproduction" && (
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-11 w-full text-xs font-bold uppercase"
                            onClick={() => void handleGenerateByCow()}
                            disabled={isGenerating || isGeneratingCowReport}
                          >
                            {isGeneratingCowReport && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Gerar relatório por vaca
                          </Button>
                        )}
                      </section>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="planilhas" className="mt-2 space-y-3">
            <div className="space-y-1 px-1">
              <h2 className="text-base font-bold uppercase text-primary">
                Importar e exportar
              </h2>
              <p className="text-sm text-muted-foreground">
                Escolha uma operação para trabalhar com os dados da fazenda.
              </p>
            </div>

            <Link
              href="/geral/planilhas"
              className="flex min-h-20 items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-bold text-primary">
                  Importar planilha
                </strong>
                <span className="text-xs text-muted-foreground">
                  Atualize o cadastro a partir de um arquivo CSV.
                </span>
              </span>
            </Link>

            <Link
              href="/geral/relatorios/planilhas"
              className="flex min-h-20 items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-bold text-primary">
                  Exportar animais
                </strong>
                <span className="text-xs text-muted-foreground">
                  Gere uma planilha Excel com os dados do rebanho.
                </span>
              </span>
            </Link>
          </TabsContent>
        </Tabs>
      </section>

    </main>
  );
}
