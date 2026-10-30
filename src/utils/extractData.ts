import * as XLSX from "xlsx";
import { Animal } from "@/types/animal.type";
import { parseImportedDate } from "@/utils/dates";

/**
 * Normaliza um texto de cabeçalho removendo acentos, caracteres especiais
 * e espaços extras, convertendo para UPPERCASE.
 */
export function normalizeHeader(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9%]/g, " ") // substitui caracteres especiais por espaço (mantém %)
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/**
 * Limpa o valor de uma célula removendo espaços e tratando valores vazios ou hífens
 */
export function cleanStringValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  if (s === "" || s === "-" || s === "--" || s.toUpperCase() === "N/A") {
    return undefined;
  }
  return s;
}

/**
 * Converte data de planilha para string ISO (YYYY-MM-DD)
 */
function convertDateToISO(dateValue: unknown): string | undefined {
  return parseImportedDate(dateValue);
}

/**
 * Converte valor de sexo para "M" ou "F"
 */
function normalizeSex(value: unknown): "M" | "F" | undefined {
  const cleaned = cleanStringValue(value);
  if (!cleaned) return undefined;
  const upper = cleaned.toUpperCase();
  if (upper.startsWith("M") || upper === "MACHO") return "M";
  if (upper.startsWith("F") || upper === "FEMEA" || upper === "FÊMEA") return "F";
  return undefined;
}

/**
 * Mescla os dados de um animal da planilha com os dados já existentes no banco de dados.
 * Preserva campos existentes se o novo registro não fornecer um valor válido,
 * e atualiza os campos que possuem novos dados vindos da planilha.
 */
export function mergeAnimalData(existing: Animal, incoming: Partial<Animal>): Animal {
  const merged: Animal = { ...existing };

  // Lista de campos mapeáveis que podem ser atualizados a partir da planilha
  const updatableKeys: (keyof Animal)[] = [
    "name",
    "sex",
    "born_date",
    "serie_rgd",
    "breed",
    "iabcgz",
    "deca",
    "p",
    "f",
    "genotyping",
    "classification",
    "father_name",
    "mother_rgn",
    "mother_serie_rgd",
    "maternal_grandfather_name",
    "paternal_grandfather_name",
    "document_situation",
  ];

  for (const key of updatableKeys) {
    const newVal = incoming[key];
    // Apenas atualiza se o novo valor existir e não for string vazia
    if (newVal !== undefined && newVal !== null && newVal !== "") {
      (merged as any)[key] = newVal;
    }
  }

  merged.updated_at = Date.now();
  merged._deleted = false;

  return merged;
}

interface ColumnDescriptor {
  index: number;
  block: string;
  col: string;
  full: string;
}

/**
 * Extrai dados de animais de arquivos Excel (.xls, .xlsx)
 * buscando dinamicamente as colunas pelos seus títulos/cabeçalhos.
 * Suporta planilhas hierárquicas (com blocos como ANIMAL, PAI, MÃE) e planilhas planas.
 */
export async function extractDataFromExcel(file: File): Promise<Animal[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("O arquivo não contém planilhas válidas.");
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });

        if (rows.length < 2) {
          throw new Error("Planilha vazia ou com poucas linhas.");
        }

        // 1. Detecção da estrutura da planilha (hierárquica com blocos ou plana)
        let blockRowIndex = -1;
        let colRowIndex = -1;

        // Procura por linha de blocos (ex: ANIMAL, PAI, MÃE, AVÔ...) nas primeiras 25 linhas
        for (let r = 0; r < Math.min(25, rows.length); r++) {
          const rowNorm = (rows[r] || []).map(normalizeHeader);
          if (rowNorm.some((c) => c === "ANIMAL")) {
            blockRowIndex = r;
            colRowIndex = r + 1;
            break;
          }
        }

        // Se não encontrou linha de blocos com "ANIMAL", procura linha de cabeçalhos plana
        if (blockRowIndex === -1) {
          for (let r = 0; r < Math.min(25, rows.length); r++) {
            const rowNorm = (rows[r] || []).map(normalizeHeader);
            const hasRgn = rowNorm.some((c) => c === "RGN" || c.includes("RGN") || c === "TATUAGEM");
            const hasAux = rowNorm.some(
              (c) =>
                c.includes("SERIE") ||
                c.includes("RGD") ||
                c.includes("NOME") ||
                c.includes("SEXO")
            );

            if (hasRgn && hasAux) {
              colRowIndex = r;
              break;
            }
          }
        }

        if (colRowIndex === -1 || colRowIndex >= rows.length) {
          throw new Error(
            "Não foi possível identificar a linha de cabeçalho da planilha. Verifique se as colunas 'RGN' e 'SERIE / RGD' estão presentes."
          );
        }

        // 2. Mapeamento de colunas com propagação horizontal de blocos (forward-fill)
        const columns: ColumnDescriptor[] = [];
        let currentBlock = "";
        const blockRow = blockRowIndex !== -1 ? rows[blockRowIndex] || [] : [];
        const colRow = rows[colRowIndex] || [];
        const maxCols = Math.max(blockRow.length, colRow.length);

        for (let c = 0; c < maxCols; c++) {
          const bVal = normalizeHeader(blockRow[c]);
          if (bVal && bVal !== " ") {
            currentBlock = bVal;
          }
          const cVal = normalizeHeader(colRow[c]);
          columns.push({
            index: c,
            block: currentBlock,
            col: cVal,
            full: [currentBlock, cVal].filter(Boolean).join(" "),
          });
        }

        // Função de busca de coluna por predicado flexível
        const findColIndex = (
          predicate: (c: ColumnDescriptor) => boolean
        ): number => {
          const found = columns.find(predicate);
          return found ? found.index : -1;
        };

        // 3. Resolução das colunas por título
        // RGN (principal do animal)
        const rgnCol = findColIndex((c) =>
          blockRowIndex !== -1
            ? c.block === "ANIMAL" && (c.col === "RGN" || c.col.includes("RGN") || c.col === "TATUAGEM")
            : (c.col === "RGN" || c.col.includes("RGN") || c.col === "TATUAGEM") &&
              !c.col.includes("MAE") &&
              !c.col.includes("PAI")
        );

        if (rgnCol === -1) {
          throw new Error(
            "Coluna 'RGN' do animal não encontrada na planilha. Verifique o cabeçalho."
          );
        }

        // SÉRIE / RGD
        const serieCol = findColIndex((c) =>
          blockRowIndex !== -1
            ? c.block === "ANIMAL" && (c.col.includes("SERIE") || c.col.includes("RGD"))
            : (c.col.includes("SERIE") || c.col.includes("RGD")) &&
              !c.col.includes("MAE") &&
              !c.col.includes("PAI")
        );

        // NOME
        const nameCol = findColIndex((c) =>
          blockRowIndex !== -1
            ? c.block === "ANIMAL" && (c.col === "NOME" || c.col.includes("NOME"))
            : (c.col === "NOME" || c.col === "NOME DO ANIMAL" || c.col === "ANIMAL") &&
              !c.col.includes("PAI") &&
              !c.col.includes("MAE") &&
              !c.col.includes("AVO")
        );

        // SEXO
        const sexCol = findColIndex((c) =>
          blockRowIndex !== -1
            ? c.block === "ANIMAL" && (c.col === "SEXO" || c.col === "SEX" || c.col === "GENERO")
            : c.col === "SEXO" || c.col === "SEX" || c.col === "GENERO"
        );

        // DATA DE NASCIMENTO
        const bornDateCol = findColIndex((c) =>
          blockRowIndex !== -1
            ? c.block === "ANIMAL" && (c.col.includes("NASC") || c.col.includes("NASCIMENTO"))
            : c.col.includes("NASC") || c.col.includes("NASCIMENTO")
        );

        // iABCZg
        const iabczCol = findColIndex((c) =>
          blockRowIndex !== -1
            ? (c.block === "ANIMAL" || !c.block) && (c.col.includes("IABCZ") || c.col.includes("ABCZ"))
            : c.col.includes("IABCZ") || c.col.includes("ABCZ")
        );

        // DECA
        const decaCol = findColIndex((c) =>
          blockRowIndex !== -1
            ? (c.block === "ANIMAL" || !c.block) && c.col.includes("DECA")
            : c.col.includes("DECA")
        );

        // P % (Percentil P)
        const pCol = findColIndex((c) =>
          blockRowIndex !== -1
            ? (c.block === "ANIMAL" || !c.block) &&
              (c.col === "P %" || c.col === "P%" || c.col === "PERCENTIL P" || (c.col === "P" && c.block === "ANIMAL"))
            : c.col === "P %" || c.col === "P%" || c.col === "PERCENTIL P"
        );

        // F % (Percentil F)
        const fCol = findColIndex((c) =>
          blockRowIndex !== -1
            ? (c.block === "ANIMAL" || !c.block) &&
              (c.col === "F %" || c.col === "F%" || c.col === "PERCENTIL F" || (c.col === "F" && c.block === "ANIMAL"))
            : c.col === "F %" || c.col === "F%" || c.col === "PERCENTIL F"
        );

        // GENOTIPADO
        const genoCol = findColIndex(
          (c) =>
            c.col.includes("GENOTIP") ||
            c.block.includes("GENOTIP") ||
            c.col.includes("GENOTIPO")
        );

        // CLASSIFICAÇÃO (CLASSE / CATEGORIA - exclui CSG que é Certificado)
        const classificationCol = findColIndex(
          (c) =>
            c.col.includes("CLASSE") ||
            c.col.includes("CLASSIFIC") ||
            c.col.includes("CATEGORIA")
        );

        // PAI (NOME)
        const fatherNameCol = findColIndex((c) =>
          blockRowIndex !== -1
            ? c.block === "PAI" && (c.col === "NOME" || c.col.includes("NOME"))
            : c.col.includes("PAI") && (c.col.includes("NOME") || c.col === "PAI")
        );

        // MÃE - RGN
        const motherRgnCol = findColIndex((c) =>
          blockRowIndex !== -1
            ? c.block === "MAE" && (c.col === "RGN" || c.col.includes("RGN"))
            : c.col.includes("MAE") && (c.col.includes("RGN") || c.col.includes("REGISTRO"))
        );

        // MÃE - SÉRIE / RGD
        const motherSerieCol = findColIndex((c) =>
          blockRowIndex !== -1
            ? c.block === "MAE" && (c.col.includes("SERIE") || c.col.includes("RGD"))
            : c.col.includes("MAE") && (c.col.includes("SERIE") || c.col.includes("RGD"))
        );

        // AVÔ MATERNO (NOME)
        const maternalGrandfatherCol = findColIndex((c) =>
          blockRowIndex !== -1
            ? c.block.includes("AVO MATERNO") && (c.col === "NOME" || c.col.includes("NOME"))
            : c.col.includes("AVO MATERNO") || c.col.includes("AVÔ MATERNO")
        );

        // AVÔ PATERNO (NOME)
        const paternalGrandfatherCol = findColIndex((c) =>
          blockRowIndex !== -1
            ? c.block.includes("AVO PATERNO") && (c.col === "NOME" || c.col.includes("NOME"))
            : c.col.includes("AVO PATERNO") || c.col.includes("AVÔ PATERNO")
        );

        // RAÇA (opcional)
        const breedCol = findColIndex(
          (c) => c.col.includes("RACA") || c.col.includes("RAÇA") || c.col.includes("BREED")
        );

        // SITUAÇÃO DOCUMENTAL (opcional)
        const documentSituationCol = findColIndex(
          (c) => c.col.includes("SITUACAO") || c.col.includes("SITUAÇÃO")
        );

        console.log("📍 Mapeamento de colunas identificadas:", {
          rgnCol,
          serieCol,
          nameCol,
          sexCol,
          bornDateCol,
          iabczCol,
          decaCol,
          pCol,
          fCol,
          genoCol,
          classificationCol,
          fatherNameCol,
          motherRgnCol,
          motherSerieCol,
          maternalGrandfatherCol,
          paternalGrandfatherCol,
          breedCol,
          documentSituationCol,
        });

        // 4. Extração das linhas de dados a partir da linha seguinte ao cabeçalho
        const dataRows = rows.slice(colRowIndex + 1);

        const result: Animal[] = [];

        for (const row of dataRows) {
          if (!row || row.length === 0) continue;

          const rgn = cleanStringValue(row[rgnCol]);
          if (!rgn) continue; // Linha sem RGN é ignorada (rodapé, totalizadores, linhas em branco)

          const animalData: Partial<Animal> = {
            rgn,
            serie_rgd: serieCol !== -1 ? cleanStringValue(row[serieCol]) || "" : "",
            name: nameCol !== -1 ? cleanStringValue(row[nameCol]) : undefined,
            sex: sexCol !== -1 ? normalizeSex(row[sexCol]) : undefined,
            born_date: bornDateCol !== -1 ? convertDateToISO(row[bornDateCol]) : undefined,
            iabcgz: iabczCol !== -1 ? cleanStringValue(row[iabczCol]) : undefined,
            deca: decaCol !== -1 ? cleanStringValue(row[decaCol]) : undefined,
            p: pCol !== -1 ? cleanStringValue(row[pCol]) : undefined,
            f: fCol !== -1 ? cleanStringValue(row[fCol]) : undefined,
            genotyping: genoCol !== -1 ? cleanStringValue(row[genoCol]) : undefined,
            classification: classificationCol !== -1 ? cleanStringValue(row[classificationCol]) : undefined,
            father_name: fatherNameCol !== -1 ? cleanStringValue(row[fatherNameCol]) : undefined,
            mother_rgn: motherRgnCol !== -1 ? cleanStringValue(row[motherRgnCol]) : undefined,
            mother_serie_rgd: motherSerieCol !== -1 ? cleanStringValue(row[motherSerieCol]) : undefined,
            maternal_grandfather_name:
              maternalGrandfatherCol !== -1
                ? cleanStringValue(row[maternalGrandfatherCol])
                : undefined,
            paternal_grandfather_name:
              paternalGrandfatherCol !== -1
                ? cleanStringValue(row[paternalGrandfatherCol])
                : undefined,
            breed: breedCol !== -1 ? (cleanStringValue(row[breedCol]) as any) : undefined,
            document_situation:
              documentSituationCol !== -1
                ? cleanStringValue(row[documentSituationCol])
                : undefined,
            status: "-",
            farm_id: undefined,
          };

          result.push(animalData as Animal);
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Desmembra o campo RG (ex: "GIRO  2260", "INDI 123", "ABC/456") em Série e RGN
 */
export function parseRgField(rgStr: unknown): { serie_rgd: string; rgn: string } {
  if (rgStr === null || rgStr === undefined) return { serie_rgd: "", rgn: "" };
  const str = String(rgStr).trim();
  if (!str) return { serie_rgd: "", rgn: "" };

  // Formato com espaço: "GIRO  2260" ou "INDI 1234"
  const spaceMatch = str.match(/^([A-Za-zÀ-ÖØ-öø-ÿ\.\/\s-]+?)\s+(\d+[A-Za-z]?)$/);
  if (spaceMatch) {
    return {
      serie_rgd: spaceMatch[1].trim(),
      rgn: spaceMatch[2].trim(),
    };
  }

  // Formato com barra: "GIRO/2260"
  const slashMatch = str.match(/^([A-Za-zÀ-ÖØ-öø-ÿ\.\s-]+)\/(\d+[A-Za-z]?)$/);
  if (slashMatch) {
    return {
      serie_rgd: slashMatch[1].trim(),
      rgn: slashMatch[2].trim(),
    };
  }

  // Formato com hífen: "GIRO-2260"
  const dashMatch = str.match(/^([A-Za-zÀ-ÖØ-öø-ÿ\.\s-]+)-(\d+[A-Za-z]?)$/);
  if (dashMatch) {
    return {
      serie_rgd: dashMatch[1].trim(),
      rgn: dashMatch[2].trim(),
    };
  }

  // Se for apenas dígitos: "2260"
  if (/^\d+$/.test(str)) {
    return { serie_rgd: "", rgn: str };
  }

  return { serie_rgd: "", rgn: str };
}

/**
 * Desmembra o campo Mãe (ex: "NEL/PO GIRO  502", "GIRO 502") em série e RGN da mãe
 */
export function parseMotherField(maeStr: unknown): {
  mother_serie_rgd?: string;
  mother_rgn?: string;
} {
  if (maeStr === null || maeStr === undefined) {
    return { mother_serie_rgd: undefined, mother_rgn: undefined };
  }
  let str = String(maeStr).trim();
  if (!str || str === "-" || str === "--") {
    return { mother_serie_rgd: undefined, mother_rgn: undefined };
  }

  // Remove prefixos comuns como "NEL/PO ", "NEL/MO ", "PO ", "NEL/ "
  str = str.replace(/^[A-Za-zÀ-ÖØ-öø-ÿ]+\/[A-Za-zÀ-ÖØ-öø-ÿ]+\s+/i, "").trim();
  const parsed = parseRgField(str);

  return {
    mother_serie_rgd: parsed.serie_rgd || undefined,
    mother_rgn: parsed.rgn || undefined,
  };
}

/**
 * Extrai dados da planilha de Produtos Ativos (RelatorioProdutosAtivos da ABCZ).
 * Mapeia RG (Série e RGN), Nome, Sexo, Dt.Nasc., Pai, Mãe e Status ativo.
 */
export async function extractActiveProductsFromExcel(file: File): Promise<Animal[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("O arquivo não contém planilhas válidas.");
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });

        if (rows.length < 2) {
          throw new Error("Planilha vazia ou com poucas linhas.");
        }

        // 1. Escaneamento de metadados institucionais (Raça, Fazenda) e busca do cabeçalho
        let detectedBreed = "Nelore";
        let headerRowIdx = -1;

        for (let r = 0; r < Math.min(25, rows.length); r++) {
          const row = rows[r] || [];
          for (const cell of row) {
            if (!cell) continue;
            const str = String(cell).trim();
            // Identifica seção de Raça
            if (
              str.toUpperCase().includes("RAÇA:") ||
              str.toUpperCase().includes("RACA:")
            ) {
              const match = str.match(/RA[ÇC]A:\s*\d*\s*-?\s*([A-Za-zÀ-ÖØ-öø-ÿ\s]+)/i);
              if (match && match[1].trim()) {
                const b = match[1].trim();
                detectedBreed = b.charAt(0).toUpperCase() + b.slice(1).toLowerCase();
              }
            }
          }

          // Identifica linha de cabeçalho: deve conter 'RG' e 'NOME' e ('SEXO' ou 'DT.NASC.')
          const rowNorm = row.map(normalizeHeader);
          if (
            rowNorm.includes("RG") &&
            rowNorm.includes("NOME") &&
            (rowNorm.includes("SEXO") || rowNorm.some((h) => h.includes("NASC")))
          ) {
            headerRowIdx = r;
            break;
          }
        }

        if (headerRowIdx === -1 || headerRowIdx >= rows.length) {
          throw new Error(
            "Cabeçalho do Relatório de Produtos Ativos não encontrado. Verifique se as colunas 'RG', 'Nome' e 'Sexo' estão presentes."
          );
        }

        // 2. Mapeamento das colunas por nome
        const headers = rows[headerRowIdx].map(normalizeHeader);
        const rgCol = headers.findIndex((h) => h === "RG" || h === "R.G." || h === "REGISTRO");
        const nameCol = headers.findIndex((h) => h === "NOME" || h === "NOME DO ANIMAL");
        const sexCol = headers.findIndex((h) => h === "SEXO" || h === "SEX");
        const bornDateCol = headers.findIndex((h) => h.includes("NASC"));
        const fatherCol = headers.findIndex((h) => h === "PAI" || h.includes("NOME PAI"));
        const motherCol = headers.findIndex((h) => h.includes("MAE") || h.includes("MÃE"));
        const statusCol = headers.findIndex((h) => h.includes("STATUS") || h.includes("SITUACAO"));

        if (rgCol === -1) {
          throw new Error("Coluna 'RG' não encontrada na planilha de Produtos Ativos.");
        }

        console.log("📍 Mapeamento de colunas de Produtos Ativos:", {
          rgCol,
          nameCol,
          sexCol,
          bornDateCol,
          fatherCol,
          motherCol,
          statusCol,
          detectedBreed,
        });

        // 3. Extração das linhas de dados
        const dataRows = rows.slice(headerRowIdx + 1);
        const result: Animal[] = [];

        for (const row of dataRows) {
          if (!row || row.length === 0) continue;

          const rgRaw = cleanStringValue(row[rgCol]);
          if (!rgRaw) continue;

          const parsedRg = parseRgField(rgRaw);
          if (!parsedRg.rgn) continue;

          const motherParsed =
            motherCol !== -1 ? parseMotherField(row[motherCol]) : { mother_serie_rgd: undefined, mother_rgn: undefined };

          const statusVal = statusCol !== -1 ? cleanStringValue(row[statusCol]) : undefined;

          const animalData: Partial<Animal> = {
            rgn: parsedRg.rgn,
            serie_rgd: parsedRg.serie_rgd || "",
            name: nameCol !== -1 ? cleanStringValue(row[nameCol]) : undefined,
            sex: sexCol !== -1 ? normalizeSex(row[sexCol]) : undefined,
            born_date: bornDateCol !== -1 ? convertDateToISO(row[bornDateCol]) : undefined,
            father_name: fatherCol !== -1 ? cleanStringValue(row[fatherCol]) : undefined,
            mother_rgn: motherParsed.mother_rgn,
            mother_serie_rgd: motherParsed.mother_serie_rgd,
            document_situation: statusVal,
            status: statusVal || "-",
            animal_state: "ATIVO",
            breed: (detectedBreed as any) || "Nelore",
            farm_id: undefined,
          };

          result.push(animalData as Animal);
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}


