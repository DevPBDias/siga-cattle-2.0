import { getDatabase } from "@/db/client";
import { Animal } from "@/types/animal.type";
import { AnimalMetric } from "@/types/animal_metrics.type";
import { ReportDefinition, ReportGeneratorParams } from "./types";
import { generateWeightPerformancePDF } from "../generators/weight-performance";
import { formatDate, getTodayFormatted, diffInDays } from "@/utils/dates";

/**
 * Fetches weight data and generates the PDF report.
 *
 * @param params - Filters from the context
 */
async function generateWeightReport(
  params: ReportGeneratorParams,
): Promise<void> {
  const { filters } = params;

  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  // Add farm filter — single or multiple
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

  // Add animal_state filter only if animalStateFilterMode is "specific"
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

  // Fetch all weight metrics for these animals
  const weightDocs = await db.animal_metrics_weight
    .find({
      selector: {
        _deleted: { $eq: false },
        rgn: { $in: animalRgns },
      },
      sort: [{ date: "desc" as const }],
    })
    .exec();

  const weights = weightDocs.map((doc) => doc.toJSON() as AnimalMetric);

  // Group weights by RGN and get last 5
  const weightsByRgn = new Map<string, AnimalMetric[]>();
  for (const w of weights) {
    if (!weightsByRgn.has(w.rgn)) {
      weightsByRgn.set(w.rgn, []);
    }
    const arr = weightsByRgn.get(w.rgn)!;
    if (arr.length < 5) {
      arr.push(w);
    }
  }

  // Create animal lookup map
  const animalMap = new Map(animals.map((a) => [a.rgn, a]));

  // Transform data for report
  const reportData = {
    farmName:
      filters.farmNames && filters.farmNames.length > 0
        ? filters.farmNames.join(", ")
        : filters.farmName || "Todas as Fazendas",
    gender: filters.sex || "Ambos",
    data: animals
      .filter((a) => weightsByRgn.has(a.rgn))
      .map((animal) => {
        const animalWeights = weightsByRgn.get(animal.rgn) || [];

        // Calculate GMD if we have at least 2 weights
        let gmd = 0;
        if (animalWeights.length >= 2) {
          const firstW = animalWeights[animalWeights.length - 1];
          const lastW = animalWeights[0];
          const days = diffInDays(firstW.date, lastW.date);
          if (days > 0) {
            gmd = (lastW.value - firstW.value) / days;
          }
        }

        const formatWeight = (w?: AnimalMetric) =>
          w
            ? {
                weight: w.value,
                date: formatDate(w.date),
              }
            : undefined;

        return {
          rgd: animal.serie_rgd || "",
          rgn: animal.rgn || "",
          animalName: animal.name || "---",
          p1: formatWeight(animalWeights[0]),
          p2: formatWeight(animalWeights[1]),
          p3: formatWeight(animalWeights[2]),
          p4: formatWeight(animalWeights[3]),
          p5: formatWeight(animalWeights[4]),
          gmd: gmd,
        };
      }),
    reportDate: getTodayFormatted(),
    systemName: "Rico Ouro",
  };

  await generateWeightPerformancePDF(reportData);
}

/**
 * Report definition for "Weight Performance"
 */
export const weightPerformanceDefinition: ReportDefinition = {
  id: "weight-performance",
  title: "Desempenho Pesagens",
  description:
    "Mostra as últimas pesagens e o GMD (ganho médio diário) dos animais",
  icon: "Scale",
  requiredFilters: ["farm"],
  allowColumnSelection: false,
  generate: generateWeightReport,
};
