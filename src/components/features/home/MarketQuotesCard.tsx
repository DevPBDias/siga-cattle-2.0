"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMarketQuotes } from "@/hooks/market/useMarketQuotes";
import type { ArrobaQuote } from "@/types/market_quote.type";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percent = (value: number) =>
  `${Math.abs(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

const arrow = (value: number) => (value > 0 ? "▲" : value < 0 ? "▼" : "•");
const tone = (value: number) =>
  value > 0 ? "text-green-300" : value < 0 ? "text-red-300" : "text-white/70";

function formatUpdateTime(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const dateStr = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
    const timeStr = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
    return `${dateStr} às ${timeStr}`;
  } catch {
    return isoString;
  }
}

function QuoteBlock({
  label,
  quote,
}: {
  label: ReactNode;
  quote: ArrobaQuote | null;
}) {
  const diffTitle =
    quote?.daily && typeof quote.previousPrice === "number"
      ? `Dado anterior: ${brl.format(quote.previousPrice)} (${quote.daily.absolute >= 0 ? "+" : ""}${brl.format(quote.daily.absolute)})`
      : undefined;

  return (
    <div className="flex flex-row items-center justify-start gap-4 p-2">
      <span className="text-[11px] font-bold text-white">{label}</span>
      {quote ? (
        <div className="flex flex-col items-end justify-end">
          <strong className="text-sm font-bold text-amber">
            {brl.format(quote.price)}
          </strong>
          {quote.daily && (
            <span
              className={cn("text-[11px] font-bold", tone(quote.daily.percent))}
              title={diffTitle}
            >
              {arrow(quote.daily.percent)} {percent(quote.daily.percent)}
            </span>
          )}
        </div>
      ) : (
        <strong className="text-sm font-bold text-white/60">—</strong>
      )}
    </div>
  );
}

export function MarketQuotesCard() {
  const { data, loading, stale } = useMarketQuotes("TO");

  return (
    <section className="relative z-20 mb-3.5 mt-6 rounded-[17px] bg-transparent px-3 py-2 text-white shadow-[0_5px_15px_rgba(30,59,43,0.045)]">
      <div className="mb-1.5 flex w-full items-center">
        <div className="flex w-full flex-row items-center justify-between gap-4 border-b border-white/20">
          {loading && !data ? (
            <div className="h-10 w-full animate-pulse rounded-md bg-white/10" />
          ) : (
            <>
              <QuoteBlock
                label={
                  <>
                    @ Boi <br /> Gordo
                  </>
                }
                quote={data?.boiGordo ?? null}
              />
              <QuoteBlock
                label={
                  <>
                    @ Vaca <br /> Gorda
                  </>
                }
                quote={data?.vacaGorda ?? null}
              />
            </>
          )}
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center justify-between gap-1 px-2 text-[10px] text-white/70">
        <span>
          Fonte: {data?.source ?? "AgroDoc AI (TO)"}
          {data?.updatedAt && ` · ${formatUpdateTime(data.updatedAt)}`}
        </span>
        {stale && data && (
          <span
            className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-200"
            title="Exibindo último valor válido em cache (offline ou temporariamente indisponível)"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Salvo em cache
          </span>
        )}
      </div>
    </section>
  );
}
