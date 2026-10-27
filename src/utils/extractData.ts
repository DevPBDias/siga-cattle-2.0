import * as XLSX from "xlsx";
import { Animal } from "@/types/animal.type";
import { parseImportedDate } from "@/utils/dates";

function convertDateToISO(dateValue: unknown): string | undefined {
  return parseImportedDate(dateValue);
}

function cleanStringValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  return s === "" ? undefined : s;
}

function findBlockStart(headers: string[], blockName: string): number {
  return headers.findIndex((h) => h.toUpperCase() === blockName.toUpperCase());
}

export async function extractDataFromExcel(file: File): Promise<Animal[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
        });

        if (rows.length < 8)
          throw new Error("Estrutura inesperada: poucas linhas.");

        const blockHeader = rows[5].map((h: any) => String(h || "").trim());

        const colHeader = rows[6].map((h: any) => String(h || "").trim());

        const animalStart = findBlockStart(blockHeader, "ANIMAL");
        const paiStart = findBlockStart(blockHeader, "PAI");
        const maeStart = findBlockStart(blockHeader, "MÃE");
        const avoMaternoStart = findBlockStart(blockHeader, "AVÔ MATERNO");
        const avoPaternoStart = findBlockStart(blockHeader, "AVÔ PATERNO");

        const genotypingStart = findBlockStart(colHeader, "GENOTIPADO");
        const classificationStart = findBlockStart(colHeader, "CLASSE");

        console.log("📍 Block positions:", {
          animalStart,
          paiStart,
          maeStart,
          avoMaternoStart,
          avoPaternoStart,
        });

        if (animalStart === -1) throw new Error("Bloco ANIMAL não encontrado.");

        const dataRows = rows.slice(7);

        const result = dataRows
          .map((row) => {
            if (!row || row.length === 0) return undefined;

            return {
              name: cleanStringValue(row[animalStart]),
              serie_rgd: cleanStringValue(row[animalStart + 1]),
              rgn: cleanStringValue(row[animalStart + 2]),
              sex: cleanStringValue(row[animalStart + 3]) as "M" | "F",
              born_date: convertDateToISO(row[animalStart + 4]),
              iabcgz: cleanStringValue(row[animalStart + 5]),
              deca: cleanStringValue(row[animalStart + 6]),
              p: cleanStringValue(row[animalStart + 7]),
              f: cleanStringValue(row[animalStart + 8]),
              genotyping:
                genotypingStart !== -1
                  ? cleanStringValue(row[genotypingStart])
                  : undefined,
              classification:
                classificationStart !== -1
                  ? cleanStringValue(row[classificationStart])
                  : undefined,
              father_name:
                paiStart !== -1 ? cleanStringValue(row[paiStart]) : undefined,
              mother_serie_rgd:
                maeStart !== -1
                  ? cleanStringValue(row[maeStart + 1])
                  : undefined,
              mother_rgn:
                maeStart !== -1
                  ? cleanStringValue(row[maeStart + 2])
                  : undefined,
              maternal_grandfather_name:
                avoMaternoStart !== -1
                  ? cleanStringValue(row[avoMaternoStart])
                  : undefined,
              paternal_grandfather_name:
                avoPaternoStart !== -1
                  ? cleanStringValue(row[avoPaternoStart])
                  : undefined,
              status: "-",
              farm_id: undefined,
            } as Animal;
          })
          .filter((item) => item && item.rgn) as Animal[];

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
