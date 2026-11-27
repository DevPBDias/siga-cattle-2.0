import { getDatabase } from "@/db/client";
import { Animal } from "@/types/animal.type";
import { WeaningRecord } from "@/types/weaning_record.type";
import { formatDate, getTodayFormatted } from "@/utils/dates";
import { generateWeaningReportPDF } from "@/lib/pdf/generators/weaning-report";
import { ReportDefinition, ReportGeneratorParams } from "./types";

async function generateWeaningReport({ filters }: ReportGeneratorParams) {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  const [recordDocs, animalDocs, farmDocs] = await Promise.all([
    db.weaning_records.find({ selector: { _deleted: { $eq: false } } }).exec(),
    db.animals.find({ selector: { _deleted: { $eq: false } } }).exec(),
    db.farms.find({ selector: { _deleted: { $eq: false } } }).exec(),
  ]);
  const records = recordDocs.map((doc) => doc.toJSON() as WeaningRecord);
  const animalByKey = new Map<string, Animal>();
  for (const doc of animalDocs) {
    const animal = doc.toJSON() as Animal;
    if (animal.animal_key) animalByKey.set(animal.animal_key, animal);
  }
  const farmMap = new Map(
    farmDocs.map((doc) => {
      const farm = doc.toJSON() as { id: string; farm_name?: string };
      return [farm.id, farm.farm_name || "---"] as const;
    }),
  );

  const targetFarmId = filters.farmId || filters.farmIds?.[0];
  const hasDateRange = Boolean(filters.startDate || filters.endDate);
  const targetYear = !hasDateRange && filters.year ? Number(filters.year) : undefined;
  const filtered = records.filter((record) => {
    if (targetFarmId && record.farm_id !== targetFarmId) return false;
    const date = record.weaning_date?.slice(0, 10);
    if (hasDateRange) {
      if (!date) return false;
      if (filters.startDate && date < filters.startDate) return false;
      if (filters.endDate && date > filters.endDate) return false;
    } else if (targetYear && Number(date?.slice(0, 4)) !== targetYear) {
      return false;
    }
    return true;
  }).sort((a, b) => a.weaning_date.localeCompare(b.weaning_date) || a.animal_rgn.localeCompare(b.animal_rgn, "pt-BR", { numeric: true }));

  const reportRows = filtered.map((record) => {
    const animal = animalByKey.get(record.animal_key);
    return {
      ...record,
      breed: animal?.breed || "---",
      sex: animal?.sex === "M" ? "Macho" : animal?.sex === "F" ? "Fêmea" : animal?.sex || "---",
    };
  });

  let periodLabel: string | undefined;
  let yearFilter: string | undefined;
  if (hasDateRange) {
    const from = filters.startDate ? formatDate(filters.startDate) : "";
    const to = filters.endDate ? formatDate(filters.endDate) : "";
    if (from && to) periodLabel = `${from} – ${to}`;
    else if (from) periodLabel = `A partir de ${from}`;
    else if (to) periodLabel = `Até ${to}`;
  } else {
    yearFilter = targetYear ? String(targetYear) : undefined;
  }

  await generateWeaningReportPDF({
    farmName:
      filters.farmName ||
      filters.farmNames?.join(", ") ||
      (targetFarmId ? farmMap.get(targetFarmId) : undefined) ||
      "Todas as Fazendas",
    periodLabel,
    yearFilter,
    reportDate: getTodayFormatted(),
    systemName: "INDI Ouro 2.0",
    data: reportRows,
  });
}

export const weaningReportDefinition: ReportDefinition = {
  id: "weaning-records",
  title: "Desmamas",
  description: "Relatório de desmamas registradas",
  icon: "Baby",
  requiredFilters: [],
  allowColumnSelection: false,
  generate: generateWeaningReport,
};
