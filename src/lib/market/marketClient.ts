import type { MarketQuotes } from "@/types/market_quote.type";
import {
  getTodayKey,
  isMarketCacheFresh,
  readMarketCache,
  saveMarketQuotesWithSnapshot,
  writeMarketCache,
} from "./marketCache";

export interface EnsureQuotesResult {
  data: MarketQuotes | null;
  stale: boolean;
  error?: Error;
}

function getFormattedToday(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getMockMarketQuotes(): MarketQuotes {
  const today = getFormattedToday();
  return {
    boiGordo: {
      referenceDate: today,
      price: 357.0,
      daily: {
        absolute: 2.0,
        percent: 0.56,
      },
      previousPrice: 355.0,
    },
    vacaGorda: {
      referenceDate: today,
      price: 321.13,
      daily: {
        absolute: -1.5,
        percent: -0.46,
      },
      previousPrice: 322.63,
    },
    source: "AgroDoc AI · Scot (TO)",
    updatedAt: new Date().toISOString(),
    uf: "TO",
    stale: false,
    status: "ok",
  };
}

/**
 * Garante que a cotação do dia para a UF solicitada esteja disponível.
 * - Reutiliza cache diário (24 horas) se válido;
 * - Consulta a rota proxy interna do Next caso o cache tenha expirado;
 * - Em caso de falha de rede/API, faz fallback suave para o último cache válido com 'stale: true'.
 */
export async function ensureTodayQuotes(
  uf = "TO",
  force = false,
): Promise<EnsureQuotesResult> {
  const ufUpper = uf.toUpperCase();
  const cached = readMarketCache(ufUpper);

  // 1. Reutilizar cache se válido e não forçado
  if (!force && isMarketCacheFresh(cached)) {
    return {
      data: cached!.data,
      stale: false,
    };
  }

  // 2. Buscar da rota interna proxy Next.js
  try {
    const url = `/api/market-quotes?uf=${encodeURIComponent(ufUpper)}${force ? "&force=true" : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`Proxy respondeu com status ${response.status}`);
    }

    const json = (await response.json()) as MarketQuotes;

    // Salvar no cache local enriquecido com variações em relação ao dado antigo
    const saved = saveMarketQuotesWithSnapshot(json, ufUpper);

    return {
      data: saved.data,
      stale: Boolean(saved.data.stale),
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.warn(`[MarketClient] Falha ao consultar cotações para ${ufUpper}:`, err);

    // Fallback para último cache existente
    if (cached && cached.data) {
      return {
        data: {
          ...cached.data,
          stale: true,
        },
        stale: true,
        error: err,
      };
    }

    // Fallback de emergência com mock seguro
    const mock = getMockMarketQuotes();
    return {
      data: {
        ...mock,
        stale: true,
        status: "error",
      },
      stale: true,
      error: err,
    };
  }
}
