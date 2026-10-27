import type { MarketQuotes } from "@/types/market_quote.type";

export interface AgroDocCotacaoResponse {
  boi_gordo_cepea_sp: number;
  boi_gordo_praca: string;
  vaca_gorda: number;
  soja?: number;
  milho?: number;
  bezerro_ms?: number;
  momento?: string;
  sinal?: Record<string, unknown>;
  atualizado: string; // ISO string com timezone
  fonte: string;
  api_version?: string;
  documentation?: string;
  license?: string;
  rate_limit?: {
    diario: number;
    restante: number;
  };
  boi_gordo_uf?: {
    uf: string;
    preco: number;
    praca: string;
  };
}

const AGRODOC_API_URL = "https://agrodocai.com.br/api/v1/cotacao";

/**
 * Formata data ISO para string DD/MM/YYYY no fuso de São Paulo
 */
function formatReferenceDate(isoString?: string): string {
  if (!isoString) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${now.getFullYear()}`;
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString.slice(0, 10);
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return isoString.slice(0, 10);
  }
}

/**
 * Normaliza a resposta da API AgroDocAI para o formato interno do aplicativo
 */
export function normalizeAgroDocQuotes(
  raw: AgroDocCotacaoResponse,
  targetUf = "TO",
): MarketQuotes {
  const ufUpper = targetUf.toUpperCase();
  const hasUfPrice =
    raw.boi_gordo_uf &&
    raw.boi_gordo_uf.uf.toUpperCase() === ufUpper &&
    typeof raw.boi_gordo_uf.preco === "number" &&
    raw.boi_gordo_uf.preco > 0;

  const boiPrice = hasUfPrice
    ? raw.boi_gordo_uf!.preco
    : raw.boi_gordo_cepea_sp;

  const vacaPrice =
    typeof raw.vaca_gorda === "number" && raw.vaca_gorda > 0
      ? raw.vaca_gorda
      : null;

  const refDate = formatReferenceDate(raw.atualizado);

  // Nome da fonte amigável
  const sourceName = hasUfPrice
    ? `AgroDoc AI · Scot (${raw.boi_gordo_uf!.praca || ufUpper})`
    : `AgroDoc AI · CEPEA/ESALQ (${ufUpper})`;

  return {
    boiGordo: {
      referenceDate: refDate,
      price: boiPrice,
    },
    vacaGorda: vacaPrice
      ? {
          referenceDate: refDate,
          price: vacaPrice,
        }
      : null,
    source: sourceName,
    updatedAt: raw.atualizado || new Date().toISOString(),
    uf: ufUpper,
    fetched_at: new Date().toISOString(),
    status: "ok",
    stale: false,
  };
}

/**
 * Consulta a API da AgroDocAI para a UF informada (padrão 'TO')
 */
export async function fetchAgroDocQuotes(targetUf = "TO"): Promise<MarketQuotes> {
  const ufUpper = targetUf.toUpperCase();
  const url = `${AGRODOC_API_URL}?uf=${encodeURIComponent(ufUpper)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "INDI-Ouro-App/2.0 (AgroDocAI-Market-Adapter)",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(
      `AgroDocAI respondeu com status ${response.status}: ${response.statusText}`,
    );
  }

  const rawJson = (await response.json()) as AgroDocCotacaoResponse;
  return normalizeAgroDocQuotes(rawJson, ufUpper);
}
