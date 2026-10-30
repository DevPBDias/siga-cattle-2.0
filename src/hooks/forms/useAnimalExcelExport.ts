"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useAnimals } from "@/hooks/db/animals/useAnimals";
import { useFarms } from "@/hooks/db/farms/useFarms";
import { useStatuses } from "@/hooks/db/statuses/useStatuses";
import { saveBlobAsFile } from "@/utils/saveBlobFile";
import { flattenAnimalsForExport } from "@/lib/excel/flattenAnimalsForExport";
import { todayISO } from "@/utils/dates";
import { getTenantBranding } from "@/lib/branding/get-tenant-branding";

export type ActivityFilter = "ATIVO" | "INATIVO" | "Ambos";
export type ExportMethod = "share" | "save-picker" | "download";

export function useAnimalExcelExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [exportedFileName, setExportedFileName] = useState("");
  const [successMethod, setSuccessMethod] = useState<ExportMethod>("download");
  const [filterState, setFilterState] = useState<ActivityFilter>("ATIVO");

  const { data: rawData = [] } = useAnimals();
  const { data: farms = [] } = useFarms();
  const { data: statuses = [] } = useStatuses();

  const filteredData = useMemo(() => {
    if (filterState === "Ambos") return rawData;
    return rawData.filter((a) => a.animal_state === filterState);
  }, [rawData, filterState]);

  const farmMap = useMemo(
    () =>
      farms.reduce(
        (acc, farm) => {
          acc[farm.id] = farm.farm_name;
          return acc;
        },
        {} as Record<string, string>,
      ),
    [farms],
  );

  const statusMap = useMemo(
    () =>
      statuses.reduce(
        (acc, status) => {
          acc[status.id] = status.status_name;
          return acc;
        },
        {} as Record<string, string>,
      ),
    [statuses],
  );

  const handleExportFile = async () => {
    if (filteredData.length === 0) {
      toast.error("Não há dados para exportar.");
      return;
    }

    setIsExporting(true);
    try {
      const branding = getTenantBranding();
      const flattenedData = flattenAnimalsForExport(filteredData, farmMap, statusMap);
      const worksheet = XLSX.utils.json_to_sheet(flattenedData);
      const workbook = XLSX.utils.book_new();

      // Metadados do documento XLSX personalizados por cliente
      workbook.Props = {
        Title: `Exportação de Animais - ${branding.farmName}`,
        Subject: "Relatório de Animais",
        Author: `Siga Cattle - ${branding.farmName}`,
        Company: branding.farmName,
        CreatedDate: new Date(),
      };

      XLSX.utils.book_append_sheet(workbook, worksheet, "Animais");

      const range = XLSX.utils.decode_range(worksheet["!ref"]!);
      worksheet["!autofilter"] = { ref: XLSX.utils.encode_range(range) };
      worksheet["!cols"] = Object.keys(flattenedData[0]).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...flattenedData.map((row) => String(row[key] || "").length),
        );
        return { wch: maxLength + 2 };
      });

      const fileName = `Exportacao_${branding.tenant.id}_${todayISO().replaceAll("-", "")}.xlsx`;
      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const result = await saveBlobAsFile(blob, fileName, {
        forceDownload: true,
        shareTitle: `Planilha de Animais - ${branding.farmName}`,
        shareText: `Planilha com ${filteredData.length} animais - Siga Cattle (${branding.farmName})`,
      });

      if (result.success) {
        setExportedFileName(fileName);
        setShowSuccessModal(true);
        setSuccessMethod(result.method);
      }
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar arquivo.");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    data: {
      filteredCount: filteredData.length,
      exportedFileName,
      successMethod,
    },
    loading: isExporting,
    error: null,
    actions: {
      filterState,
      setFilterState,
      showSuccessModal,
      handleExportFile,
      closeSuccess: () => {
        setShowSuccessModal(false);
        setExportedFileName("");
      },
    },
  };
}
