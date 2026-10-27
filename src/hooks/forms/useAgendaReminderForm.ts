"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { todayISO } from "@/utils/dates";
import { useCreateAgendaReminder } from "@/hooks/db/agenda_reminders/useCreateAgendaReminder";
import { AgendaReminderType } from "@/types/agenda_reminder.type";

export function useAgendaReminderForm(defaultDate?: string | null) {
  const { actions: { createAgendaReminder }, loading } = useCreateAgendaReminder();
  const [type, setType] = useState<AgendaReminderType>("vacinacao");
  const [date, setDate] = useState(defaultDate || todayISO());
  const [rgn, setRgn] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (defaultDate) setDate(defaultDate);
  }, [defaultDate]);

  const reset = (nextDate?: string) => {
    setType("vacinacao");
    setDate(nextDate || todayISO());
    setRgn("");
    setNotes("");
  };

  const submit = async () => {
    if (!type || !date) {
      toast.error("Preencha o tipo e a data do agendamento.");
      return false;
    }
    try {
      await createAgendaReminder({
        type,
        scheduled_date: date,
        rgn: rgn.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Lembrete salvo na agenda.");
      reset();
      return true;
    } catch (error) {
      console.error("Erro ao salvar lembrete:", error);
      toast.error("Sem conexão ou falha ao salvar. Lembretes só avisam com internet.");
      return false;
    }
  };

  return {
    data: { type, date, rgn, notes },
    loading,
    error: null,
    actions: { setType, setDate, setRgn, setNotes, reset, submit },
  };
}
