"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DateOnly, compareDates, todayISO } from "@/utils/dates";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useVaccines } from "@/hooks/db/vaccines/useVaccines";
import { useAllAnimalVaccines } from "@/hooks/db/animal_vaccines/useAllAnimalVaccines";
import { useReproductionEvents } from "@/hooks/db/reproduction_event/useReproductionEvents";
import { useMovements } from "@/hooks/db/movements/useMovements";
import { useAgendaReminders } from "@/hooks/db/agenda_reminders/useAgendaReminders";
import { buildHerdAgenda, buildMonthCells } from "@/lib/agenda/buildHerdAgenda";
import {
  AgendaItem,
  AgendaStatusFilter,
  AgendaTypeFilter,
} from "@/types/agenda.type";

function startOfVisibleMonth() {
  const today = DateOnly.today();
  return DateOnly.fromParts(today.year, today.month, 1);
}

export function useHerdAgenda() {
  const today = todayISO();
  const [visibleMonth, setVisibleMonth] = useState(startOfVisibleMonth);
  const [statusFilter, setStatusFilter] = useState<AgendaStatusFilter>("todos");
  const [typeFilter, setTypeFilter] = useState<AgendaTypeFilter>("todos");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");

  const { data: animals = [], loading: animalsLoading } = useAnimals();
  const { data: vaccines = [], loading: vaccinesLoading } = useVaccines();
  const { data: animalVaccines = [], loading: vaccinesRecordsLoading } = useAllAnimalVaccines();
  const { data: reproductionEvents = [], loading: reproductionLoading } = useReproductionEvents();
  const { data: movements = [], loading: movementsLoading } = useMovements();
  const { data: reminders = [], loading: remindersLoading } = useAgendaReminders();

  const allItems = useMemo(
    () =>
      buildHerdAgenda({
        animals,
        vaccines,
        animalVaccines,
        reproductionEvents,
        movements,
        reminders,
      }),
    [animals, vaccines, animalVaccines, reproductionEvents, movements, reminders],
  );

  const monthPrefix = `${visibleMonth.year}-${String(visibleMonth.month).padStart(2, "0")}`;

  const monthItems = useMemo(() => {
    return allItems.filter((item) => {
      if (!item.date.startsWith(monthPrefix)) return false;
      if (typeFilter !== "todos" && item.type !== typeFilter) return false;
      if (statusFilter === "proximos") return compareDates(item.date, today) >= 0;
      if (statusFilter === "realizados") return compareDates(item.date, today) < 0;
      return true;
    });
  }, [allItems, monthPrefix, statusFilter, today, typeFilter]);

  const cells = useMemo(
    () => buildMonthCells(visibleMonth.year, visibleMonth.month, today, monthItems),
    [monthItems, today, visibleMonth.month, visibleMonth.year],
  );

  const selectedDayItems = useMemo(
    () =>
      selectedDate
        ? monthItems.filter((item) => item.date === selectedDate)
        : ([] as AgendaItem[]),
    [monthItems, selectedDate],
  );

  const rgnOptions = useMemo(
    () =>
      animals
        .map((animal) => ({ label: animal.rgn || "", value: animal.rgn || "" }))
        .filter((option) => option.value),
    [animals],
  );

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(Notification.permission);
  }, []);

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Este navegador não oferece notificações.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") toast.success("Notificações ativadas.");
  };

  return {
    data: {
      cells,
      monthItems,
      selectedDayItems,
      selectedDate,
      scheduleDate,
      monthLabel: `${visibleMonth.month}/${visibleMonth.year}`,
      visibleMonth,
      today,
      rgnOptions,
    },
    loading:
      animalsLoading ||
      vaccinesLoading ||
      vaccinesRecordsLoading ||
      reproductionLoading ||
      movementsLoading ||
      remindersLoading,
    error: null,
    actions: {
      statusFilter,
      setStatusFilter,
      typeFilter,
      setTypeFilter,
      scheduleOpen,
      setScheduleOpen: (open: boolean) => {
        setScheduleOpen(open);
        if (!open) setScheduleDate(null);
      },
      notificationPermission,
      requestNotifications,
      goToday: () => setVisibleMonth(startOfVisibleMonth()),
      prevMonth: () => setVisibleMonth((current) => current.addMonths(-1)),
      nextMonth: () => setVisibleMonth((current) => current.addMonths(1)),
      openDay: (iso: string) => setSelectedDate(iso),
      closeDay: () => setSelectedDate(null),
      openSchedule: () => {
        setScheduleDate(selectedDate || today);
        setScheduleOpen(true);
      },
      scheduleForSelectedDay: () => {
        setScheduleDate(selectedDate || today);
        setSelectedDate(null);
        setScheduleOpen(true);
      },
    },
  };
}
