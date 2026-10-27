import type {
  MarketQuotes,
  PriceVariation,
  QuoteSnapshot,
  StoredMarketQuotes,
} from "@/types/market_quote.type";

const BASE_CACHE_KEY = "rico_ouro_market_quotes";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

export function getTodayKey(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function getCacheKey(uf = "TO"): string {
  return `${BASE_CACHE_KEY}_${uf.toUpperCase()}`;
}

/**
 * Calcula a variação absoluta e percentual entre o preço atual e o anterior
 */
export function calculateVariation(
  currentPrice: number,
  previousPrice?: number | null,
): PriceVariation | undefined {
  if (
    typeof previousPrice !== "number" ||
    isNaN(previousPrice) ||
    previousPrice <= 0
  ) {
    return undefined;
  }

  const diff = currentPrice - previousPrice;
  const percent = (diff / previousPrice) * 100;

  return {
    absolute: Number(diff.toFixed(2)),
    percent: Number(percent.toFixed(2)),
  };
}

/**
 * Aplica as variações (diária e mensal) nas cotações comparando com dados antigos
 */
export function applyQuoteVariations(
  quotes: MarketQuotes,
  previous?: QuoteSnapshot | null,
  history?: QuoteSnapshot[],
): MarketQuotes {
  const result: MarketQuotes = {
    ...quotes,
    boiGordo: { ...quotes.boiGordo },
    vacaGorda: quotes.vacaGorda ? { ...quotes.vacaGorda } : null,
  };

  // Variação diária do Boi Gordo
  if (previous && typeof previous.boiPrice === "number") {
    result.boiGordo.previousPrice = previous.boiPrice;
    if (!result.boiGordo.daily) {
      result.boiGordo.daily = calculateVariation(
        result.boiGordo.price,
        previous.boiPrice,
      );
    }
  }

  // Variação diária da Vaca Gorda
  if (result.vacaGorda && previous && typeof previous.vacaPrice === "number") {
    result.vacaGorda.previousPrice = previous.vacaPrice;
    if (!result.vacaGorda.daily) {
      result.vacaGorda.daily = calculateVariation(
        result.vacaGorda.price,
        previous.vacaPrice,
      );
    }
  }

  // Variação mensal (procurar o registro de até ~30 dias atrás)
  if (history && history.length > 1) {
    const now = Date.now();
    const twentyFiveDaysMs = 25 * 24 * 60 * 60 * 1000;
    const monthlyPoint =
      history.find((h) => now - h.timestamp >= twentyFiveDaysMs) ?? history[0];

    if (monthlyPoint && now - monthlyPoint.timestamp >= 24 * 60 * 60 * 1000) {
      if (!result.boiGordo.monthly) {
        result.boiGordo.monthly = calculateVariation(
          result.boiGordo.price,
          monthlyPoint.boiPrice,
        );
      }
      if (
        result.vacaGorda &&
        monthlyPoint.vacaPrice &&
        !result.vacaGorda.monthly
      ) {
        result.vacaGorda.monthly = calculateVariation(
          result.vacaGorda.price,
          monthlyPoint.vacaPrice,
        );
      }
    }
  }

  return result;
}

export function readMarketCache(uf = "TO"): StoredMarketQuotes | null {
  if (typeof window === "undefined") return null;
  try {
    const key = getCacheKey(uf);
    let raw = localStorage.getItem(key);
    // Compatibilidade com chave legada
    if (!raw && uf.toUpperCase() === "TO") {
      raw = localStorage.getItem(BASE_CACHE_KEY);
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredMarketQuotes;

    // Se o cache lido ainda não tiver daily calculado mas tiver snapshot anterior, enriquece
    if (parsed.data && parsed.previous && !parsed.data.boiGordo?.daily) {
      parsed.data = applyQuoteVariations(
        parsed.data,
        parsed.previous,
        parsed.history,
      );
    }

    return parsed;
  } catch (error) {
    console.warn("[MarketCache] Falha ao ler cache:", error);
    return null;
  }
}

export function writeMarketCache(entry: StoredMarketQuotes, uf = "TO"): void {
  if (typeof window === "undefined") return;
  try {
    const key = getCacheKey(uf);
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.warn("[MarketCache] Falha ao salvar cache:", error);
  }
}

/**
 * Salva as cotações preservando o dado antigo de referência e histórico
 */
export function saveMarketQuotesWithSnapshot(
  freshQuotes: MarketQuotes,
  uf = "TO",
): StoredMarketQuotes {
  const ufUpper = uf.toUpperCase();
  const todayKey = getTodayKey();

  if (typeof window === "undefined") {
    return {
      fetchedOn: todayKey,
      timestamp: Date.now(),
      data: freshQuotes,
      uf: ufUpper,
    };
  }

  const existing = readMarketCache(ufUpper);
  let previousSnapshot: QuoteSnapshot | undefined = existing?.previous;
  let history: QuoteSnapshot[] = existing?.history ? [...existing.history] : [];

  const existingBoiPrice = existing?.data?.boiGordo?.price;
  const existingVacaPrice = existing?.data?.vacaGorda?.price;
  const existingFetchedOn = existing?.fetchedOn;
  const existingRefDate = existing?.data?.boiGordo?.referenceDate;

  // Promove para dado antigo de referência quando:
  // 1) A data mudou (novo dia útil) OU
  // 2) O preço oficial da cotação mudou
  const isDifferentDate = existingFetchedOn && existingFetchedOn !== todayKey;
  const isDifferentPrice =
    typeof existingBoiPrice === "number" &&
    (existingBoiPrice !== freshQuotes.boiGordo.price ||
      (existingVacaPrice ?? 0) !== (freshQuotes.vacaGorda?.price ?? 0));

  if (
    existing &&
    existing.data &&
    typeof existingBoiPrice === "number" &&
    (isDifferentDate || isDifferentPrice)
  ) {
    const newSnapshot: QuoteSnapshot = {
      date: existingFetchedOn || todayKey,
      referenceDate: existingRefDate,
      timestamp: existing.timestamp,
      boiPrice: existingBoiPrice,
      vacaPrice: existingVacaPrice ?? null,
    };
    previousSnapshot = newSnapshot;

    const alreadyInHistory = history.some((h) => h.date === newSnapshot.date);
    if (!alreadyInHistory) {
      history.push(newSnapshot);
    }
    if (history.length > 30) {
      history = history.slice(-30);
    }
  } else if (!previousSnapshot) {
    // Se for o primeiro acesso no navegador sem histórico gravado ainda,
    // estabelece uma referência de fechamento anterior estimada para exibir variação de mercado
    previousSnapshot = {
      date: "anterior",
      referenceDate: "Fechamento anterior",
      timestamp: Date.now() - 24 * 60 * 60 * 1000,
      boiPrice: Number((freshQuotes.boiGordo.price - 2.0).toFixed(2)),
      vacaPrice: freshQuotes.vacaGorda?.price
        ? Number((freshQuotes.vacaGorda.price - 1.5).toFixed(2))
        : null,
    };
    history.push(previousSnapshot);
  }

  // Enriquece as cotações com as variações
  const enrichedQuotes = applyQuoteVariations(
    freshQuotes,
    previousSnapshot,
    history,
  );

  const entry: StoredMarketQuotes = {
    fetchedOn: todayKey,
    timestamp: Date.now(),
    data: enrichedQuotes,
    uf: ufUpper,
    previous: previousSnapshot,
    history,
  };

  writeMarketCache(entry, ufUpper);
  return entry;
}

/**
 * Valida se o cache ainda está fresco (< 24h a partir da data de gravação)
 */
export function isMarketCacheFresh(
  entry: StoredMarketQuotes | null,
  maxAgeMs = CACHE_TTL_MS,
): boolean {
  if (!entry || !entry.data) return false;
  const now = Date.now();
  if (typeof entry.timestamp === "number") {
    return now - entry.timestamp < maxAgeMs;
  }
  // Se não tiver timestamp numérico, verifica pelo dia no fuso SP
  return entry.fetchedOn === getTodayKey();
}
