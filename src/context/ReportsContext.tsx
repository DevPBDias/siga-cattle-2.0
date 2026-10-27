"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  ReportDefinition,
  ReportFilters,
  FilterValidationError,
  validateRequiredFilters,
  GenderFilterValue,
} from "@/lib/pdf/definitions/types";
import { animalByFarmDefinition } from "@/lib/pdf/definitions/animalByFarm.definition";
import {
  DEFAULT_SELECTED_COLUMNS,
  REPRODUCTION_DEFAULT_COLUMNS,
} from "@/lib/pdf/definitions/availableColumns";
import { TableColumn } from "@/lib/pdf/types";

interface ReportsContextState {
  selectedReport: ReportDefinition | null;
  filters: ReportFilters;
  isGenerating: boolean;
  validationErrors: FilterValidationError[];
}

interface ReportsContextActions {
  selectReport: (report: ReportDefinition) => void;
  updateFilter: <K extends keyof ReportFilters>(
    key: K,
    value: ReportFilters[K],
  ) => void;
  updateFilters: (updates: Partial<ReportFilters>) => void;
  toggleColumn: (column: TableColumn) => void;
  validateFilters: () => boolean;
  generateReport: () => Promise<boolean>;
  reset: () => void;
}

type ReportsContextType = ReportsContextState & ReportsContextActions;

const initialFilters: ReportFilters = {
  farmId: undefined,
  farmIds: [],
  farmName: undefined,
  farmNames: [],
  farmFilterMode: "all",
  sex: "Ambos" as GenderFilterValue,
  sexFilterMode: undefined,
  animalState: "ATIVO",
  animalStateFilterMode: undefined,
  startDate: undefined,
  endDate: undefined,
  selectedColumns: DEFAULT_SELECTED_COLUMNS,
  year: undefined,
  status: "Todos",
  statusFilterMode: undefined,
  managementDates: [],
  birthForecastSortBy: "rgn",
  eventType: "Todos",
  sortBy: "rgn", // Padrão: ordenar por RGN
  classes: [],
  classFilterMode: undefined,
  society: undefined,
  societyFilterMode: undefined,
};

const initialState: ReportsContextState = {
  selectedReport: animalByFarmDefinition,
  filters: initialFilters,
  isGenerating: false,
  validationErrors: [],
};

const ReportsContext = createContext<ReportsContextType | null>(null);

export function useReports(): ReportsContextType {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error("useReports must be used within a ReportsProvider");
  }
  return context;
}

interface ReportsProviderProps {
  children: React.ReactNode;
}

export function ReportsProvider({ children }: ReportsProviderProps) {
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(
    animalByFarmDefinition,
  );
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    FilterValidationError[]
  >([]);

  const selectReport = useCallback((report: ReportDefinition) => {
    setSelectedReport(report);

    // Set default columns based on report type
    const defaultCols =
      report.id === "reproduction"
        ? REPRODUCTION_DEFAULT_COLUMNS
        : DEFAULT_SELECTED_COLUMNS;

    const currentYear = String(new Date().getFullYear());

    setFilters({
      ...initialFilters,
      selectedColumns: defaultCols,
      year: report.id === "birth-forecast" ? currentYear : undefined,
      farmFilterMode: "all",
    });
    setValidationErrors([]);
  }, []);

  const updateFilter = useCallback(
    <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      // Clear validation errors when user changes a filter
      setValidationErrors([]);
    },
    [],
  );

  const updateFilters = useCallback((updates: Partial<ReportFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setValidationErrors([]);
  }, []);

  const toggleColumn = useCallback((column: TableColumn) => {
    setFilters((prev) => {
      const currentColumns = prev.selectedColumns || [];
      const exists = currentColumns.some((c) => c.dataKey === column.dataKey);

      if (exists) {
        // Remove column
        return {
          ...prev,
          selectedColumns: currentColumns.filter(
            (c) => c.dataKey !== column.dataKey,
          ),
        };
      } else {
        // Add column
        return {
          ...prev,
          selectedColumns: [...currentColumns, column],
        };
      }
    });
    setValidationErrors([]);
  }, []);

  const validateFilters = useCallback((): boolean => {
    if (!selectedReport) return false;

    const errors = validateRequiredFilters(selectedReport, filters);
    setValidationErrors(errors);

    return errors.length === 0;
  }, [selectedReport, filters]);

  const generateReport = useCallback(async (): Promise<boolean> => {
    if (!selectedReport) return false;

    // Validate first
    const isValid = validateFilters();
    if (!isValid) return false;

    try {
      setIsGenerating(true);

      // Call the report's generate function with filters
      await selectedReport.generate({ filters });

      return true;
    } catch (error) {
      console.error("[ReportsContext] Error generating report:", error);
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [selectedReport, filters, validateFilters]);

  const reset = useCallback(() => {
    setSelectedReport(animalByFarmDefinition);
    setFilters(initialFilters);
    setValidationErrors([]);
    setIsGenerating(false);
  }, []);

  const value = useMemo<ReportsContextType>(
    () => ({
      selectedReport,
      filters,
      isGenerating,
      validationErrors,
      selectReport,
      updateFilter,
      updateFilters,
      toggleColumn,
      validateFilters,
      generateReport,
      reset,
    }),
    [
      selectedReport,
      filters,
      isGenerating,
      validationErrors,
      selectReport,
      updateFilter,
      updateFilters,
      toggleColumn,
      validateFilters,
      generateReport,
      reset,
    ],
  );

  return (
    <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
  );
}
