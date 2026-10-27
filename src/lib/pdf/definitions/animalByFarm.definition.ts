import { getDatabase } from "@/db/client";
import { Animal } from "@/types/animal.type";
import { ReportDefinition, ReportGeneratorParams } from "./types";
import { generateAnimalsByFarmPDF } from "../generators/animals-by-farm";
import {
  ANIMAL_REPORT_AVAILABLE_COLUMNS,
  DEFAULT_SELECTED_COLUMNS,
} from "./availableColumns";
import {
  calculateAgeInMonths,
  getAgeRange,
  formatDate,
  formatAge,
  getTodayFormatted,
} from "@/utils/dates";

async function generateAnimalByFarmReport(
  params: ReportGeneratorParams,
): Promise<void> {
  const { filters } = params;

  // Get database instance
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  // Fetch farms for mapping farm_id to farm_name
  const farmDocs = await db.farms
    .find({
      selector: { _deleted: { $eq: false } },
    })
    .exec();
  const farms = farmDocs.map((doc) => doc.toJSON());
  const farmMap = new Map(farms.map((f: any) => [f.id, f.farm_name || ""]));

  // Build selector based on filters
  const selector: any = {
    _deleted: { $eq: false },
  };

  // Add farm filter — single or multiple
  if (
    filters.farmIds &&
    filters.farmIds.length > 0 &&
    filters.farmFilterMode !== "all"
  ) {
    selector.farm_id =
      filters.farmIds.length === 1
        ? { $eq: filters.farmIds[0] }
        : { $in: filters.farmIds };
  } else if (filters.farmId && filters.farmFilterMode === "specific") {
    selector.farm_id = { $eq: filters.farmId };
  }

  // Add sex filter only if sexFilterMode is "specific"
  if (
    filters.sex &&
    filters.sexFilterMode === "specific" &&
    filters.sex !== "Ambos"
  ) {
    selector.sex = { $eq: filters.sex };
  }

  // Add status filter only if statusFilterMode is "specific"
  if (
    filters.status &&
    filters.statusFilterMode === "specific" &&
    filters.status !== "Todos"
  ) {
    selector.status = { $eq: filters.status };
  }

  // Add class filter only if classFilterMode is "specific"
  if (
    filters.classes &&
    filters.classes.length > 0 &&
    filters.classFilterMode === "specific"
  ) {
    selector.classification = { $in: filters.classes };
  }

  // Add society filter only if societyFilterMode is "specific"
  if (filters.society && filters.societyFilterMode === "specific") {
    selector.partnership = { $eq: filters.society };
  }

  // Add animal_state filter only if animalStateFilterMode is "specific"
  if (
    filters.animalState &&
    filters.animalStateFilterMode === "specific" &&
    filters.animalState !== "Ambos"
  ) {
    selector.animal_state = { $eq: filters.animalState };
  }

  // Fetch animals from database
  const docs = await db.animals
    .find({
      selector,
      sort: [{ rgn: "asc" as const }],
    })
    .exec();

  const animals = docs.map((doc) => doc.toJSON() as Animal);

  // Determine which filter columns to show
  // Only show when column is selected AND filterMode is "all"
  // When filterMode is "specific", don't show the column (it doesn't count towards limit)
  const isFarmColumnSelected =
    filters.selectedColumns?.some((c) => c.dataKey === "farmName") ?? false;
  const isSexColumnSelected =
    filters.selectedColumns?.some((c) => c.dataKey === "sex") ?? false;
  const isStatusColumnSelected =
    filters.selectedColumns?.some((c) => c.dataKey === "status") ?? false;
  const isClassColumnSelected =
    filters.selectedColumns?.some((c) => c.dataKey === "classification") ??
    false;
  const isSocietyColumnSelected =
    filters.selectedColumns?.some((c) => c.dataKey === "society") ?? false;
  const isSituationColumnSelected =
    filters.selectedColumns?.some((c) => c.dataKey === "document_situation") ??
    false;
  const isAnimalStateColumnSelected =
    filters.selectedColumns?.some((c) => c.dataKey === "animalState") ?? false;

  const showFarmColumn = isFarmColumnSelected;
  const showSexColumn = isSexColumnSelected;
  const showStatusColumn = isStatusColumnSelected;
  const showClassColumn = isClassColumnSelected;
  const showSocietyColumn = isSocietyColumnSelected;
  const showSituationColumn = isSituationColumnSelected;
  const showAnimalStateColumn = isAnimalStateColumnSelected;

  // Transform data for report
  const reportData = {
    farmName:
      filters.farmNames && filters.farmNames.length > 0
        ? filters.farmNames.join(", ")
        : filters.farmName || "Todas as Fazendas",
    gender: filters.sex || "Ambos",
    totalItems: animals.length,
    showFarmColumn,
    showSexColumn,
    showStatusColumn,
    showClassColumn,
    showSocietyColumn,
    showSituationColumn,
    showAnimalStateColumn,
    sortBy: filters.sortBy || "rgn", // Ordenação: RGN (padrão) ou Classe
    data: animals.map((animal) => ({
      rgd: animal.serie_rgd || "",
      rgn: animal.rgn || "",
      farmName: showFarmColumn
        ? farmMap.get(animal.farm_id || "") || "---"
        : undefined,
      sex: showSexColumn ? animal.sex || "---" : undefined,
      status: showStatusColumn ? animal.status || "---" : undefined,
      name: animal.name || "---",
      birthDate: formatDate(animal.born_date, "---"),
      age: animal.born_date ? formatAge(animal.born_date, { short: true }) : "---",
      fatherRgd: animal.father_name || "---",
      motherRgd: animal.mother_rgn
        ? `${animal.mother_serie_rgd || ""} ${animal.mother_rgn}`
            .replace(/\//g, "")
            .trim()
        : "---",
      iabcgz: animal.iabcgz || "---",
      deca: animal.deca || "---",
      maternal_grandfather_name: animal.maternal_grandfather_name || "---",
      paternal_grandfather_name: animal.paternal_grandfather_name || "---",
      p: animal.p || "---",
      f: animal.f || "---",
      classification: showClassColumn
        ? animal.classification || "---"
        : undefined,
      society: showSocietyColumn ? animal.partnership || "---" : undefined,
      document_situation: showSituationColumn
        ? animal.document_situation || "---"
        : undefined,
      animalState: showAnimalStateColumn
        ? animal.animal_state || "---"
        : undefined,
      genotype: animal.genotyping || "---",
      category: getAgeRange(calculateAgeInMonths(animal.born_date)),
      observations: "---",
    })),
    reportDate: getTodayFormatted(),
    systemName:
      filters.farmNames && filters.farmNames.length > 0
        ? filters.farmNames.join(", ")
        : filters.farmName || "Todas as Fazendas",
  };

  let selectedColumns =
    filters.selectedColumns && filters.selectedColumns.length > 0
      ? [...filters.selectedColumns]
      : [...DEFAULT_SELECTED_COLUMNS];

  await generateAnimalsByFarmPDF(reportData, selectedColumns);
}

export const animalByFarmDefinition: ReportDefinition = {
  id: "animals-by-farm",
  title: "Animais por Fazenda",
  description:
    "Lista todos os animais (de uma fazenda específica ou todas) com colunas personalizáveis",
  icon: "Beef",
  requiredFilters: ["sex", "status"], // farm é opcional agora
  allowColumnSelection: true,
  generate: generateAnimalByFarmReport,
};

export { ANIMAL_REPORT_AVAILABLE_COLUMNS, DEFAULT_SELECTED_COLUMNS };
