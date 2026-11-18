import { Animal } from "@/types/animal.type";
import { AnimalVaccine, Vaccine } from "@/types/vaccine.type";
import { ReproductionEvent } from "@/types/reproduction_event.type";
import { Movement } from "@/types/movement.type";
import { AgendaReminder } from "@/types/agenda_reminder.type";
import { AgendaDayCell, AgendaItem } from "@/types/agenda.type";
import { DateOnly, formatDate, toISODate } from "@/utils/dates";
import { REMINDER_TYPE_LABEL } from "./agenda.config";

function animalLabel(
  rgn: string,
  animalKey: string | undefined,
  animalsByKey: Map<string, Animal>,
  animalsByRgn: Map<string, Animal[]>,
) {
  const keyedAnimal = animalKey ? animalsByKey.get(animalKey) : undefined;
  if (keyedAnimal) {
    return `${keyedAnimal.serie_rgd || "INDI"} ${keyedAnimal.rgn}`;
  }
  const matchingAnimals = animalsByRgn.get(rgn) ?? [];
  if (matchingAnimals.length === 1) {
    const animal = matchingAnimals[0];
    return `${animal.serie_rgd || "INDI"} ${animal.rgn}`;
  }
  return matchingAnimals.length > 1 ? `${rgn} (RGN duplicado)` : rgn;
}

export function buildHerdAgenda(input: {
  animals: Animal[];
  vaccines: Vaccine[];
  animalVaccines: AnimalVaccine[];
  reproductionEvents: ReproductionEvent[];
  movements: Movement[];
  reminders: AgendaReminder[];
}): AgendaItem[] {
  const animalsByKey = new Map(
    input.animals.map((animal) => [animal.animal_key || "", animal]),
  );
  const animalsByRgn = new Map<string, Animal[]>();
  input.animals.forEach((animal) => {
    const matches = animalsByRgn.get(animal.rgn) ?? [];
    matches.push(animal);
    animalsByRgn.set(animal.rgn, matches);
  });
  const vaccineNames = new Map(input.vaccines.map((v) => [v.id, v.vaccine_name]));
  const items: AgendaItem[] = [];

  input.reminders.forEach((reminder) => {
    const date = toISODate(reminder.scheduled_date);
    if (!date) return;
    const rgn = reminder.rgn?.trim();
    items.push({
      id: `reminder-${reminder.id}`,
      date,
      type: "lembrete",
      title: REMINDER_TYPE_LABEL[reminder.type] || "Lembrete",
      subtitle: [
        rgn
          ? `Animal ${animalLabel(rgn, reminder.animal_key, animalsByKey, animalsByRgn)}`
          : "Rebanho",
        reminder.notes,
      ]
        .filter(Boolean)
        .join(" · "),
      rgn,
      source: "reminder",
    });
  });

  input.animalVaccines.forEach((record) => {
    const date = toISODate(record.date);
    if (!date) return;
    items.push({
      id: `vacina-${record.id}`,
      date,
      type: "vacina",
      title: vaccineNames.get(record.vaccine_id) || "Vacina registrada",
      subtitle: `Animal ${animalLabel(record.rgn, record.animal_key, animalsByKey, animalsByRgn)}`,
      rgn: record.rgn,
      source: "vaccine",
    });
  });

  input.reproductionEvents.forEach((event) => {
    const animal = animalLabel(event.rgn, event.animal_key, animalsByKey, animalsByRgn);
    const stages = [
      { date: event.d0_date, label: "Início do protocolo (D0)", bull: event.bull_name },
      { date: event.d10_date, label: "Inseminação", bull: event.bull_name },
      { date: event.d32_date, label: "Resync / inseminação", bull: event.resync_bull || event.bull_name },
      { date: event.natural_mating_d35_entry, label: "Entrada na monta natural", bull: event.natural_mating_bull },
    ];

    stages.forEach((stage, index) => {
      const date = toISODate(stage.date);
      if (!date) return;
      items.push({
        id: `repro-${event.event_id}-${index}`,
        date,
        type: "reproducao",
        title: stage.label,
        subtitle: `Vaca: ${animal} · Touro: ${stage.bull || "Não informado"}`,
        rgn: event.rgn,
        source: "reproduction",
      });
    });

    const forecastDate = toISODate(event.calving_start_date);
    if (forecastDate) {
      const endDate = toISODate(event.calving_end_date);
      items.push({
        id: `nascimento-previsto-${event.event_id}`,
        date: forecastDate,
        type: "nascimento",
        title: "Nascimento previsto",
        subtitle: `${animal}${endDate ? ` · janela até ${formatDate(endDate)}` : ""}`,
        rgn: event.rgn,
        source: "reproduction",
      });
    }
  });

  input.movements.forEach((movement) => {
    if (movement.type !== "nascimento") return;
    const date = toISODate(movement.event_date || movement.date);
    if (!date) return;
    const rgn = movement.animal_id;
    items.push({
      id: `nascimento-${movement.id}`,
      date,
      type: "nascimento",
      title: "Nascimento registrado",
      subtitle: `Animal ${animalLabel(rgn, movement.animal_key, animalsByKey, animalsByRgn)}`,
      rgn,
      source: "birth",
    });
  });

  return items.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export function buildMonthCells(
  year: number,
  month: number,
  todayIso: string,
  monthItems: AgendaItem[],
): AgendaDayCell[] {
  const first = DateOnly.fromParts(year, month, 1);
  const startOffset = first.toDate().getDay();
  const gridStart = first.addDays(-startOffset);
  const typesByDate = new Map<string, AgendaItem["type"][]>();

  monthItems.forEach((item) => {
    const current = typesByDate.get(item.date) ?? [];
    if (!current.includes(item.type)) current.push(item.type);
    typesByDate.set(item.date, current);
  });

  return Array.from({ length: 42 }, (_, index) => {
    const cell = gridStart.addDays(index);
    const iso = cell.toISO();
    return {
      iso,
      day: cell.day,
      inMonth: cell.month === month,
      isToday: iso === todayIso,
      types: typesByDate.get(iso) ?? [],
    };
  });
}
