import * as cheerio from "cheerio";
import type {
  ArrobaQuote,
  MarketQuotes,
  PriceVariation,
} from "@/types/market_quote.type";
import { getPhysicalMarketQuotes } from "./noticiasAgricolas";

const CEPEA_BOI_URL = "https://www.cepea.org.br/br/indicador/boi-gordo.aspx";
export const MARKET_CACHE_TAG = "market-quotes";

interface PriceRow {
  date: Date;
  label: string;
  value: number;
}

function parseBrNumber(text: string): number {
  return Number.parseFloat(text.replace(/\./g, "").replace(",", "."));
}

function parseBrDate(text: string): Date | null {
  const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
}

const variation = (current: number, base: number): PriceVariation => ({
  absolute: Number((current - base).toFixed(2)),
  percent: base === 0 ? 0 : Number((((current - base) / base) * 100).toFixed(2)),
});

async function fetchRows(): Promise<PriceRow[]> {
  const response = await fetch(CEPEA_BOI_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (INDI Ouro App)" },
    next: { revalidate: 86400, tags: [MARKET_CACHE_TAG] },
  });
  if (!response.ok) throw new Error(`CEPEA respondeu HTTP ${response.status}`);

  const $ = cheerio.load(await response.text());
  const rows: PriceRow[] = [];
  $("table tr").each((_, row) => {
    const cells = $(row).find("td").map((__, cell) => $(cell).text().trim()).get();
    if (cells.length < 2) return;
    const date = parseBrDate(cells[0]);
    const value = parseBrNumber(cells[1]);
    if (date && Number.isFinite(value)) rows.push({ date, label: cells[0], value });
  });

  if (rows.length < 2) {
    throw new Error("Tabela histórica do CEPEA não encontrada; revise o seletor da página.");
  }
  return rows.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function buildQuote(rows: PriceRow[]): ArrobaQuote {
  const [today, previous] = rows;
  const monthTarget = new Date(today.date);
  monthTarget.setUTCMonth(monthTarget.getUTCMonth() - 1);
  const monthBase = rows.find((row) => row.date <= monthTarget) ?? rows[rows.length - 1];
  return {
    referenceDate: today.label,
    price: today.value,
    daily: variation(today.value, previous.value),
    monthly: variation(today.value, monthBase.value),
  };
}

export async function getMarketQuotes(): Promise<MarketQuotes> {
  const [rows, physicalQuotes] = await Promise.all([fetchRows(), getPhysicalMarketQuotes()]);
  return {
    boiGordo: buildQuote(rows),
    vacaGorda: {
      referenceDate: physicalQuotes.sourceDate,
      price: physicalQuotes.quotes.cowSpot,
    },
    source: `Cepea · São Paulo/SP + ${physicalQuotes.source} · ${physicalQuotes.location}`,
    updatedAt: new Date().toISOString(),
  };
}
