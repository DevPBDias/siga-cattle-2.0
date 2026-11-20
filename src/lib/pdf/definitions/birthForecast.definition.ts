import { getDatabase } from "@/db/client";
import { Animal } from "@/types/animal.type";
import { Movement } from "@/types/movement.type";
import { diffInDays, formatDate, getTodayFormatted } from "@/utils/dates";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { generateBirthForecastPDF } from "../generators/birth-forecast";
import { ReportDefinition, ReportGeneratorParams } from "./types";
import { BirthReportItem } from "../types";

async function generateBirthForecastReport({
  filters,
}: ReportGeneratorParams): Promise<void> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not initialized");

  // 1. Movimentações de nascimento não deletadas
  const movementDocs = await db.movements
    .find({
      selector: {
        type: { $eq: "nascimento" },
        _deleted: { $eq: false },
      },
    })
    .exec();
  const movements = movementDocs.map((doc) => doc.toJSON() as Movement);

  // 2. Animais
  const animalDocs = await db.animals
    .find({ selector: { _deleted: { $eq: false } } })
    .exec();
  const animals = animalDocs.map((doc) => doc.toJSON() as Animal);
  const animalMap = new Map<string, Animal>();
  for (const a of animals) {
    if (a.rgn) animalMap.set(a.rgn, a);
  }

  // 3. Fazendas
  const farmDocs = await db.farms
    .find({ selector: { _deleted: { $eq: false } } })
    .exec();
  const farmMap = new Map(
    farmDocs.map((doc) => {
      const farm = doc.toJSON() as { id: string; farm_name?: string };
      return [farm.id, farm.farm_name || "---"] as const;
    }),
  );

  // 4. Pesos ao nascer (born_metric=true)
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

  // 5. Perfis de usuários
  const profileDocs = await db.user_profiles
    .find({ selector: { _deleted: { $eq: false } } })
    .exec();
  const profileMap = new Map<string, string>();
  for (const doc of profileDocs) {
    const p = doc.toJSON() as { id: string; full_name?: string; email?: string };
    const name = p.full_name?.trim() || p.email?.trim() || "";
    if (name) profileMap.set(p.id, name);
  }

  // 6. Eventos reprodutivos das matrizes (fonte da IA D10/D11)
  const reproductionDocs = await db.reproduction_events
    .find({
      selector: { _deleted: { $eq: false } },
    })
    .exec();
  const reproductionEvents = reproductionDocs.map(
    (doc) => doc.toJSON() as ReproductionEvent,
  );
  const reproductionByMother = new Map<string, ReproductionEvent[]>();
  for (const event of reproductionEvents) {
    if (!event.rgn) continue;
    const list = reproductionByMother.get(event.rgn) || [];
    list.push(event);
    reproductionByMother.set(event.rgn, list);
  }

  // 7. Montar filtros
  const targetFarmId =
    filters.farmFilterMode === "specific"
      ? filters.farmId || filters.farmIds?.[0]
      : undefined;

  // Modo intervalo de datas tem precedência sobre ano/mês
  const hasDateRange = Boolean(filters.startDate || filters.endDate);
  const targetYear = !hasDateRange && filters.year ? Number(filters.year) : undefined;
  // Mês: startDate/endDate com mesmo mês indicam filtro por mês no modo mês/ano
  // Deixamos o filtro de data range cuidar disso nativamente

  const filteredMovements = movements.filter((m) => {
    if (!m.animal_id) return false;
    const animal = animalMap.get(m.animal_id);
    if (!animal) return false;

    // Filtro por fazenda
    if (targetFarmId && animal.farm_id !== targetFarmId) return false;

    const rawDate = m.event_date || m.date || animal.born_date;

    if (hasDateRange) {
      // Filtro por intervalo de datas (YYYY-MM-DD)
      if (!rawDate) return false;
      const dateStr = rawDate.slice(0, 10); // garante YYYY-MM-DD
      if (filters.startDate && dateStr < filters.startDate) return false;
      if (filters.endDate && dateStr > filters.endDate) return false;
    } else if (targetYear) {
      // Filtro por ano
      let movYear: number | null = null;
      if (rawDate) {
        const y = parseInt(rawDate.slice(0, 4), 10);
        if (!isNaN(y)) movYear = y;
      }
      if (!movYear && m.created_at) movYear = new Date(m.created_at).getFullYear();
      if (movYear !== targetYear) return false;
    }

    return true;
  });

  // 8. Ordenação
  const sortBy = filters.birthForecastSortBy || "birthDate";
  filteredMovements.sort((a, b) => {
    const animalA = animalMap.get(a.animal_id);
    const animalB = animalMap.get(b.animal_id);
    if (sortBy === "farm") {
      const farmA = farmMap.get(animalA?.farm_id || "") || "";
      const farmB = farmMap.get(animalB?.farm_id || "") || "";
      const cmp = farmA.localeCompare(farmB, "pt-BR");
      if (cmp !== 0) return cmp;
    }
    if (sortBy === "rgn") {
      const rgnA = animalA?.rgn || "";
      const rgnB = animalB?.rgn || "";
      return rgnA.localeCompare(rgnB, "pt-BR");
    }
    // default: birthDate asc
    const dateA = a.event_date || a.date || animalA?.born_date || "";
    const dateB = b.event_date || b.date || animalB?.born_date || "";
    const dateComparison = dateA.localeCompare(dateB);
    if (dateComparison !== 0) return dateComparison;

    return (animalA?.rgn || "").localeCompare(animalB?.rgn || "", "pt-BR", {
      numeric: true,
    });
  });

  // 9. Montar linhas do relatório
  const reportRows: BirthReportItem[] = filteredMovements.map((m) => {
    const animal = animalMap.get(m.animal_id)!;
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

    const motherEvents = animal.mother_rgn
      ? reproductionByMother.get(animal.mother_rgn) || []
      : [];
    const matchingReproduction = motherEvents
      .map((event) => ({
        event,
        iaDate: event.d11_date || event.d10_date || event.d0_date,
      }))
      .filter(({ iaDate }) => iaDate && (!effectiveBirthDate || iaDate <= effectiveBirthDate.slice(0, 10)))
      .sort((a, b) => b.iaDate.localeCompare(a.iaDate))[0];
    const iaDate = matchingReproduction?.iaDate;
    const iaDateFormatted = iaDate ? formatDate(iaDate) : "---";
    const gestationDays =
      effectiveBirthDate && iaDate
        ? String(diffInDays(effectiveBirthDate, iaDate))
        : "---";

    const weightVal = weightMap.get(animal.rgn);
    const weightFormatted = weightVal ? `${weightVal} kg` : "---";

    const colorFormatted = animal.born_color?.trim() || "---";

    const motherFormatted = animal.mother_rgn
      ? `${animal.mother_serie_rgd ? animal.mother_serie_rgd + " " : ""}${animal.mother_rgn}`.trim()
      : "---";

    const fatherFormatted =
      animal.father_name?.trim() ||
      matchingReproduction?.event.bull_name?.trim() ||
      "---";

    const farmName = farmMap.get(animal.farm_id || "") || "---";

    const regDateFormatted = m.created_at ? formatDate(m.created_at) : "---";

    const registeredBy =
      (m.created_by ? profileMap.get(m.created_by) : null) ||
      m.created_by ||
      "---";

    return {
      rgn: animal.rgn,
      birth_date: birthDateFormatted,
      ia_date: iaDateFormatted,
      gestation_days: gestationDays,
      sex,
      color: colorFormatted,
      weight: weightFormatted,
      mother: motherFormatted,
      father: fatherFormatted,
      farm_name: farmName,
      registration_date: regDateFormatted,
      created_by: registeredBy,
    };
  });

  const farmLabel =
    filters.farmNames?.join(", ") ||
    filters.farmName ||
    "Todas as Fazendas";

  // Monta label do período para o cabeçalho do PDF
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

  await generateBirthForecastPDF({
    farmName: farmLabel,
    yearFilter,
    periodLabel,
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
