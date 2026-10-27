import { getSupabase } from "@/lib/supabase/client";
import { SyncLogger } from "@/lib/sync/syncLogger";
import type { RealtimeChannel } from "@supabase/supabase-js";

const TABLES = [
  "animals",
  "vaccines",
  "farms",
  "user_profiles",
  "animal_metrics_weight",
  "animal_metrics_ce",
  "animal_vaccines",
  "reproduction_events",
  "animal_statuses",
  "animal_situations",
  "semen_doses",
  "clients",
  "movements",
  "sales",
  "deaths",
  "exchanges",
  "retreats",
  "agenda_reminders",
] as const;

let activeChannel: RealtimeChannel | null = null;
const debounceTimers = new Map<string, NodeJS.Timeout>();

/** Re-pulls a collection when Supabase reports changes from another device with debouncing. */
export function setupRealtimeSync(
  replications: Record<string, { reSync?: () => Promise<unknown> | unknown }>,
): () => void {
  if (typeof window === "undefined") return () => {};

  const supabase = getSupabase();
  if (activeChannel) {
    void supabase.removeChannel(activeChannel);
    debounceTimers.forEach((timer) => clearTimeout(timer));
    debounceTimers.clear();
  }

  const requestPull = (tableName: string) => {
    const replication = replications[tableName];
    if (!replication || typeof replication.reSync !== "function") {
      SyncLogger.warn("realtime", `Replication missing for ${tableName}`);
      return;
    }

    // Debounce de 350ms por tabela para evitar tempestade de reSyncs concorrentes
    const existing = debounceTimers.get(tableName);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      debounceTimers.delete(tableName);
      try {
        void Promise.resolve(replication.reSync()).catch((error) =>
          SyncLogger.error("realtime", `reSync failed for ${tableName}`, error),
        );
      } catch (error) {
        SyncLogger.error("realtime", `reSync failed for ${tableName}`, error);
      }
    }, 350);

    debounceTimers.set(tableName, timer);
  };

  const channel = supabase.channel("indi-rxdb-remote-changes");
  for (const tableName of TABLES) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: tableName },
      () => {
        SyncLogger.info("realtime", `Remote change on ${tableName}; requesting debounced pull`);
        requestPull(tableName);
      },
    );
  }

  channel.subscribe((status, error) => {
    if (status === "SUBSCRIBED") {
      SyncLogger.info("realtime", `Subscribed to ${TABLES.length} Supabase tables`);
      // Catch up after initial subscription and after any channel reconnect.
      for (const tableName of TABLES) requestPull(tableName);
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      SyncLogger.error("realtime", `Realtime subscription ${status}`, error);
    }
  });
  activeChannel = channel;

  return () => {
    if (activeChannel === channel) {
      activeChannel = null;
      debounceTimers.forEach((timer) => clearTimeout(timer));
      debounceTimers.clear();
      void supabase.removeChannel(channel);
    }
  };
}
