"use client";

import ShortHeader from "@/components/layout/ShortHeader";
import { MovementList } from "@/components/features/commercial/movements/MovementList";

export default function MovimentacoesPage() {
  return (
    <div className="flex h-dvh min-h-screen flex-col overflow-hidden bg-background pb-12">
      <ShortHeader title="Movimentações" />

      <main className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto px-3 py-3">
        <h2 className="mb-3 text-base font-bold uppercase text-primary tracking-tight">
          Histórico
        </h2>
        <MovementList />
      </main>
    </div>
  );
}
