"use client";

import { Bell, CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useHerdAgenda } from "@/hooks/forms/useHerdAgenda";
import { AgendaMonthNav } from "@/components/features/agenda/manage/AgendaMonthNav";
import { AgendaFilters } from "@/components/features/agenda/manage/AgendaFilters";
import { AgendaMonthGrid } from "@/components/features/agenda/manage/AgendaMonthGrid";
import { AgendaLegend } from "@/components/features/agenda/details/AgendaLegend";
import { AgendaMonthList } from "@/components/features/agenda/lists/AgendaMonthList";
import { AgendaDaySheet } from "@/components/features/agenda/details/AgendaDaySheet";
import { AgendaReminderForm } from "@/components/features/agenda/form/AgendaReminderForm";

export function AgendaWorkspace() {
  const { data, loading, actions } = useHerdAgenda();

  return (
    <>
      <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-4">
        <AgendaMonthNav
          month={data.visibleMonth}
          onPrev={actions.prevMonth}
          onNext={actions.nextMonth}
          onToday={actions.goToday}
        />
        <AgendaFilters
          status={actions.statusFilter}
          type={actions.typeFilter}
          onStatusChange={actions.setStatusFilter}
          onTypeChange={actions.setTypeFilter}
        />
        <AgendaLegend />
        {loading ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs font-semibold">Carregando agenda...</span>
          </div>
        ) : (
          <AgendaMonthGrid
            cells={data.cells}
            selectedDate={data.selectedDate}
            onSelectDay={actions.openDay}
          />
        )}
        <Button type="button" className="w-full" onClick={actions.openSchedule}>
          <CalendarDays /> Agendar lembrete
        </Button>
        {actions.notificationPermission !== "granted" &&
          actions.notificationPermission !== "unsupported" && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-primary"
              onClick={actions.requestNotifications}
            >
              <Bell /> Ativar notificações neste aparelho
            </Button>
          )}
        {actions.notificationPermission === "granted" && (
          <p className="text-center text-xs font-semibold text-field-green">
            Notificações de lembrete ativas
          </p>
        )}
      </section>

      {!loading && <AgendaMonthList items={data.monthItems} />}

      <AgendaDaySheet
        date={data.selectedDate}
        items={data.selectedDayItems}
        onClose={actions.closeDay}
        onSchedule={actions.scheduleForSelectedDay}
      />

      <Dialog open={actions.scheduleOpen} onOpenChange={actions.setScheduleOpen}>
        <DialogContent className="max-w-sm bg-card rounded-2xl border border-border/60">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-primary tracking-tight">
              Agendar lembrete
            </DialogTitle>
          </DialogHeader>
          <AgendaReminderForm
            defaultDate={data.scheduleDate || data.today}
            rgnOptions={data.rgnOptions}
            onCancel={() => actions.setScheduleOpen(false)}
            onSaved={() => actions.setScheduleOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
