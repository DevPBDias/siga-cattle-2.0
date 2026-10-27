"use client";

import { useEffect } from "react";
import { useAgendaReminders } from "@/hooks/db/agenda_reminders/useAgendaReminders";
import { DateOnly, formatDate, todayISO } from "@/utils/dates";
import { REMINDER_TYPE_LABEL } from "@/lib/agenda/agenda.config";

const sentReminderKeys = new Set<string>();
const LEAD_DAYS = 7;

export default function AgendaReminderNotifier() {
  const { data: reminders = [] } = useAgendaReminders();

  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const checkReminders = () => {
      const today = DateOnly.parse(todayISO());
      if (!today) return;
      const alertDay = today.addDays(LEAD_DAYS);

      reminders.forEach((reminder) => {
        const scheduled = DateOnly.parse(reminder.scheduled_date);
        if (!scheduled || !scheduled.equals(alertDay)) return;

        const key = `agenda-reminder-${reminder.id}-${reminder.scheduled_date}`;
        if (sentReminderKeys.has(key)) return;
        sentReminderKeys.add(key);

        const title = REMINDER_TYPE_LABEL[reminder.type] || "Lembrete";
        const animal = reminder.rgn ? ` Animal ${reminder.rgn}.` : "";
        const options = {
          body: `${title} em ${formatDate(reminder.scheduled_date)}.${animal}`,
          icon: "/icon-192.png",
          tag: key,
        };

        if ("serviceWorker" in navigator) {
          void navigator.serviceWorker.ready
            .then((registration) => registration.showNotification(title, options))
            .catch(() => new Notification(title, options));
        } else {
          new Notification(title, options);
        }
      });
    };

    checkReminders();
    const interval = window.setInterval(checkReminders, 60_000);
    return () => window.clearInterval(interval);
  }, [reminders]);

  return null;
}
