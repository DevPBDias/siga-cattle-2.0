export interface PhysicalMarketQuotes {
  source: string;
  location: string;
  sourceDate: string;
  fetchedAt: string;
  quotes: { boiSpot: number; boi30Days: number; cowSpot: number };
}

const SOURCE_URL = "https://www.noticiasagricolas.com.br/cotacoes/boi-gordo";

function cleanText(html: string) {
  return html.replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ").trim();
}

function normalize(text: string) {
  return cleanText(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function parsePrice(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const price = Number(normalized);
  if (!Number.isFinite(price)) throw new Error(`Preço inválido: ${value}`);
  return price;
}

export async function getPhysicalMarketQuotes(): Promise<PhysicalMarketQuotes> {
  const response = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "INDIOuro/1.0 (market quote reader)" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Notícias Agrícolas respondeu HTTP ${response.status}`);

  const html = await response.text();
  const tables = html.match(/<table\b[^>]*class=["'][^"']*\bcot-fisicas\b[^"']*["'][^>]*>[\s\S]*?<\/table>/gi) ?? [];
  const table = tables.find((candidate) => {
    const headers = [...candidate.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((match) => normalize(match[1]));
    return headers.some((text) => text.includes("boi gordo") && text.includes("a vista"))
      && headers.some((text) => text.includes("boi gordo") && text.includes("30 dias"))
      && headers.some((text) => text.includes("vaca gorda") && text.includes("a vista"));
  });
  if (!table) throw new Error("Tabela física de boi e vaca não encontrada na página.");

  const headers = [...table.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((match) => normalize(match[1]));
  const columns = {
    boiSpot: headers.findIndex((text) => text.includes("boi gordo") && text.includes("a vista")),
    boi30Days: headers.findIndex((text) => text.includes("boi gordo") && text.includes("30 dias")),
    cowSpot: headers.findIndex((text) => text.includes("vaca gorda") && text.includes("a vista")),
  };
  const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const target = rows.map((row) => [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => cleanText(cell[1])))
    .find((cells) => normalize(cells[0] ?? "") === "to sul");
  if (!target) throw new Error("Município TO Sul não encontrado na tabela.");

  const tableEnd = html.indexOf(table) + table.length;
  const nextSection = html.indexOf('<div class="cotacao', tableEnd);
  const sectionTail = html.slice(tableEnd, nextSection < 0 ? tableEnd + 12_000 : nextSection);
  const dateMatch = sectionTail.match(/Atualizado\s*em\s*:?\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  if (!dateMatch) throw new Error("Data de atualização da cotação não encontrada.");

  return {
    source: "Scot Consultoria via Notícias Agrícolas",
    location: "TO Sul",
    sourceDate: `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`,
    fetchedAt: new Date().toISOString(),
    quotes: {
      boiSpot: parsePrice(target[columns.boiSpot]),
      boi30Days: parsePrice(target[columns.boi30Days]),
      cowSpot: parsePrice(target[columns.cowSpot]),
    },
  };
}
