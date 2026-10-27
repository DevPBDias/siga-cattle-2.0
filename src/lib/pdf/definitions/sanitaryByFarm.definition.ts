import { getDatabase } from "@/db/client";
import { Animal } from "@/types/animal.type";
import { AnimalVaccine, Vaccine } from "@/types/vaccine.type";
import { ReportDefinition, ReportGeneratorParams } from "./types";
import { generateSanitaryByFarmPDF } from "../generators/sanitary-by-farm";
import { formatDate, getTodayFormatted, todayISO } from "@/utils/dates";

async function generateSanitaryReport(
  params: ReportGeneratorParams,
): Promise<void> {
  const { filters } = params;

  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  const animalSelector: any = {
    _deleted: { $eq: false },
  };

  if (
    filters.farmIds &&
    filters.farmIds.length > 0 &&
    filters.farmFilterMode !== "all"
  ) {
    animalSelector.farm_id =
      filters.farmIds.length === 1
        ? { $eq: filters.farmIds[0] }
        : { $in: filters.farmIds };
  } else if (filters.farmId && filters.farmFilterMode === "specific") {
    animalSelector.farm_id = { $eq: filters.farmId };
  }

  if (
    filters.animalState &&
    filters.animalStateFilterMode === "specific" &&
    filters.animalState !== "Ambos"
  ) {
    animalSelector.animal_state = { $eq: filters.animalState };
  }

  const animalDocs = await db.animals
    .find({
      selector: animalSelector,
    })
    .exec();

  const animals = animalDocs.map((doc) => doc.toJSON() as Animal);
  const animalRgns = animals.map((a) => a.rgn);

  const vaccineDocs = await db.vaccines
    .find({
      selector: { _deleted: { $eq: false } },
    })
    .exec();
  const vaccines = vaccineDocs.map((doc) => doc.toJSON() as Vaccine);
  const vaccineMap = new Map(vaccines.map((v) => [v.id, v.vaccine_name]));

  const vaccinationDocs = await db.animal_vaccines
    .find({
      selector: {
        _deleted: { $eq: false },
        rgn: { $in: animalRgns },
        date: {
          $gte: filters.startDate || "",
          $lte: filters.endDate || todayISO(),
        },
      },
      sort: [{ date: "desc" as const }],
    })
    .exec();

  const vaccinations = vaccinationDocs.map(
    (doc) => doc.toJSON() as AnimalVaccine,
  );

  const animalMap = new Map(animals.map((a) => [a.rgn, a]));

  const reportData = {
    farmName:
      filters.farmNames && filters.farmNames.length > 0
        ? filters.farmNames.join(", ")
        : filters.farmName || "Todas as Fazendas",
    startDate: formatDate(filters.startDate),
    endDate: formatDate(filters.endDate),
    data: vaccinations.map((vac) => {
      const animal = animalMap.get(vac.rgn);
      return {
        rgd: animal?.serie_rgd || "",
        rgn: vac.rgn || "",
        animalName: animal?.name || "---",
        vaccineName: vaccineMap.get(vac.vaccine_id) || "---",
        date: formatDate(vac.date, "---"),
        observations: "---",
      };
    }),
    reportDate: getTodayFormatted(),
    systemName: "Rico Ouro",
  };

  await generateSanitaryByFarmPDF(reportData);
}

export const sanitaryByFarmDefinition: ReportDefinition = {
  id: "sanitary-by-farm",
  title: "Sanitário Vacinas",
  description: "Lista todas as aplicações de vacinas em um período específico",
  icon: "Syringe",
  requiredFilters: ["farm", "dateRange"],
  allowColumnSelection: false,
  generate: generateSanitaryReport,
};
