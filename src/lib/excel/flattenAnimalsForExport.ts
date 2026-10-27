import { Animal } from "@/types/animal.type";

export type AnimalExportRow = Record<string, string | number>;

export function flattenAnimalsForExport(
  animals: Animal[],
  farmMap: Record<string, string>,
  statusMap: Record<string, string>,
): AnimalExportRow[] {
  return animals.map((item) => {
    const farmName = item.farm_id ? farmMap[item.farm_id] || item.farm_id : "-";

    let statusName = "-";
    const legacyStatus = item.status as string | { status_name?: string } | undefined;
    if (typeof legacyStatus === "string") {
      statusName = statusMap[legacyStatus] || legacyStatus;
    } else if (legacyStatus && typeof legacyStatus === "object" && legacyStatus.status_name) {
      statusName = legacyStatus.status_name;
    }

    return {
      RGN: item.rgn || "-",
      "Nome Animal": item.name || "-",
      Sexo: item.sex || "-",
      Nascimento: item.born_date || "-",
      "Série/RGD": item.serie_rgd || "-",
      iABCZg: item.iabcgz || "-",
      DECA: item.deca || "-",
      P: item.p || "-",
      F: item.f || "-",
      Status: statusName,
      "Situação Doc.": item.document_situation || "-",
      Fazenda: farmName,
      "Cor ao Nascer": item.born_color || "-",
      Pai: item.father_name || "-",
      "Mãe Série/RGD": item.mother_rgn
        ? `${item.mother_serie_rgd ?? ""}-${item.mother_rgn}`
        : "-",
      "Avô Materno": item.maternal_grandfather_name || "-",
      "Avô Paterno": item.paternal_grandfather_name || "-",
      Parceria: item.partnership || "-",
      Genotipagem: item.genotyping || "-",
      Condição: item.condition || "-",
      Tipo: item.type || "-",
      "Última Atualização": item.updated_at || "-",
    };
  });
}
