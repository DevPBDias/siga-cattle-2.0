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
  names: Map<string, string>,
  identifiers: Map<string, string>,
) {
  return identifiers.get(rgn) || names.get(rgn) || rgn;
}

export function buildHerdAgenda(input: {
  animals: Animal[];
  vaccines: Vaccine[];
  animalVaccines: AnimalVaccine[];
  reproductionEvents: ReproductionEvent[];
  movements: Movement[];
  reminders: AgendaReminder[];
}): AgendaItem[] {
  const names = new Map(input.animals.map((a) => [a.rgn, a.name || a.rgn]));
  const identifiers = new Map(
    input.animals.map((a) => [a.rgn, `${a.serie_rgd || "INDI"} ${a.rgn}`]),
  );
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
        rgn ? `Animal ${animalLabel(rgn, names, identifiers)}` : "Rebanho",
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
      subtitle: `Animal ${animalLabel(record.rgn, names, identifiers)}`,
      rgn: record.rgn,
      source: "vaccine",
    });
  });

  input.reproductionEvents.forEach((event) => {
    const animal = animalLabel(event.rgn, names, identifiers);
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
      subtitle: `Animal ${animalLabel(rgn, names, identifiers)}`,
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
