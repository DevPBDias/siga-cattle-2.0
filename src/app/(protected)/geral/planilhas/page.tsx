"use client";

import ShortHeader from "@/components/layout/ShortHeader";
import SearchCsvFile from "@/components/features/animals/import/SearchCsvFile";
import { DatabaseDangerZone } from "@/components/features/animals/import/DatabaseDangerZone";

export default function ImportCsvFilesPage() {
  return (
    <main className="min-h-screen bg-background pb-12">
      <ShortHeader title="Importar planilhas" />
      <SearchCsvFile />
      <DatabaseDangerZone />
    </main>
  );
}
