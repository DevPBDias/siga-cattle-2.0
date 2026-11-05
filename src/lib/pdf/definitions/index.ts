export * from "./types";
export * from "./availableColumns";

export { animalByFarmDefinition } from "./animalByFarm.definition";
export { sanitaryByFarmDefinition } from "./sanitaryByFarm.definition";
export { weightPerformanceDefinition } from "./weightPerformance.definition";
export { reproductionDefinition } from "./reproduction.definition";
export { semenDoseDefinition } from "./semenDose.definition";
export { birthForecastDefinition } from "./birthForecast.definition";

import { animalByFarmDefinition } from "./animalByFarm.definition";
import { sanitaryByFarmDefinition } from "./sanitaryByFarm.definition";
import { weightPerformanceDefinition } from "./weightPerformance.definition";
import { reproductionDefinition } from "./reproduction.definition";
import { semenDoseDefinition } from "./semenDose.definition";
import { ReportDefinition } from "./types";

// birthForecastDefinition foi movido para a tela de Nascimentos (src/components/features/nascimentos/BirthReport.tsx)
export const AVAILABLE_REPORTS: ReportDefinition[] = [
  animalByFarmDefinition,
  sanitaryByFarmDefinition,
  weightPerformanceDefinition,
  reproductionDefinition,
  semenDoseDefinition,
];
