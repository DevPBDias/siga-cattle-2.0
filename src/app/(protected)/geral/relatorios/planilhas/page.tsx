"use client";

import ShortHeader from "@/components/layout/ShortHeader";
import { ExcelExportPanel } from "@/components/features/reports/ExcelExportPanel";

export default function ExcelExportPage() {
  return (
    <div className="min-h-screen bg-background pb-12">
      <ShortHeader title="Relatório - planilha" />
      <main className="mx-auto max-w-md px-6 py-8">
        <ExcelExportPanel />
      </main>
    </div>
  );
}
