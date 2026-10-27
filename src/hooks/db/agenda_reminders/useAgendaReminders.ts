"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { AgendaReminder } from "@/types/agenda_reminder.type";

export function useAgendaReminders() {
  const [data, setData] = useState<AgendaReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data: reminders, error: queryError } = await getSupabase()
      .from("agenda_reminders")
      .select("*")
      .eq("_deleted", false)
      .order("scheduled_date", { ascending: true });

    if (queryError) {
      setError(new Error(queryError.message));
      setData([]);
    } else {
      setData((reminders ?? []) as AgendaReminder[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refetch();

    const channel = getSupabase()
      .channel(`agenda-reminders-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agenda_reminders" },
        () => void refetch(),
      )
      .subscribe();

    return () => {
      void getSupabase().removeChannel(channel);
    };
  }, [refetch]);

  return { data, loading, error, actions: { refetch } };
}
