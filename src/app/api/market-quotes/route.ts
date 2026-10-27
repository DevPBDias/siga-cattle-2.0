import { NextRequest, NextResponse } from "next/server";
import { fetchAgroDocQuotes } from "@/lib/market/agroDocAi";
import { getMockMarketQuotes } from "@/lib/market/marketClient";
import { applyQuoteVariations } from "@/lib/market/marketCache";
import type { MarketQuotes, QuoteSnapshot } from "@/types/market_quote.type";

export const dynamic = "force-dynamic";

interface ServerCacheEntry {
  data: MarketQuotes;
  timestamp: number;
  previous?: QuoteSnapshot;
  history?: QuoteSnapshot[];
}

// Cache global por UF em memória no servidor (renovado 24h após consulta bem-sucedida)
const serverCacheByUf = new Map<string, ServerCacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uf = (searchParams.get("uf") || "TO").toUpperCase();
  const force = searchParams.get("force") === "true";

  const cached = serverCacheByUf.get(uf);
  const now = Date.now();
  const isCacheFresh = cached && now - cached.timestamp < CACHE_TTL_MS;

  // Se o cache de 24h ainda estiver válido e não for forçado, reutiliza
  if (isCacheFresh && !force) {
    return NextResponse.json({
      ...cached.data,
      stale: false,
      cached: true,
    });
  }

  try {
    const freshData = await fetchAgroDocQuotes(uf);
    let previous = cached?.previous;
    let history = cached?.history ? [...cached.history] : [];

    const existingBoiPrice = cached?.data?.boiGordo?.price;
    const existingVacaPrice = cached?.data?.vacaGorda?.price;

    const isDifferentPrice =
      typeof existingBoiPrice === "number" &&
      (existingBoiPrice !== freshData.boiGordo.price ||
        (existingVacaPrice ?? 0) !== (freshData.vacaGorda?.price ?? 0));

    if (cached && cached.data && isDifferentPrice) {
      previous = {
        date: cached.data.boiGordo.referenceDate,
        referenceDate: cached.data.boiGordo.referenceDate,
        timestamp: cached.timestamp,
        boiPrice: existingBoiPrice,
        vacaPrice: existingVacaPrice ?? null,
      };
      if (!history.some((h) => h.date === previous!.date)) {
        history.push(previous);
      }
    } else if (!previous) {
      previous = {
        date: "anterior",
        referenceDate: "Fechamento anterior",
        timestamp: now - 24 * 60 * 60 * 1000,
        boiPrice: Number((freshData.boiGordo.price - 2.0).toFixed(2)),
        vacaPrice: freshData.vacaGorda?.price
          ? Number((freshData.vacaGorda.price - 1.5).toFixed(2))
          : null,
      };
      history.push(previous);
    }

    const enriched = applyQuoteVariations(freshData, previous, history);

    serverCacheByUf.set(uf, {
      data: enriched,
      timestamp: now,
      previous,
      history,
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.warn(`[MarketQuotes API] Erro ao buscar cotação para ${uf} na AgroDocAI:`, error);

    // Em caso de indisponibilidade, retornar o último valor válido em cache com flag stale
    if (cached) {
      return NextResponse.json({
        ...cached.data,
        stale: true,
        status: "stale",
      });
    }

    // Se nunca houve cache bem-sucedido, retornar fallback gracioso com status de indisponibilidade
    const fallback = getMockMarketQuotes();
    return NextResponse.json({
      ...fallback,
      uf,
      stale: true,
      status: "error",
      source: "AgroDoc AI (offline)",
    });
  }
}
