"use client";

import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExcelExportSuccessModal } from "@/components/features/reports/ExcelExportSuccessModal";
import { useAnimalExcelExport, ActivityFilter } from "@/hooks/forms/useAnimalExcelExport";
import { getDeviceHomeRoute } from "@/hooks/use-mobile";

const FILTERS: ActivityFilter[] = ["ATIVO", "INATIVO", "Ambos"];

export function ExcelExportPanel() {
  const router = useRouter();
  const { data, loading, actions } = useAnimalExcelExport();

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-4">
          <label className="text-xs font-bold uppercase text-primary">
            Filtro de Atividade:
          </label>
          <div className="flex gap-2">
            {FILTERS.map((state) => (
              <Button
                key={state}
                onClick={() => actions.setFilterState(state)}
                variant={actions.filterState === state ? "default" : "outline"}
                className="flex-1"
              >
                {state}
              </Button>
            ))}
          </div>

          <div className="rounded-md bg-muted px-4 py-3 mt-4">
            <p className="text-sm italic text-muted-foreground">
              Os dados serão exportados em formato Excel (.xlsx) com os registros
              selecionados no filtro acima.
            </p>
          </div>

          <div className="space-y-2 rounded-md border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">Formato:</span>
              <span className="text-muted-foreground">Excel (.xlsx)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-foreground">Registros:</span>
              <span className="text-muted-foreground">{data.filteredCount}</span>
            </div>
          </div>
        </div>

        <Button
          onClick={actions.handleExportFile}
          disabled={data.filteredCount === 0 || loading}
          className="w-full"
        >
          {loading ? "Exportando..." : "Exportar arquivo"}
        </Button>
      </div>

      <ExcelExportSuccessModal
        open={actions.showSuccessModal}
        fileName={data.exportedFileName}
        method={data.successMethod}
        onClose={actions.closeSuccess}
        onGoHome={() => router.push(getDeviceHomeRoute())}
      />
    </>
  );
}
