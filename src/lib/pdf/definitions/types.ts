/**
 * Report Definitions - Base Types
 *
 * Types for the report system architecture.
 * These types define the structure of report definitions and filters.
 *
 * IMPORTANT: This file should NOT contain any jsPDF imports or PDF generation logic.
 */

import { TableColumn } from "../types";

// =============================================================================
// Filter Types
// =============================================================================

/**
 * Available filter types for reports
 */
export type FilterType =
  | "farm"
  | "sex"
  | "dateRange"
  | "managementDates"
  | "status"
  | "class"
  | "society"
  | "animalState"
  | "eventType";

/**
 * Gender filter options
 */
export type GenderFilterValue = "M" | "F" | "Ambos";

/**
 * Animal state filter options
 */
export type AnimalStateFilterValue = "ATIVO" | "INATIVO" | "Ambos";

/**
 * Sort options for animal report
 */
export type AnimalReportSortBy = "rgn" | "classification";
export type BirthForecastSortBy = "rgn" | "farm" | "birthDate";

/**
 * Active filters state
 */
export interface ReportFilters {
  farmId?: string;
  farmIds?: string[];
  farmName?: string;
  farmNames?: string[];
  farmFilterMode?: "all" | "specific" | "multiple"; // "all" para todas, "specific" para uma, "multiple" para várias
  sex?: GenderFilterValue;
  sexFilterMode?: "all" | "specific"; // "all" para ambos (mostra coluna), "specific" para M/F (filtra, não mostra)
  animalState?: AnimalStateFilterValue;
  animalStateFilterMode?: "all" | "specific";
  startDate?: string;
  endDate?: string;
  selectedColumns?: TableColumn[];
  year?: string;
  managementDates?: string[]; // Selected d10_dates for reproduction report
  eventType?: import("@/types/reproduction_event.type").EventType | "Todos";
  status?: string;
  statusFilterMode?: "all" | "specific"; // "all" para todos (mostra coluna), "specific" para um status (filtra, não mostra)
  sortBy?: AnimalReportSortBy; // Ordenação do relatório de animais
  classes?: string[];
  classFilterMode?: "all" | "specific";
  society?: string;
  societyFilterMode?: "all" | "specific";
  birthForecastSortBy?: BirthForecastSortBy;
}

// =============================================================================
// Report Definition
// =============================================================================

/**
 * Parameters passed to the report generator function.
 * The generator is responsible for fetching data and generating the PDF.
 */
export interface ReportGeneratorParams {
  filters: ReportFilters;
}

/**
 * Base type for report definitions.
 * Each report type must implement this interface.
 *
 * DESIGN DECISION: The `generate` function receives only the filters.
 * It is responsible for:
 * 1. Fetching necessary data (animals, vaccines, etc.)
 * 2. Transforming data for the PDF
 * 3. Calling the appropriate PDF generator
 *
 * This keeps the Context API clean and free from data fetching logic.
 */
export interface ReportDefinition {
  /** Unique identifier for the report */
  id: string;

  /** Display title for the report */
  title: string;

  /** Short description explaining what the report contains */
  description: string;

  /** Lucide icon name for the report card */
  icon: string;

  /** List of required filters that must be filled before generating */
  requiredFilters: FilterType[];

  /** Whether the user can select which columns to include */
  allowColumnSelection: boolean;

  /** The generator function - called when user clicks "Generate PDF" */
  generate: (params: ReportGeneratorParams) => Promise<void>;
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validation error for a specific filter
 */
export interface FilterValidationError {
  field: FilterType | "columns";
  message: string;
}

/**
 * Validates that all required filters are filled
 *
 * @param definition - The report definition with required filters
 * @param filters - The current filter values
 * @returns Array of validation errors (empty if valid)
 */
export function validateRequiredFilters(
  definition: ReportDefinition,
  filters: ReportFilters
): FilterValidationError[] {
  const errors: FilterValidationError[] = [];

  for (const filterType of definition.requiredFilters) {
    switch (filterType) {
      case "farm":
        if (!filters.farmId && filters.farmFilterMode !== "all") {
          errors.push({ field: "farm", message: "Selecione uma fazenda" });
        }
        break;

      case "sex":
        if (!filters.sex) {
          errors.push({ field: "sex", message: "Selecione o sexo" });
        }
        break;

      case "dateRange":
        if (!filters.startDate) {
          errors.push({
            field: "dateRange",
            message: "Selecione a data inicial",
          });
        }
        if (!filters.endDate) {
          errors.push({
            field: "dateRange",
            message: "Selecione a data final",
          });
        }
        break;

      case "managementDates":
        if (!filters.managementDates || filters.managementDates.length === 0) {
          errors.push({
            field: "managementDates",
            message: "Selecione ao menos uma data de manejo",
          });
        }
        break;

      case "status":
        if (!filters.status) {
          errors.push({ field: "status", message: "Selecione um status" });
        }
        break;
    }
  }

  return errors;
}
