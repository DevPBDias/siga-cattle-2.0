"use client";

import React, { useMemo } from "react";
import { useReports } from "@/context/ReportsContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import {
  GenderFilterValue,
  AnimalStateFilterValue,
} from "@/lib/pdf/definitions/types";
import { useReproductionEvents } from "@/hooks/db/reproduction_event/useReproductionEvents";
import { useStatuses } from "@/hooks/db/statuses/useStatuses";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useFarms } from "@/hooks/db/farms/useFarms";
import { useMovements } from "@/hooks/db/movements/useMovements";
import { Checkbox } from "@/components/ui/checkbox";
import { reproductionByCowDefinition } from "@/lib/pdf/definitions/reproductionByCow.definition";
import {
  ANIMAL_REPORT_AVAILABLE_COLUMNS,
  REPRODUCTION_REPORT_AVAILABLE_COLUMNS,
  MAX_SELECTABLE_COLUMNS,
} from "@/lib/pdf/definitions/availableColumns";
import { ReportCheckboxItem } from "./ReportCheckboxItem";
import { SexFilterModal } from "./SexFilterModal";
import { StatusFilterModal } from "./StatusFilterModal";
import { ClassFilterModal } from "./ClassFilterModal";
import { SocietyFilterModal } from "./SocietyFilterModal";
import { AnimalStateFilterModal } from "./AnimalStateFilterModal";
import { TableColumn } from "@/lib/pdf/types";
import { EventType } from "@/types/reproduction_event.type";
import { formatDate } from "@/utils/dates";

interface ReportFormProps {
  showGenerateActions?: boolean;
  compact?: boolean;
}

export function ReportForm({
  showGenerateActions = true,
  compact = false,
}: ReportFormProps = {}) {
  const {
    selectedReport,
    filters,
    isGenerating,
    validationErrors,
    updateFilters,
    toggleColumn,
    generateReport,
  } = useReports();

  // Hooks must be called unconditionally (before any early returns)
  const { data: statuses = [] } = useStatuses();
  const { data: allEvents = [] } = useReproductionEvents();
  const { data: animals = [] } = useAnimals();
  const { data: farms = [] } = useFarms();
  const { data: movements = [] } = useMovements();

  const [sexModalOpen, setSexModalOpen] = React.useState(false);
  const [statusModalOpen, setStatusModalOpen] = React.useState(false);
  const [classModalOpen, setClassModalOpen] = React.useState(false);
  const [societyModalOpen, setSocietyModalOpen] = React.useState(false);
  const [animalStateModalOpen, setAnimalStateModalOpen] = React.useState(false);
  const [isGeneratingCowReport, setIsGeneratingCowReport] = React.useState(false);

  // Filter animals by selected farm (or all if no farm selected or filterMode is "all")
  const farmAnimals = useMemo(() => {
    let selectedAnimals = animals;
    const hasFarmFilter =
      filters.farmFilterMode !== "all" &&
      Boolean(filters.farmId || filters.farmIds?.length);

    if (hasFarmFilter && filters.farmIds?.length) {
      const farmIdSet = new Set(filters.farmIds);
      selectedAnimals = selectedAnimals.filter(
        (animal) => animal.farm_id && farmIdSet.has(animal.farm_id),
      );
    } else if (hasFarmFilter && filters.farmId) {
      selectedAnimals = selectedAnimals.filter(
        (animal) => animal.farm_id === filters.farmId,
      );
    }

    return selectedAnimals;
  }, [
    animals,
    filters.farmId,
    filters.farmIds,
    filters.farmFilterMode,
  ]);

  const farmAnimalRgns = useMemo(
    () => new Set(farmAnimals.map((a) => a.rgn)),
    [farmAnimals],
  );

  // Filter events by farm animals (or all if no farm selected or filterMode is "all")
  const farmEvents = useMemo(() => {
    const hasFarmFilter =
      filters.farmFilterMode !== "all" &&
      Boolean(filters.farmId || filters.farmIds?.length);
    const events = hasFarmFilter
      ? allEvents.filter((e) => farmAnimalRgns.has(e.rgn))
      : allEvents;

    if (!filters.eventType || filters.eventType === "Todos") {
      return events;
    }

    return events.filter((event) => event.event_type === filters.eventType);
  }, [
    allEvents,
    farmAnimalRgns,
    filters.farmId,
    filters.farmIds,
    filters.farmFilterMode,
    filters.eventType,
  ]);

  // Available Years from Events of the current farm
  const availableYears = useMemo(
    () =>
      Array.from(
        new Set(
          farmEvents
            .filter((e) => e.d10_date)
            .map((e) => e.d10_date!.split("-")[0]),
        ),
      ).sort((a, b) => b.localeCompare(a)),
    [farmEvents],
  );

  // Available Dates for the selected Year and Farm
  const availableDatesForYear = useMemo(
    () =>
      farmEvents
        .filter(
          (e) =>
            // Sync D10 e Sync D11 armazenam a data do manejo no mesmo campo.
            // Portanto, a lista deve considerar todos os eventos, sem filtrar
            // pelo nome do protocolo.
            e.d10_date && (!filters.year || e.d10_date.startsWith(filters.year)),
        )
        .map((e) => e.d10_date!)
        .filter((value, index, self) => self.indexOf(value) === index) // Unique
        .sort((a, b) => b.localeCompare(a)),
    [farmEvents, filters.year],
  );

  const availableSocieties = useMemo(
    () =>
      Array.from(
        new Set(animals.map((a) => a.partnership).filter(Boolean)),
      ) as string[],
    [animals],
  );

  if (!selectedReport) return null;

  // Handle sex filter from modal
  const handleSexFilterConfirm = (
    sex: GenderFilterValue | undefined,
    filterMode: "all" | "specific",
  ) => {
    updateFilters({
      sex: sex || "Ambos",
      sexFilterMode: filterMode,
    });
  };

  // Handle status filter from modal
  const handleStatusFilterConfirm = (
    status: string | undefined,
    filterMode: "all" | "specific",
  ) => {
    updateFilters({
      status: status || "Todos",
      statusFilterMode: filterMode,
    });
  };

  // Handle class filter from modal
  const handleClassFilterConfirm = (
    classes: string[] | undefined,
    filterMode: "all" | "specific",
  ) => {
    updateFilters({
      classes: classes || [],
      classFilterMode: filterMode,
    });
  };

  // Handle society filter from modal
  const handleSocietyFilterConfirm = (
    society: string | undefined,
    filterMode: "all" | "specific",
  ) => {
    updateFilters({
      society: society || "",
      societyFilterMode: filterMode,
    });
  };

  // Handle animal state filter from modal
  const handleAnimalStateFilterConfirm = (
    animalState: AnimalStateFilterValue | undefined,
    filterMode: "all" | "specific",
  ) => {
    updateFilters({
      animalState: animalState || "Ambos",
      animalStateFilterMode: filterMode,
    });
  };

  // Custom toggle for filter columns - opens modal instead
  const handleColumnToggle = (column: TableColumn) => {
    if (column.dataKey === "farmName") {
      toggleColumn(column);
    } else if (column.dataKey === "sex") {
      // Se está desmarcando, remover filtro
      const isChecked =
        filters.selectedColumns?.some((c) => c.dataKey === "sex") ?? false;
      if (isChecked) {
        updateFilters({
          sex: undefined,
          sexFilterMode: undefined,
        });
        toggleColumn(column);
      } else {
        // Se está marcando, abrir modal
        setSexModalOpen(true);
      }
    } else if (column.dataKey === "status") {
      // Se está desmarcando, remover filtro
      const isChecked =
        filters.selectedColumns?.some((c) => c.dataKey === "status") ?? false;
      if (isChecked) {
        updateFilters({
          status: undefined,
          statusFilterMode: undefined,
        });
        toggleColumn(column);
      } else {
        // Se está marcando, abrir modal
        setStatusModalOpen(true);
      }
    } else if (column.dataKey === "classification") {
      // Se está desmarcando, remover filtro
      const isChecked =
        filters.selectedColumns?.some((c) => c.dataKey === "classification") ??
        false;
      if (isChecked) {
        updateFilters({
          classes: [],
          classFilterMode: undefined,
        });
        toggleColumn(column);
      } else {
        // Se está marcando, abrir modal
        setClassModalOpen(true);
      }
    } else if (column.dataKey === "society") {
      // Se está desmarcando, remover filtro
      const isChecked =
        filters.selectedColumns?.some((c) => c.dataKey === "society") ?? false;
      if (isChecked) {
        updateFilters({
          society: undefined,
          societyFilterMode: undefined,
        });
        toggleColumn(column);
      } else {
        // Se está marcando, abrir modal
        setSocietyModalOpen(true);
      }
    } else if (column.dataKey === "animalState") {
      // Se está desmarcando, remover filtro
      const isChecked =
        filters.selectedColumns?.some((c) => c.dataKey === "animalState") ??
        false;
      if (isChecked) {
        updateFilters({
          animalState: undefined,
          animalStateFilterMode: undefined,
        });
        toggleColumn(column);
      } else {
        // Se está marcando, abrir modal
        setAnimalStateModalOpen(true);
      }
    } else {
      toggleColumn(column);
    }
  };

  // Get validation error for a field
  const getError = (field: string): string | undefined => {
    return validationErrors.find((e) => e.field === field)?.message;
  };

  const isClassColumnSelected =
    filters.selectedColumns?.some((c) => c.dataKey === "classification") ??
    false;
  const isSocietyColumnSelected =
    filters.selectedColumns?.some((c) => c.dataKey === "society") ?? false;

  const effectiveMaxColumns =
    selectedReport.id === "animals-by-farm" ? 16 : MAX_SELECTABLE_COLUMNS;
  const columnCount = filters.selectedColumns?.length || 0;
  const maxColumnsReached = columnCount >= effectiveMaxColumns;

  const handleYearChange = (year: string) => {
    updateFilters({ year, managementDates: [] });
  };

  const handleEventTypeChange = (eventType: string) => {
    updateFilters({ eventType: eventType as EventType | "Todos", managementDates: [] });
  };

  const toggleManagementDate = (date: string) => {
    const currentDates = filters.managementDates || [];
    if (currentDates.includes(date)) {
      updateFilters({
        managementDates: currentDates.filter((d) => d !== date),
      });
    } else {
      updateFilters({ managementDates: [...currentDates, date] });
    }
  };

  const toggleAllManagementDates = () => {
    const currentDates = filters.managementDates || [];
    const allDatesAreSelected =
      availableDatesForYear.length > 0 &&
      availableDatesForYear.every((date) => currentDates.includes(date));

    updateFilters({
      managementDates: allDatesAreSelected ? [] : availableDatesForYear,
    });
  };

  const handleGenerateReproductionByCowReport = async () => {
    setIsGeneratingCowReport(true);
    try {
      await reproductionByCowDefinition.generate({ filters });
    } catch (error) {
      console.error("[ReportForm] Error generating reproduction by cow report:", error);
    } finally {
      setIsGeneratingCowReport(false);
    }
  };

  
  const birthYears = useMemo(() => {
    const yearsSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    yearsSet.add(currentYear);
    for (const m of movements) {
      if (m.type === "nascimento" && !m._deleted) {
        const rawDate = m.event_date || m.date;
        if (rawDate) {
          const y = parseInt(rawDate.slice(0, 4), 10);
          if (!isNaN(y)) yearsSet.add(y);
        } else if (m.created_at) {
          yearsSet.add(new Date(m.created_at).getFullYear());
        }
      }
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [movements]);

  const matchingBirthCount = useMemo(() => {
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

      if (targetFarmId) {
        if (animal.farm_id !== targetFarmId) return false;
      }

      if (targetYear) {
        const rawDate = m.event_date || m.date || animal.born_date;
        let movYear: number | null = null;
        if (rawDate) {
          const y = parseInt(rawDate.slice(0, 4), 10);
          if (!isNaN(y)) movYear = y;
        }
        if (!movYear && m.created_at) {
          movYear = new Date(m.created_at).getFullYear();
        }
        if (movYear !== targetYear) return false;
      }

      return true;
    }).length;
  }, [
    movements,
    animals,
    filters.year,
    filters.farmFilterMode,
    filters.farmId,
    filters.farmIds,
  ]);

  return (
    <div
      className={`w-full border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 bg-card ${
        compact ? "rounded-lg p-3 space-y-3" : "rounded-xl p-6 space-y-6"
      }`}
    >
      <div className={`${compact ? "space-y-0.5" : "space-y-1"} text-center`}>
        <h2 className={`${compact ? "text-lg" : "text-xl"} font-black text-primary uppercase tracking-tight`}>
          {selectedReport.title}
        </h2>
        <p className="text-xs text-muted-foreground italic">
          {selectedReport.description}
        </p>
      </div>

      <div className={`${compact ? "space-y-3" : "space-y-4"} w-full`}>
        {selectedReport.id === "reproduction" && (
          <h3 className="font-bold text-[11px] uppercase text-muted-foreground border-b border-border/60 pb-1 mb-2">
            Filtros do Relatório
          </h3>
        )}

        <div className="flex flex-col gap-4 md:flex-row w-full">
          {/* Reproduction Year Filter */}
          {selectedReport.id === "reproduction" && (
            <div className="space-y-1 md:w-32">
              <Label
                htmlFor="year"
                className="text-[10px] font-bold uppercase text-primary tracking-tight"
              >
                Ano
              </Label>
              <Select
                value={filters.year || ""}
                onValueChange={handleYearChange}
              >
                <SelectTrigger
                  id="year"
                  className="w-full h-11 bg-muted/40 border-0 focus:ring-primary"
                >
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-xl">
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year} className="rounded-lg">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedReport.id === "reproduction" && (
            <div className="space-y-1 md:w-48">
              <Label
                htmlFor="event-type"
                className="text-[10px] font-bold uppercase text-primary tracking-tight"
              >
                Tipo de evento
              </Label>
              <Select
                value={filters.eventType || "Todos"}
                onValueChange={handleEventTypeChange}
              >
                <SelectTrigger
                  id="event-type"
                  className="w-full h-11 bg-muted/40 border-0 focus:ring-primary"
                >
                  <SelectValue placeholder="Todos os eventos" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-xl">
                  <SelectItem value="Todos" className="rounded-lg">
                    Todos os eventos
                  </SelectItem>
                  <SelectItem value="IATF" className="rounded-lg">IATF</SelectItem>
                  <SelectItem value="FIV" className="rounded-lg">FIV</SelectItem>
                  <SelectItem value="Monta natural" className="rounded-lg">Monta natural</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>


        {/* Reproduction Management Dates Checklist */}
        {selectedReport.id === "reproduction" &&
          filters.year &&
          availableDatesForYear.length > 0 && (
            <div className={`${compact ? "space-y-2 pt-1" : "space-y-3 pt-2"}`}>
              <div className="flex items-center justify-between gap-2 px-1">
                <Label className="text-[10px] font-bold uppercase text-primary tracking-tight">
                  Datas de Manejo
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-2 text-[10px] font-bold uppercase"
                  onClick={toggleAllManagementDates}
                >
                  {availableDatesForYear.every((date) =>
                    filters.managementDates?.includes(date),
                  )
                    ? "Desmarcar todas"
                    : "Marcar todas"}
                </Button>
              </div>

              <div className={`grid grid-cols-2 ${compact ? "gap-2" : "gap-3"}`}>
                {availableDatesForYear.map((date) => (
                  <div
                    key={date}
                    className="flex items-center space-x-2 rounded-lg border border-primary/15 bg-primary/10 p-2 transition-colors hover:border-primary/40"
                  >
                    <Checkbox
                      id={`date-${date}`}
                      checked={filters.managementDates?.includes(date)}
                      onCheckedChange={() => toggleManagementDate(date)}
                      className="rounded-md border-primary/40 text-primary focus-visible:ring-primary"
                    />
                    <Label
                      htmlFor={`date-${date}`}
                      className="text-[11px] font-bold text-muted-foreground cursor-pointer select-none"
                    >
                      {formatDate(date)}
                    </Label>
                  </div>
                ))}
              </div>
              {getError("managementDates") && (
                <p className="text-xs text-red-500 flex items-center gap-1.5 px-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {getError("managementDates")}
                </p>
              )}
            </div>
          )}
      </div>

      {/* Sorting Option - Only for animals-by-farm report */}
      {selectedReport.id === "animals-by-farm" && (
        <div className={`${compact ? "space-y-1.5 pt-1" : "space-y-2 pt-2"}`}>
          <Label className="text-[10px] font-bold uppercase text-primary tracking-tight">
            Ordenar por
          </Label>
          <div className="flex gap-3">
            <label
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                filters.sortBy === "rgn" || !filters.sortBy
                  ? "bg-primary/10 border-primary text-primary font-bold"
                  : "bg-muted/40 border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="sortBy"
                value="rgn"
                checked={filters.sortBy === "rgn" || !filters.sortBy}
                onChange={() => updateFilters({ sortBy: "rgn" })}
                className="sr-only"
              />
              <span className="text-xs">RGN</span>
            </label>
            <label
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                filters.sortBy === "classification"
                  ? "bg-primary/10 border-primary text-primary font-bold"
                  : "bg-muted/40 border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="sortBy"
                value="classification"
                checked={filters.sortBy === "classification"}
                onChange={() => updateFilters({ sortBy: "classification" })}
                className="sr-only"
              />
              <span className="text-xs">Classe</span>
            </label>
          </div>
        </div>
      )}

      {selectedReport.id === "birth-forecast" && (
        <div className={`${compact ? "space-y-1.5 pt-1" : "space-y-2 pt-2"}`}>
          <Label className="text-[10px] font-bold uppercase text-primary tracking-tight">
            Ordenar por
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "rgn", label: "Animal" },
              { value: "farm", label: "Fazenda" },
              { value: "birthDate", label: "Nascimento" },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex min-h-10 cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-center transition-colors ${
                  (filters.birthForecastSortBy ?? "rgn") === option.value
                    ? "border-primary bg-primary/10 font-bold text-primary"
                    : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40"
                }`}
              >
                <input
                  type="radio"
                  name="birthForecastSortBy"
                  value={option.value}
                  checked={(filters.birthForecastSortBy ?? "rgn") === option.value}
                  onChange={() =>
                    updateFilters({
                      birthForecastSortBy: option.value as "rgn" | "farm" | "birthDate",
                    })
                  }
                  className="sr-only"
                />
                <span className="text-[10px] uppercase leading-tight">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Column Selection */}
      {selectedReport.allowColumnSelection && (
        <div className={`border-t border-border/40 ${compact ? "space-y-2 pt-3" : "space-y-4 pt-4"}`}>
          <div className="flex justify-between items-end">
            <div>
              <Label className="text-[10px] font-bold uppercase text-primary tracking-tight">
                Colunas de Dados
              </Label>
              <p className="text-[10px] text-muted-foreground italic leading-tight">
                RGD / RGN é sempre incluída primeiro. Máximo de{" "}
                {effectiveMaxColumns} colunas.
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                maxColumnsReached
                  ? "bg-amber-100 text-amber-700"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {columnCount} / {effectiveMaxColumns}
            </span>
          </div>

          <div className="bg-muted/30 rounded-xl px-1.5 py-2 grid grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-1 border border-border/30">
            {(selectedReport.id === "reproduction"
              ? REPRODUCTION_REPORT_AVAILABLE_COLUMNS
              : ANIMAL_REPORT_AVAILABLE_COLUMNS
            ).map((column) => {
              const isChecked =
                filters.selectedColumns?.some(
                  (c) => c.dataKey === column.dataKey,
                ) ?? false;

              // Default check for disabled state
              const isDisabled = maxColumnsReached && !isChecked;

              return (
                <div key={column.dataKey} className="flex items-center">
                  <ReportCheckboxItem
                    id={column.dataKey}
                    label={column.header}
                    checked={isChecked}
                    disabled={isDisabled}
                    onCheckedChange={() => handleColumnToggle(column)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Modals */}
      <SexFilterModal
        open={sexModalOpen}
        onOpenChange={setSexModalOpen}
        currentSex={filters.sex}
        currentFilterMode={filters.sexFilterMode || "all"}
        onConfirm={(sex, filterMode) => {
          handleSexFilterConfirm(sex, filterMode);
          const isSexColumnSelected =
            filters.selectedColumns?.some((c) => c.dataKey === "sex") ?? false;
          if (!isSexColumnSelected) {
            toggleColumn({ header: "SEXO", dataKey: "sex" });
          }
        }}
      />

      <StatusFilterModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        statuses={statuses}
        currentStatus={filters.status}
        currentFilterMode={filters.statusFilterMode || "all"}
        onConfirm={(status, filterMode) => {
          handleStatusFilterConfirm(status, filterMode);
          const isStatusColumnSelected =
            filters.selectedColumns?.some((c) => c.dataKey === "status") ??
            false;
          if (!isStatusColumnSelected) {
            toggleColumn({ header: "STATUS", dataKey: "status" });
          }
        }}
      />

      <ClassFilterModal
        open={classModalOpen}
        onOpenChange={setClassModalOpen}
        currentClasses={filters.classes}
        currentFilterMode={filters.classFilterMode || "all"}
        onConfirm={(classes, filterMode) => {
          handleClassFilterConfirm(classes, filterMode);
          if (!isClassColumnSelected) {
            toggleColumn({ header: "CLASSE", dataKey: "classification" });
          }
        }}
      />

      <SocietyFilterModal
        open={societyModalOpen}
        onOpenChange={setSocietyModalOpen}
        societies={availableSocieties}
        currentSociety={filters.society}
        currentFilterMode={filters.societyFilterMode || "all"}
        onConfirm={(society, filterMode) => {
          handleSocietyFilterConfirm(society, filterMode);
          if (!isSocietyColumnSelected) {
            toggleColumn({ header: "SOCIEDADE", dataKey: "society" });
          }
        }}
      />

      <AnimalStateFilterModal
        open={animalStateModalOpen}
        onOpenChange={setAnimalStateModalOpen}
        currentValue={filters.animalState}
        currentFilterMode={filters.animalStateFilterMode || "all"}
        onConfirm={(animalState, filterMode) => {
          handleAnimalStateFilterConfirm(animalState, filterMode || "all");
          const isAnimalStateColumnSelected =
            filters.selectedColumns?.some((c) => c.dataKey === "animalState") ??
            false;
          if (!isAnimalStateColumnSelected) {
            toggleColumn({ header: "ATIVIDADE", dataKey: "animalState" });
          }
        }}
      />

      {showGenerateActions && (
        <div className={`${compact ? "pt-3" : "pt-4"} grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]`}>
        <Button
          onClick={generateReport}
          disabled={isGenerating || isGeneratingCowReport}
          className="h-11 px-10 uppercase font-black text-xs tracking-wider shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98] w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Gerando Relatório...
            </>
          ) : (
            "Gerar Relatório"
          )}
        </Button>

        {selectedReport.id === "reproduction" && (
          <Button
            onClick={handleGenerateReproductionByCowReport}
            disabled={isGenerating || isGeneratingCowReport}
            variant="secondary"
            className="h-11 px-6 uppercase font-black text-xs tracking-wider shadow-lg w-full md:w-auto"
          >
            {isGeneratingCowReport ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Gerando relatório por vaca...
              </>
            ) : (
              "Gerar relatório por vaca"
            )}
          </Button>
        )}
        </div>
      )}
    </div>
  );
}
