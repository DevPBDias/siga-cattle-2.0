"use client";

import ShortHeader from "@/components/layout/ShortHeader";
import { AgendaWorkspace } from "@/components/features/agenda/AgendaWorkspace";

export default function CalendarPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background pb-12">
      <ShortHeader title="Agenda" />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full space-y-4 no-scrollbar">
        <AgendaWorkspace />
      </main>
    </div>
  );
}
