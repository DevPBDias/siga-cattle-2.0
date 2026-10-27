"use client";

import { CommercialDashboard } from "@/components/features/commercial/commercial";
import ShortHeader from "@/components/layout/ShortHeader";

export default function ComercialPage() {
  return (
    <main className="h-[100dvh] min-h-[100dvh] overflow-hidden bg-background pb-12 flex flex-col">
      <ShortHeader title="Gestão Comercial" />
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 pb-8">
        <CommercialDashboard />
      </div>
    </main>
  );
}
