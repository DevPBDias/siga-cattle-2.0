import { getDatabase } from "@/db/client";
import { Animal } from "@/types/animal.type";
import { Movement } from "@/types/movement.type";
import { formatDate, getTodayFormatted } from "@/utils/dates";
import { generateBirthForecastPDF } from "../generators/birth-forecast";
import { ReportDefinition, ReportGeneratorParams } from "./types";
import { BirthReportItem } from "../types";

async function generateBirthForecastReport({
  filters,
}: ReportGeneratorParams): Promise<void> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  // 1. Buscar as movimentações cujo tipo seja 'nascimento' não deletadas
  const movementDocs = await db.movements
    .find({
      selector: {
        type: { $eq: "nascimento" },
        _deleted: { $eq: false },
      },
    })
    .exec();
  const movements = movementDocs.map((doc) => doc.toJSON() as Movement);

  // 2. Buscar animais para interligar ao registro da movimentação
  const animalDocs = await db.animals
    .find({ selector: { _deleted: { $eq: false } } })
    .exec();
  const animals = animalDocs.map((doc) => doc.toJSON() as Animal);
  const animalMap = new Map<string, Animal>();
  for (const a of animals) {
    if (a.rgn) animalMap.set(a.rgn, a);
  }

  // 3. Buscar fazendas
  const farmDocs = await db.farms
    .find({ selector: { _deleted: { $eq: false } } })
    .exec();
  const farmMap = new Map(
    farmDocs.map((doc) => {
      const farm = doc.toJSON() as { id: string; farm_name?: string };
      return [farm.id, farm.farm_name || "---"] as const;
    }),
  );

  // 4. Buscar pesos ao nascer (born_metric=true)
  const weightDocs = await db.animal_metrics_weight
    .find({
      selector: {
        born_metric: { $eq: true },
        _deleted: { $eq: false },
      },
    })
    .exec();
  const weightMap = new Map<string, number>();
  for (const doc of weightDocs) {
    const w = doc.toJSON() as { rgn: string; value: number };
    if (!weightMap.has(w.rgn)) {
      weightMap.set(w.rgn, w.value);
    }
  }

  // 5. Buscar perfis de usuários para mapear created_by ao nome de quem fez o registro
  const profileDocs = await db.user_profiles
    .find({ selector: { _deleted: { $eq: false } } })
    .exec();
  const profileMap = new Map<string, string>();
  for (const doc of profileDocs) {
    const p = doc.toJSON() as { id: string; full_name?: string; email?: string };
    const name = p.full_name?.trim() || p.email?.trim() || "";
    if (name) {
      profileMap.set(p.id, name);
    }
  }

  // 6. Filtros por fazenda e ano
  const targetYear = filters.year ? Number(filters.year) : undefined;
  const targetFarmId =
    filters.farmFilterMode === "specific"
      ? filters.farmId || filters.farmIds?.[0]
      : undefined;

  const filteredMovements = movements.filter((m) => {
    if (!m.animal_id) return false;
    const animal = animalMap.get(m.animal_id);
    if (!animal) return false;

    // Filtro por fazenda do animal
    if (targetFarmId) {
      if (animal.farm_id !== targetFarmId) return false;
    }

    // Filtro por ano da movimentação de nascimento (usando event_date, date ou ano do registro)
    if (targetYear) {
      const rawDate = m.event_date || m.date || animal.born_date;
      let movYear: number | null = null;
      if (rawDate) {
        const y = parseInt(rawDate.slice(0, 4), 10);
        if (!isNaN(y)) movYear = y;
      }
      if (!movYear && m.created_at) {
        movYear = new Date(m.created_at).getFullYear();
      }
      if (movYear !== targetYear) return false;
    }

    return true;
  });

  // Ordenar conforme o filtro selecionado pelo usuário
  const sortBy = filters.birthForecastSortBy || "rgn";
  filteredMovements.sort((a, b) => {
    const animalA = animalMap.get(a.animal_id);
    const animalB = animalMap.get(b.animal_id);
    if (sortBy === "farm") {
      const farmA = farmMap.get(animalA?.farm_id || "") || "";
      const farmB = farmMap.get(animalB?.farm_id || "") || "";
      const cmp = farmA.localeCompare(farmB, "pt-BR");
      if (cmp !== 0) return cmp;
    }
    if (sortBy === "birthDate") {
      const dateA = a.event_date || a.date || animalA?.born_date || "";
      const dateB = b.event_date || b.date || animalB?.born_date || "";
      return dateB.localeCompare(dateA); // desc
    }
    // default: sort by animal (rgn)
    const rgnA = animalA?.rgn || "";
    const rgnB = animalB?.rgn || "";
    return rgnA.localeCompare(rgnB, "pt-BR");
  });

  // Interligar cada movimentação ao registro em animals
  // Usar event_date para a data efetiva do nascimento e created_at para o momento do registro
  const reportRows: BirthReportItem[] = filteredMovements.map((m) => {
    const animal = animalMap.get(m.animal_id)!;
    const animalName = `${animal.serie_rgd ? animal.serie_rgd + " " : ""}${animal.rgn}`.trim();
    const sex =
      animal.sex === "M" || animal.sex === "m"
        ? "Macho"
        : animal.sex === "F" || animal.sex === "f"
        ? "Fêmea"
        : animal.sex || "---";

    const effectiveBirthDate = m.event_date || m.date || animal.born_date;
    const birthDateFormatted = effectiveBirthDate
      ? formatDate(effectiveBirthDate)
      : "---";

    const weightVal = weightMap.get(animal.rgn);
    const weightFormatted = weightVal ? `${weightVal} kg` : "---";

    const motherFormatted = animal.mother_rgn
      ? `${animal.mother_serie_rgd ? animal.mother_serie_rgd + " " : ""}${animal.mother_rgn}`.trim()
      : "---";

    const farmName =
      farmMap.get(animal.farm_id || "") || "---";

    const regDateFormatted = m.created_at
      ? formatDate(m.created_at)
      : "---";

    const registeredBy =
      (m.created_by ? profileMap.get(m.created_by) : null) ||
      m.created_by ||
      "---";

    return {
      animal: animalName,
      sex,
      birth_date: birthDateFormatted,
      weight: weightFormatted,
      mother: motherFormatted,
      farm_name: farmName,
      registration_date: regDateFormatted,
      created_by: registeredBy,
    };
  });

  const farmLabel =
    filters.farmNames?.join(", ") ||
    filters.farmName ||
    "Todas as Fazendas";

  await generateBirthForecastPDF({
    farmName: farmLabel,
    yearFilter: targetYear ? String(targetYear) : undefined,
    reportDate: getTodayFormatted(),
    systemName: "INDI Ouro 2.0",
    data: reportRows,
  });
}

export const birthForecastDefinition: ReportDefinition = {
  id: "birth-forecast",
  title: "Nascimentos",
  description: "Relatório de nascimentos registrados a partir das movimentações",
  icon: "Baby",
  requiredFilters: [],
  allowColumnSelection: false,
  generate: generateBirthForecastReport,
};
