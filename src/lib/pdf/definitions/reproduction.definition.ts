import { getDatabase } from "@/db/client";
import { Animal } from "@/types/animal.type";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { ReportDefinition, ReportGeneratorParams } from "./types";
import { generateReproductionPDF } from "../generators/reproduction";
import { formatDate, formatAge, getTodayFormatted } from "@/utils/dates";

async function generateReproductionReport(
  params: ReportGeneratorParams,
): Promise<void> {
  const { filters } = params;

  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  // Fetch farms for mapping farm_id to farm_name
  const farmDocs = await db.farms
    .find({
      selector: { _deleted: { $eq: false } },
    })
    .exec();
  const farms = farmDocs.map((doc) => doc.toJSON());
  const farmMap = new Map(
    farms.map((f: { id: string; farm_name?: string }) => [
      f.id,
      f.farm_name || "",
    ]),
  );

  const animalSelector: any = {
    _deleted: { $eq: false },
    sex: { $eq: "F" },
  };

  if (
    filters.farmIds &&
    filters.farmIds.length > 0 &&
    filters.farmFilterMode !== "all"
  ) {
    // @ts-ignore
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
    // @ts-ignore
    animalSelector.animal_state = { $eq: filters.animalState };
  }

  const animalDocs = await db.animals
    .find({
      selector: animalSelector,
    })
    .exec();

  const animals = animalDocs.map((doc) => doc.toJSON() as Animal);
  const animalRgns = animals.map((a) => a.rgn);

  const showFarmColumn = !filters.farmId || filters.farmFilterMode === "all";

  const animalMap = new Map(
    animals.map((a) => [
      a.rgn,
      { ...a, farmName: farmMap.get(a.farm_id || "") || "---" },
    ]),
  );

  const selector: Record<string, any> = {
    _deleted: { $eq: false },
    rgn: { $in: animalRgns },
  };

  // Filter by specific management dates (d10_date) at the DB level
  if (filters.managementDates && filters.managementDates.length > 0) {
    selector.d10_date =
      filters.managementDates.length === 1
        ? { $eq: filters.managementDates[0] }
        : { $in: filters.managementDates };
  } else if (filters.startDate || filters.endDate) {
    selector.d10_date = {};
    if (filters.startDate) selector.d10_date.$gte = filters.startDate;
    if (filters.endDate) selector.d10_date.$lte = filters.endDate;
  }

  if (filters.eventType && filters.eventType !== "Todos") {
    selector.event_type = { $eq: filters.eventType };
  }

  const eventDocs = await db.reproduction_events
    .find({
      selector,
      sort: [{ rgn: "asc" as const }],
    })
    .exec();

  const events = eventDocs.map((doc) => doc.toJSON() as ReproductionEvent);

  const reportData = {
    farmName:
      filters.farmNames && filters.farmNames.length > 0
        ? filters.farmNames.join(", ")
        : filters.farmName || "Todas as Fazendas",
    showFarmColumn,
    managementDate: filters.managementDates?.length
      ? filters.managementDates.map((d) => formatDate(d)).join(", ")
      : "---",
    data: events
      .map((event) => {
        const animal = animalMap.get(event.rgn);
        return {
          rgn: event.rgn || "---",
          farmName: showFarmColumn ? animal?.farmName || "---" : undefined,
          idade: formatAge(animal?.born_date, { short: true }),
          classification: animal?.classification || "---",
          event_type: event.event_type || "---",
          productive_status: event.productive_status || "---",
          body_score: event.body_score?.toString() || "---",
          ovary_size: event.ovary_size || "---",
          ovary_structure: event.ovary_structure || "---",
          cycle_stage: event.cycle_stage || "---",
          protocol_name: event.protocol_name || "---",
          bull_name: event.bull_name || "---",
          d0_date: formatDate(event.d0_date),
          d8_date: formatDate(event.d8_date),
          d10_date: formatDate(event.d10_date),
          resync_bull: event.resync_bull || "---",
          resync_d0: formatDate(event.d22_date),
          resync_d8: formatDate(event.d30_date),
          diagnostic_d30: event.diagnostic_d30 || "---",
          resync_d10: formatDate(event.d32_date),
        };
      }),
    reportDate: getTodayFormatted(),
    systemName: "Rico Ouro",
  };

  await generateReproductionPDF(reportData);
}

export const reproductionDefinition: ReportDefinition = {
  id: "reproduction",
  title: "Reprodução",
  description:
    "Lista os eventos de manejo reprodutivo dos animais (de uma fazenda específica ou todas) em um período",
  icon: "Heart",
  requiredFilters: ["managementDates"],
  allowColumnSelection: false,
  generate: generateReproductionReport,
};
