"use client";

import { useCallback, useEffect, useState } from "react";
import type { MarketQuotes } from "@/types/market_quote.type";
import { ensureTodayQuotes } from "@/lib/market/marketClient";

export function useMarketQuotes(uf = "TO") {
  const [data, setData] = useState<MarketQuotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sync = useCallback(
    async (force = false) => {
      const result = await ensureTodayQuotes(uf, force);
      setData(result.data);
      setStale(result.stale);
      setError(result.error ?? null);
      setLoading(false);
    },
    [uf],
  );

  useEffect(() => {
    void sync();
    const onVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    window.addEventListener("online", () => void sync());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", () => void sync());
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sync]);

  return {
    data,
    loading,
    error,
    stale,
    actions: {
      refetch: (force = false) => sync(force),
    },
  };
}
