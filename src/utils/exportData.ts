import * as XLSX from "xlsx";
import { Animal } from "@/types/animal.type";
import { getTenantBranding } from "@/lib/branding/get-tenant-branding";

export function exportToExcel(
  dados: Animal[],
  filename?: string
) {
  const branding = getTenantBranding();
  const targetFilename = filename || `animais_${branding.tenant.id}.xlsx`;
  const exportData = dados.map((item, index) => ({
    ID: index + 1,
    RGN: item.rgn || "",
    "Série/RGD": item.serie_rgd || "",
    Nome: item.name || "",
    Sexo: item.sex || "",
    Nascimento: item.born_date || "",
    "Cor Nascimento": item.born_color || "",
    iABCZg: item.iabcgz || "",
    DECA: item.deca || "",
    "P %": item.p || "",
    "F %": item.f || "",
    "Nome do Pai": item.father_name || "",
    "Série/RGD da Mãe": item.mother_serie_rgd || "",
    "RGN da Mãe": item.mother_rgn || "",
    "Avô Materno": item.maternal_grandfather_name || "",
    "Avô Paterno": item.paternal_grandfather_name || "",
    Status: item.status || "",
    "Farm ID": item.farm_id || "",
    Classe: item.classification || "",
    Tipo: item.type || "",
    Genotipagem: item.genotyping || "",
    Condição: item.condition || "",
    "Última Atualização": item.updated_at || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  const columnWidths = [
    { wch: 5 }, // ID
    { wch: 15 }, // RGN
    { wch: 15 }, // Série/RGD
    { wch: 20 }, // Nome
    { wch: 8 }, // Sexo
    { wch: 12 }, // Nascimento
    { wch: 12 }, // Cor Nascimento
    { wch: 10 }, // iABCZg
    { wch: 10 }, // DECA
    { wch: 8 }, // P %
    { wch: 8 }, // F %
    { wch: 20 }, // Nome do Pai
    { wch: 15 }, // Série/RGD da Mãe
    { wch: 15 }, // RGN da Mãe
    { wch: 20 }, // Avô Materno
    { wch: 20 }, // Avô Paterno
    { wch: 12 }, // Status
    { wch: 10 }, // Farm ID
    { wch: 10 }, // Classe
    { wch: 15 }, // Tipo
    { wch: 12 }, // Genotipagem
    { wch: 12 }, // Condição
    { wch: 20 }, // Última Atualização
  ];

  worksheet["!cols"] = columnWidths;

  const workbook = XLSX.utils.book_new();
  workbook.Props = {
    Title: `Exportação de Animais - ${branding.farmName}`,
    Author: `Siga Cattle - ${branding.farmName}`,
    Company: branding.farmName,
  };
  XLSX.utils.book_append_sheet(workbook, worksheet, "Animais");

  XLSX.writeFile(workbook, targetFilename);
}
