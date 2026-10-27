import { getDatabase } from "@/db/client";
import { SemenDose } from "@/types/semen_dose.type";
import { ReportDefinition, ReportGeneratorParams } from "./types";
import { generateSemenDosePDF } from "../generators/semen-dose";
import { getTodayFormatted } from "@/utils/dates";

async function generateSemenDoseReport(
  params: ReportGeneratorParams
): Promise<void> {
  const { filters } = params;
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  // Fetch all semen doses (not deleted)
  const docs = await db.semen_doses
    .find({
      selector: {
        _deleted: { $eq: false },
      },
      sort: [{ animal_name: "asc" as const }],
    })
    .exec();

  const doses = docs.map((doc) => doc.toJSON() as SemenDose);

  // Sorting alphabetically by breed, then by animal name
  const sortedDoses = doses.sort((a, b) => {
    const breedA = (a.breed || "").toUpperCase();
    const breedB = (b.breed || "").toUpperCase();
    if (breedA < breedB) return -1;
    if (breedA > breedB) return 1;

    const nameA = (a.animal_name || "").toUpperCase();
    const nameB = (b.animal_name || "").toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

  const reportData = {
    farmName: filters.farmName || "GERAL",
    reportDate: getTodayFormatted(),
    systemName: filters.farmName || "RICO OURO",
    totalItems: doses.length,
    data: sortedDoses.map((dose) => ({
      animal_name: (dose.animal_name || "---").toUpperCase(),
      breed: (dose.breed || "---").toUpperCase(),
      quantity: dose.quantity,
      father_name: (dose.father_name || "---").toUpperCase(),
      maternal_grandfather_name: (
        dose.maternal_grandfather_name || "---"
      ).toUpperCase(),
      iabcz: (dose.iabcz || "---").toUpperCase(),
      registration: (dose.registration || "---").toUpperCase(),
      center_name: (dose.center_name || "---").toUpperCase(),
    })),
  };

  await generateSemenDosePDF(reportData);
}

export const semenDoseDefinition: ReportDefinition = {
  id: "semen-dose",
  title: "Estoque de Sêmen",
  description: "Relatório completo do estoque de sêmen disponível",
  icon: "FlaskConical",
  requiredFilters: [], // No mandatory filters for this report currently
  allowColumnSelection: false,
  generate: generateSemenDoseReport,
};
