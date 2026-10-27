"use client";

import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getSupabase } from "@/lib/supabase/client";
import { AgendaReminder } from "@/types/agenda_reminder.type";

export function useCreateAgendaReminder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createAgendaReminder = useCallback(
    async (
      reminder: Pick<AgendaReminder, "type" | "scheduled_date"> &
        Partial<Pick<AgendaReminder, "rgn" | "notes">>,
    ): Promise<AgendaReminder> => {
      setLoading(true);
      setError(null);
      const now = Date.now();
      const document = {
        id: uuidv4(),
        type: reminder.type,
        scheduled_date: reminder.scheduled_date,
        created_at: now,
        updated_at: now,
        _deleted: false,
      };

      try {
        const { data, error: insertError } = await getSupabase()
          .from("agenda_reminders")
          .insert(document)
          .select()
          .single();
        if (insertError) throw insertError;
        return data as AgendaReminder;
      } catch (cause) {
        const nextError =
          cause instanceof Error ? cause : new Error("Falha ao salvar lembrete");
        setError(nextError);
        throw nextError;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { loading, error, actions: { createAgendaReminder } };
}
