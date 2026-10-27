"use client";

import { getDatabase } from "@/db/client";
import { getSupabase } from "@/lib/supabase/client";
import { cleanSupabaseDocument } from "@/lib/supabase/auth-helper";
import { Animal } from "@/types/animal.type";
import {
  EventType,
  PregnancyOrigin,
  ReproductionEvent,
} from "@/types/reproduction_event.type";
import { DateOnly } from "@/utils/dates";
import { v4 as uuidv4 } from "uuid";

export interface BulkReproductionPayload {
  date: string;
  event_type: EventType;
  protocolName?: string;
}

export interface BulkReproductionResult {
  insertedEvents: ReproductionEvent[];
  synced: boolean;
  error?: string;
}

const DEFAULT_PROTOCOL = "Sync D10";

function calculateDServices(
  d0Date: string,
  protocolName: string = DEFAULT_PROTOCOL,
) {
  const d0 = DateOnly.fromISO(d0Date);
  const isD11 = protocolName === "Sync D11";

  return {
    d8_date: d0.addDays(isD11 ? 9 : 8).toISO(),
    d10_date: d0.addDays(isD11 ? 11 : 10).toISO(),
    d22_date: d0.addDays(isD11 ? 34 : 32).toISO(),
    d30_date: d0.addDays(isD11 ? 42 : 40).toISO(),
    d32_date: d0.addDays(isD11 ? 44 : 42).toISO(),
    natural_mating_d35_entry: d0.addDays(isD11 ? 47 : 45).toISO(),
    natural_mating_d80_exit: d0.addDays(isD11 ? 92 : 90).toISO(),
    d110_date: d0.addDays(120).toISO(),
  };
}

function calculateCalvingDates(
  origin: PregnancyOrigin,
  dates: Partial<ReproductionEvent>,
) {
  let startBase: DateOnly | undefined;
  let endBase: DateOnly | undefined;

  switch (origin) {
    case "d10":
      if (dates.d10_date) {
        startBase = DateOnly.fromISO(dates.d10_date);
        endBase = startBase;
      }
      break;

    case "resync":
      if (dates.d32_date) {
        startBase = DateOnly.fromISO(dates.d32_date);
        endBase = startBase;
      }
      break;

    case "natural_mating":
      if (dates.natural_mating_d35_entry && dates.natural_mating_d80_exit) {
        startBase = DateOnly.fromISO(dates.natural_mating_d35_entry);
        endBase = DateOnly.fromISO(dates.natural_mating_d80_exit);
      }
      break;
  }

  if (!startBase || !endBase) return {};

  const calvingStart = startBase.addDays(280);

  const calvingEnd =
    origin === "natural_mating"
      ? endBase.addDays(280)
      : endBase.addDays(315);

  return {
    calving_start_date: calvingStart.toISO(),
    calving_end_date: calvingEnd.toISO(),
  };
}

function mapToSupabaseRow(event: ReproductionEvent) {
  return cleanSupabaseDocument({
    event_id: event.event_id,
    rgn: event.rgn,
    event_type: event.event_type,
    productive_status: event.productive_status ?? null,
    age: event.age ?? null,
    evaluation_date: event.evaluation_date ?? null,
    body_score: event.body_score ?? null,
    gestational_condition: event.gestational_condition ?? null,
    ovary_size: event.ovary_size ?? null,
    ovary_structure: event.ovary_structure ?? null,
    cycle_stage: event.cycle_stage ?? null,
    protocol_name: event.protocol_name ?? null,
    d0_date: event.d0_date,
    d8_date: event.d8_date ?? null,
    d10_date: event.d10_date ?? null,
    bull_name: event.bull_name ?? null,
    d22_date: event.d22_date ?? null,
    d30_date: event.d30_date ?? null,
    diagnostic_d30: event.diagnostic_d30 ?? null,
    d32_date: event.d32_date ?? null,
    resync_bull: event.resync_bull ?? null,
    calving_start_date: event.calving_start_date ?? null,
    calving_end_date: event.calving_end_date ?? null,
    natural_mating_d35_entry: event.natural_mating_d35_entry ?? null,
    natural_mating_bull: event.natural_mating_bull ?? null,
    natural_mating_d80_exit: event.natural_mating_d80_exit ?? null,
    d110_date: event.d110_date ?? null,
    final_diagnostic: event.final_diagnostic ?? null,
    pregnancy_origin: event.pregnancy_origin ?? null,
    created_at: event.created_at,
    updated_at: event.updated_at,
    _deleted: event._deleted,
  });
}

export async function createBulkReproductionEvents(
  cows: Animal[],
  payload: BulkReproductionPayload,
): Promise<BulkReproductionResult> {
  if (cows.length === 0) {
    return {
      insertedEvents: [],
      synced: false,
      error: "Nenhuma matriz selecionada.",
    };
  }

  const db = await getDatabase();
  const now = Date.now();
  const protocolName = payload.protocolName ?? DEFAULT_PROTOCOL;
  const dServices = calculateDServices(payload.date, protocolName);
  const pregnancy_origin: PregnancyOrigin = "d10";
  const calvingDates = calculateCalvingDates(pregnancy_origin, {
    ...dServices,
    pregnancy_origin,
  });

  const newEvents: ReproductionEvent[] = cows.map((cow) => ({
    event_id: uuidv4(),
    rgn: cow.rgn,
    event_type: payload.event_type,
    protocol_name: protocolName,
    d0_date: payload.date,
    pregnancy_origin,
    ...dServices,
    ...calvingDates,
    _deleted: false,
    created_at: now,
    updated_at: now,
  }));

  try {
    await db.reproduction_events.bulkInsert(newEvents as any);
  } catch (error) {
    return {
      insertedEvents: [],
      synced: false,
      error:
        error instanceof Error
          ? error.message
          : "Falha ao salvar eventos no banco local.",
    };
  }

  const supabaseRows = newEvents.map(mapToSupabaseRow);
  const supabase = getSupabase();
  const { error } = await supabase
    .from("reproduction_events")
    .insert(supabaseRows);

  if (error) {
    return {
      insertedEvents: newEvents,
      synced: false,
      error: error.message,
    };
  }

  return {
    insertedEvents: newEvents,
    synced: true,
  };
}

export async function syncReproductionEventsByIds(
  eventIds: string[],
): Promise<BulkReproductionResult> {
  if (eventIds.length === 0) {
    return {
      insertedEvents: [],
      synced: true,
    };
  }

  const db = await getDatabase();
  const docs = await Promise.all(
    eventIds.map((eventId) => db.reproduction_events.findOne(eventId).exec()),
  );

  const events = docs
    .filter((doc): doc is any => !!doc)
    .map((doc) => doc.toJSON() as ReproductionEvent)
    .filter((event) => event._deleted === false);

  if (events.length === 0) {
    return {
      insertedEvents: [],
      synced: true,
    };
  }

  const supabaseRows = events.map(mapToSupabaseRow);
  const supabase = getSupabase();
  const { error } = await supabase
    .from("reproduction_events")
    .insert(supabaseRows);

  if (error) {
    return {
      insertedEvents: events,
      synced: false,
      error: error.message,
    };
  }

  return {
    insertedEvents: events,
    synced: true,
  };
}
