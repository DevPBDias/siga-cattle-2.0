import { getDatabase } from "@/db/client";
import { Animal } from "@/types/animal.type";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { ReportDefinition, ReportGeneratorParams } from "./types";
import { generateReproductionByCowPDF } from "../generators/reproduction-by-cow";
import { calculateAgeInMonths, formatDate, formatAge, getTodayFormatted } from "@/utils/dates";

async function generateReproductionByCowReport(
  params: ReportGeneratorParams,
): Promise<void> {
  const { filters } = params;

  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  const animalSelector: any = {
    _deleted: { $eq: false },
    sex: { $eq: "F" },
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

  const animalDocs = await db.animals.find({ selector: animalSelector }).exec();
  const animals = animalDocs.map((doc) => doc.toJSON() as Animal);
  const animalMap = new Map(animals.map((animal) => [animal.rgn, animal]));
  const animalRgns = animals.map((animal) => animal.rgn);
  const farmName =
    filters.farmNames?.join(", ") ||
    filters.farmName ||
    "Todas as Fazendas";
  if (animalRgns.length === 0) {
    await generateReproductionByCowPDF({
      farmName,
      reportDate: getTodayFormatted(),
      systemName: "Rico Ouro",
      data: [],
    });
    return;
  }

  const eventSelector: any = {
    _deleted: { $eq: false },
    rgn: { $in: animalRgns },
  };

  if (filters.managementDates && filters.managementDates.length > 0) {
    eventSelector.d10_date =
      filters.managementDates.length === 1
        ? { $eq: filters.managementDates[0] }
        : { $in: filters.managementDates };
  } else if (filters.year) {
    eventSelector.d10_date = {
      $gte: `${filters.year}-01-01`,
      $lte: `${filters.year}-12-31`,
    };
  }

  if (filters.eventType && filters.eventType !== "Todos") {
    eventSelector.event_type = { $eq: filters.eventType };
  }

  const eventDocs = await db.reproduction_events
    .find({ selector: eventSelector })
    .exec();
  const events = eventDocs.map((doc) => doc.toJSON() as ReproductionEvent);

  const cowMap = new Map<
    string,
    {
      rgn: string;
      birth_date?: string;
      quantity: number;
      managementDates: Set<string>;
      protocolNames: Set<string>;
      eventTypes: Set<string>;
      bullNames: Set<string>;
    }
  >();

  for (const event of events) {
    const existing = cowMap.get(event.rgn);
    if (existing) {
      existing.quantity += 1;
      if (event.d10_date) existing.managementDates.add(event.d10_date);
      if (event.protocol_name) existing.protocolNames.add(event.protocol_name);
      if (event.event_type) existing.eventTypes.add(event.event_type);
      if (event.bull_name) existing.bullNames.add(event.bull_name);
    } else {
      cowMap.set(event.rgn, {
        rgn: event.rgn,
        birth_date: animalMap.get(event.rgn)?.born_date,
        quantity: 1,
        managementDates: event.d10_date
          ? new Set([event.d10_date])
          : new Set(),
        protocolNames: event.protocol_name
          ? new Set([event.protocol_name])
          : new Set(),
        eventTypes: event.event_type ? new Set([event.event_type]) : new Set(),
        bullNames: event.bull_name ? new Set([event.bull_name]) : new Set(),
      });
    }
  }

  const data = Array.from(cowMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .map((cow) => ({
      rgn: cow.rgn,
      idade: formatAge(cow.birth_date),
      quantity: cow.quantity,
      management_dates: Array.from(cow.managementDates)
        .sort()
        .map((date) => formatDate(date))
        .filter(Boolean)
        .join(", "),
      protocol_names: Array.from(cow.protocolNames).join(", "),
      event_types: Array.from(cow.eventTypes).join(", "),
      bull_names: Array.from(cow.bullNames)
        .map((bull) => bull.toUpperCase())
        .join(", "),
    }));

  await generateReproductionByCowPDF({
    farmName,
    reportDate: getTodayFormatted(),
    systemName: "Rico Ouro",
    data,
  });
}

export const reproductionByCowDefinition: ReportDefinition = {
  id: "reproduction-by-cow",
  title: "Reprodução por Vaca",
  description:
    "Relatório de contagem de eventos reprodutivos por vaca, com datas D10 e touros envolvidos",
  icon: "Heart",
  requiredFilters: [],
  allowColumnSelection: false,
  generate: generateReproductionByCowReport,
};
